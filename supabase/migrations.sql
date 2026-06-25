-- ============================================================
-- Seve Resume Builder — Supabase Schema
-- Run this in your Supabase Dashboard → SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Resumes table
-- id is TEXT so it accepts both UUIDs and any string IDs.
-- This prevents "invalid input syntax for type uuid" errors.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id            TEXT NOT NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'My Resume',
  resume_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resumes DROP CONSTRAINT IF EXISTS resumes_pkey;
ALTER TABLE public.resumes ADD PRIMARY KEY (user_id, id);

-- Index for faster user-scoped queries
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;

CREATE TRIGGER set_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can view their own resumes"  ON public.resumes;
DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can read own resumes"   ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;

-- SELECT: only own resumes
CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: only insert rows where user_id = self
CREATE POLICY "Users can insert their own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only update own rows AND ensure user_id can't change
CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: only delete own rows
CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Page views table (anonymous analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_views (
  id          BIGSERIAL PRIMARY KEY,
  visitor_id  TEXT NOT NULL,
  path        TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT,
  user_agent  TEXT,
  referrer    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_page_views_visitor_path_date
  ON public.page_views (visitor_id, path, date);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Anyone can select page views" ON public.page_views;

CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION count_distinct_visitors(since TIMESTAMPTZ DEFAULT NULL)
RETURNS BIGINT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(DISTINCT visitor_id) FROM public.page_views
  WHERE ($1 IS NULL OR created_at >= $1);
$$;

REVOKE ALL ON FUNCTION count_distinct_visitors(TIMESTAMPTZ) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION count_distinct_visitors(TIMESTAMPTZ) TO anon, authenticated;

-- RPC: log a page view (handles duplicates silently, updates user data on conflict)
DROP FUNCTION IF EXISTS public.log_page_view(TEXT, TEXT, DATE);
CREATE OR REPLACE FUNCTION log_page_view(
  visitor_id TEXT,
  path TEXT,
  view_date DATE DEFAULT CURRENT_DATE,
  user_id UUID DEFAULT NULL,
  email TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  referrer TEXT DEFAULT NULL
)
RETURNS void LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.page_views (visitor_id, path, date, user_id, email, user_agent, referrer)
  VALUES (visitor_id, path, view_date, user_id, email, user_agent, referrer)
  ON CONFLICT (visitor_id, path, date) DO UPDATE
  SET
    user_id = COALESCE(EXCLUDED.user_id, page_views.user_id),
    email = COALESCE(EXCLUDED.email, page_views.email),
    user_agent = COALESCE(EXCLUDED.user_agent, page_views.user_agent),
    referrer = COALESCE(EXCLUDED.referrer, page_views.referrer);
$$;

REVOKE ALL ON FUNCTION log_page_view(TEXT, TEXT, DATE, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION log_page_view(TEXT, TEXT, DATE, UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Admins table (contains list of authorized administrators)
CREATE TABLE IF NOT EXISTS public.admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with primary administrator email
INSERT INTO public.admins (email) 
VALUES ('wassimabdello94@gmail.com') 
ON CONFLICT (email) DO NOTHING;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RPC: check if the calling user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = (auth.jwt() ->> 'email')
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;

-- RPC: fetch visitor logs securely for admins
DROP FUNCTION IF EXISTS public.get_visitor_logs(TEXT[]);
DROP FUNCTION IF EXISTS public.get_visitor_logs();
CREATE OR REPLACE FUNCTION get_visitor_logs()
RETURNS TABLE (
  visitor_id TEXT,
  email TEXT,
  user_id UUID,
  last_visited_path TEXT,
  user_agent TEXT,
  referrer TEXT,
  total_page_views BIGINT,
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ
) LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT 
    pv.visitor_id,
    MAX(pv.email) as email,
    MAX(pv.user_id::text)::uuid as user_id,
    (array_agg(pv.path ORDER BY pv.created_at DESC))[1] as last_visited_path,
    MAX(pv.user_agent) as user_agent,
    MAX(pv.referrer) as referrer,
    COUNT(*) as total_page_views,
    MIN(pv.created_at) as first_visit,
    MAX(pv.created_at) as last_visit
  FROM public.page_views pv
  WHERE EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.email = (auth.jwt() ->> 'email')
  )
  GROUP BY pv.visitor_id
  ORDER BY last_visit DESC;
$$;

REVOKE ALL ON FUNCTION get_visitor_logs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_visitor_logs() TO anon, authenticated;

-- RPC: fetch detailed visitor clickstream securely for admins
DROP FUNCTION IF EXISTS public.get_visitor_details(TEXT, TEXT[]);
DROP FUNCTION IF EXISTS public.get_visitor_details(TEXT);
CREATE OR REPLACE FUNCTION get_visitor_details(target_visitor_id TEXT)
RETURNS TABLE (
  id BIGINT,
  path TEXT,
  date DATE,
  created_at TIMESTAMPTZ
) LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT pv.id, pv.path, pv.date, pv.created_at
  FROM public.page_views pv
  WHERE pv.visitor_id = target_visitor_id
  AND EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.email = (auth.jwt() ->> 'email')
  );
$$;

REVOKE ALL ON FUNCTION get_visitor_details(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_visitor_details(TEXT) TO anon, authenticated;
