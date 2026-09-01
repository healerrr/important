-- Store project owners as names, matching the departments multi-select model.
ALTER TABLE "projects"
ADD COLUMN "owners" VARCHAR(50)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(50)[];

-- Preserve all existing project-owner associations as a de-duplicated name array.
UPDATE "projects" AS project
SET "owners" = COALESCE(
  (
    SELECT array_agg(owner_record."name" ORDER BY owner_record."name")::VARCHAR(50)[]
    FROM "_OwnerToProject" AS relation
    INNER JOIN "owners" AS owner_record ON owner_record."id" = relation."A"
    WHERE relation."B" = project."id"
  ),
  ARRAY[]::VARCHAR(50)[]
);

-- Project ownership is no longer relational; the owner registry remains for option management.
DROP TABLE "_OwnerToProject";
