CREATE TYPE "DuplicateStrategy" AS ENUM ('error', 'skip', 'update');
CREATE TYPE "ImportStatus" AS ENUM ('SUCCESS', 'FAILED');

CREATE TABLE "owners" (
  "id" UUID NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "owners_name_key" ON "owners"("name");

CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "year" INTEGER NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "annual_goal" VARCHAR(2000) NOT NULL DEFAULT '',
  "owner_id" UUID,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "projects_progress_check" CHECK ("progress" BETWEEN 0 AND 100),
  CONSTRAINT "projects_year_check" CHECK ("year" BETWEEN 2000 AND 2100)
);
CREATE UNIQUE INDEX "projects_year_name_key" ON "projects"("year", "name");
CREATE INDEX "projects_year_idx" ON "projects"("year");
CREATE INDEX "projects_owner_id_idx" ON "projects"("owner_id");
CREATE INDEX "projects_updated_at_idx" ON "projects"("updated_at");
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "project_progress_logs" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "old_progress" INTEGER NOT NULL,
  "new_progress" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_progress_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_progress_logs_project_created_idx" ON "project_progress_logs"("project_id", "created_at");
ALTER TABLE "project_progress_logs" ADD CONSTRAINT "project_progress_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "import_batches" (
  "id" UUID NOT NULL,
  "original_filename" VARCHAR(255) NOT NULL,
  "year" INTEGER NOT NULL,
  "duplicate_strategy" "DuplicateStrategy" NOT NULL,
  "status" "ImportStatus" NOT NULL,
  "total_rows" INTEGER NOT NULL DEFAULT 0,
  "imported_rows" INTEGER NOT NULL DEFAULT 0,
  "updated_rows" INTEGER NOT NULL DEFAULT 0,
  "skipped_rows" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "import_batches_created_at_idx" ON "import_batches"("created_at");
