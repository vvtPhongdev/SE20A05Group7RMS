ALTER TABLE "departments"
  ADD COLUMN "skills" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "bachelor_requirements" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "departments" AS department
SET "bachelor_requirements" = organization."settings" -> 'departmentBachelorRequirements' -> department."id"
FROM "organizations" AS organization
WHERE department."organization_id" = organization."id"
  AND jsonb_typeof(organization."settings" -> 'departmentBachelorRequirements') = 'object'
  AND jsonb_typeof(organization."settings" -> 'departmentBachelorRequirements' -> department."id") = 'array';
