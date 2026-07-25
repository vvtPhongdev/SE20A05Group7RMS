DO $$
DECLARE
  target_user_id TEXT;
  target_organization_id TEXT;
BEGIN
  SELECT "id", "organization_id"
  INTO target_user_id, target_organization_id
  FROM "users"
  WHERE LOWER("email") = 'nlbtboss1@gmail.com'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    -- This account belongs to the demo seed data and is not guaranteed to
    -- exist in every environment. There is nothing to consolidate when it is
    -- absent, so allow production migration deployment to continue.
    RAISE NOTICE 'Skipping department-head consolidation: nlbtboss1@gmail.com was not found';
    RETURN;
  END IF;

  UPDATE "users"
  SET "role" = 'DEPARTMENT_HEAD', "is_active" = TRUE
  WHERE "id" = target_user_id;

  UPDATE "recruitment_requests" AS request
  SET "created_by_id" = target_user_id
  FROM "departments" AS department
  WHERE request."department_id" = department."id"
    AND department."organization_id" = target_organization_id
    AND request."created_by_id" <> target_user_id;

  UPDATE "departments"
  SET "head_user_id" = target_user_id
  WHERE "organization_id" = target_organization_id;

  UPDATE "users"
  SET "role" = 'CANDIDATE', "is_active" = FALSE
  WHERE "organization_id" = target_organization_id
    AND "role" = 'DEPARTMENT_HEAD'
    AND "id" <> target_user_id;
END $$;
