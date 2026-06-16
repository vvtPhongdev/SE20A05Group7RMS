ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" JSONB;

UPDATE "users" AS u
SET "avatar" = cp."structured_data" -> 'avatar'
FROM "candidate_profiles" AS cp
WHERE cp."user_id" = u."id"
  AND cp."structured_data" ? 'avatar'
  AND u."avatar" IS NULL;
