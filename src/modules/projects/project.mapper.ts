import type { Owner, Project, ProjectStatus } from '@prisma/client';
import { STATUS_LABELS } from './dto/project.dto';

type ProjectWithOwner = Project & { owner: Owner | null };

export function mapProject(project: ProjectWithOwner): Record<string, unknown> {
  return {
    id: project.id,
    year: project.year,
    name: project.name,
    annualGoal: project.annualGoal,
    department: project.department,
    status: project.status,
    statusLabel: STATUS_LABELS[project.status as ProjectStatus] || project.status,
    owners: project.owner
      ? [{ id: project.owner.id, name: project.owner.name, isActive: project.owner.isActive }]
      : [],
    progress: project.progress,
    version: project.version,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
