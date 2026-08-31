-- CreateTable
CREATE TABLE "_OwnerToProject" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- Preserve every existing project-owner association before removing projects.owner_id.
INSERT INTO "_OwnerToProject" ("A", "B")
SELECT "owner_id", "id"
FROM "projects"
WHERE "owner_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_OwnerToProject_AB_unique" ON "_OwnerToProject"("A", "B");

-- CreateIndex
CREATE INDEX "_OwnerToProject_B_index" ON "_OwnerToProject"("B");

-- AddForeignKey
ALTER TABLE "_OwnerToProject" ADD CONSTRAINT "_OwnerToProject_A_fkey"
FOREIGN KEY ("A") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OwnerToProject" ADD CONSTRAINT "_OwnerToProject_B_fkey"
FOREIGN KEY ("B") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_owner_id_fkey";

-- DropIndex
DROP INDEX "projects_owner_id_idx";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "owner_id";
