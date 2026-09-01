-- Add the multi-select column first so existing department values can be preserved.
ALTER TABLE "projects"
ADD COLUMN "departments" VARCHAR(100)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(100)[];

-- Split legacy values on the same separators accepted by the Excel importer,
-- trim whitespace, remove blanks, and keep the first occurrence order.
UPDATE "projects" AS project
SET "departments" = COALESCE(
  (
    SELECT array_agg(normalized.name ORDER BY normalized.first_position)::VARCHAR(100)[]
    FROM (
      SELECT btrim(split.value) AS name, min(split.position) AS first_position
      FROM regexp_split_to_table(
        project."department",
        E'[、,，;；/／\\r\\n]+'
      ) WITH ORDINALITY AS split(value, position)
      WHERE btrim(split.value) <> ''
      GROUP BY btrim(split.value)
    ) AS normalized
  ),
  ARRAY[]::VARCHAR(100)[]
)
WHERE project."department" IS NOT NULL
  AND btrim(project."department") <> '';

ALTER TABLE "projects" DROP COLUMN "department";
