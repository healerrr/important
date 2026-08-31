-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "owners" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "department" VARCHAR(100),
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");
