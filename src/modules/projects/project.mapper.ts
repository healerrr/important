import type { Owner, Project } from '@prisma/client';

type ProjectWithOwner = Project & { owner: Owner | null };

export function mapProject(project: ProjectWithOwner): Record<string, unknown> {
  return {
    id: project.id,
    year: project.year,
    name: project.name,
    annualGoal: project.annualGoal,
    owner: project.owner
      ? { id: project.owner.id, name: project.owner.name, isActive: project.owner.isActive }
      : null,
    progress: project.progress,
    version: project.version,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
