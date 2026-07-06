UPDATE "users"
SET "role" = 'HR_LEADER'
WHERE "role" = 'HR_' || 'RECRUITER';
