-- Replace the 4-value Role enum (ADMIN, REVIEWER, CONTRIBUTOR, VIEWER) with a 3-tier
-- hierarchy (SUPER_ADMIN, ADMIN, DEV). Existing rows are remapped rather than dropped:
--   REVIEWER    -> ADMIN  (review authority now lives only at Admin/Super Admin)
--   CONTRIBUTOR -> DEV
--   VIEWER      -> DEV
--   ADMIN       -> ADMIN, except the earliest-created Admin per tenant (organization, or
--                  each individual/solo account, which has no organizationId and is its
--                  own tenant) is promoted to SUPER_ADMIN, so every tenant keeps exactly
--                  one top-level owner.

-- CreateEnum
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DEV');

-- AlterTable: shadow column on the new enum
ALTER TABLE "User" ADD COLUMN "role_new" "Role_new";

-- Base remap
UPDATE "User"
SET "role_new" = CASE
  WHEN "role" = 'ADMIN' THEN 'ADMIN'
  WHEN "role" = 'REVIEWER' THEN 'ADMIN'
  ELSE 'DEV'
END::"Role_new";

-- Promote one Super Admin per tenant
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE("organizationId"::text, id)
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM "User"
  WHERE "role" = 'ADMIN'
)
UPDATE "User" u
SET "role_new" = 'SUPER_ADMIN'
FROM ranked r
WHERE u.id = r.id AND r.rn = 1;

-- Swap columns
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'DEV';

-- Swap enum types
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
