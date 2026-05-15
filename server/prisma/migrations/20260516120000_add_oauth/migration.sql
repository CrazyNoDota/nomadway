-- Allow OAuth users (no password)
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Track which provider the account was created with
ALTER TABLE "users" ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'email';

-- Link Google account
ALTER TABLE "users" ADD COLUMN "google_id" TEXT;
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
