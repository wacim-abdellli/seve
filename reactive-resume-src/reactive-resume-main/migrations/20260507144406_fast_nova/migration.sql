ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "apikey" DROP CONSTRAINT IF EXISTS "apikey_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "oauth_access_token" DROP CONSTRAINT IF EXISTS "oauth_access_token_session_id_session_id_fkey";--> statement-breakpoint
ALTER TABLE "oauth_access_token" DROP CONSTRAINT IF EXISTS "oauth_access_token_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "oauth_access_token" DROP CONSTRAINT IF EXISTS "oauth_access_token_refresh_id_oauth_refresh_token_id_fkey";--> statement-breakpoint
ALTER TABLE "oauth_client" DROP CONSTRAINT IF EXISTS "oauth_client_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "oauth_consent" DROP CONSTRAINT IF EXISTS "oauth_consent_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" DROP CONSTRAINT IF EXISTS "oauth_refresh_token_session_id_session_id_fkey";--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" DROP CONSTRAINT IF EXISTS "oauth_refresh_token_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "passkey" DROP CONSTRAINT IF EXISTS "passkey_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "two_factor" DROP CONSTRAINT IF EXISTS "two_factor_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "resume" DROP CONSTRAINT IF EXISTS "resume_user_id_user_id_fkey";--> statement-breakpoint
ALTER TABLE "resume_analysis" DROP CONSTRAINT IF EXISTS "resume_analysis_resume_id_resume_id_fkey";--> statement-breakpoint
ALTER TABLE "resume_statistics" DROP CONSTRAINT IF EXISTS "resume_statistics_resume_id_resume_id_fkey";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "reference_id" SET DATA TYPE text USING "reference_id"::text;--> statement-breakpoint
ALTER TABLE "jwks" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "session_id" SET DATA TYPE text USING "session_id"::text;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ALTER COLUMN "refresh_id" SET DATA TYPE text USING "refresh_id"::text;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "oauth_consent" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "session_id" SET DATA TYPE text USING "session_id"::text;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "passkey" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "passkey" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "two_factor" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "two_factor" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "resume" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "resume" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;--> statement-breakpoint
ALTER TABLE "resume_analysis" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "resume_analysis" ALTER COLUMN "resume_id" SET DATA TYPE text USING "resume_id"::text;--> statement-breakpoint
ALTER TABLE "resume_statistics" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;--> statement-breakpoint
ALTER TABLE "resume_statistics" ALTER COLUMN "resume_id" SET DATA TYPE text USING "resume_id"::text;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_session_id_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_refresh_id_oauth_refresh_token_id_fkey" FOREIGN KEY ("refresh_id") REFERENCES "public"."oauth_refresh_token"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "oauth_client" ADD CONSTRAINT "oauth_client_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "oauth_consent" ADD CONSTRAINT "oauth_consent_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_session_id_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE SET NULL ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ADD CONSTRAINT "oauth_refresh_token_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "resume" ADD CONSTRAINT "resume_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "resume_analysis" ADD CONSTRAINT "resume_analysis_resume_id_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resume"("id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
ALTER TABLE "resume_statistics" ADD CONSTRAINT "resume_statistics_resume_id_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resume"("id") ON DELETE CASCADE ON UPDATE NO ACTION;