-- ============================================================
-- Seve Resume Builder — Supabase Schema  
-- Same content as supabase/migrations.sql
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;
CREATE TRIGGER set_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own resumes"   ON public.resumes;
DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can read own resumes"         ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes"       ON public.resumes;
DROP POLICY IF EXISTS "Users can update own resumes"       ON public.resumes;
DROP POLICY IF EXISTS "Users can delete own resumes"       ON public.resumes;

CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes"
  ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE USING (auth.uid() = user_id);

-- Page views
CREATE TABLE IF NOT EXISTS public.page_views (
  id          BIGSERIAL PRIMARY KEY,
  visitor_id  TEXT NOT NULL,
  path        TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- RPC: log a page view (handles duplicates silently)
CREATE OR REPLACE FUNCTION log_page_view(visitor_id TEXT, path TEXT, view_date DATE DEFAULT CURRENT_DATE)
RETURNS void LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.page_views (visitor_id, path, date)
  VALUES (visitor_id, path, view_date)
  ON CONFLICT (visitor_id, path, date) DO NOTHING;
$$;

REVOKE ALL ON FUNCTION log_page_view(TEXT, TEXT, DATE) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION log_page_view(TEXT, TEXT, DATE) TO anon, authenticated;
