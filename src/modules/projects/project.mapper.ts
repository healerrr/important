import type { Owner, Project } from '@prisma/client';
import { STATUS_LABELS } from './dto/project.dto';

type ProjectWithOwners = Project & { owners: Owner[] };

export function mapProject(project: ProjectWithOwners): Record<string, unknown> {
  return {
    id: project.id,
    year: project.year,
    name: project.name,
    annualGoal: project.annualGoal,
    department: project.department,
    status: project.status,
    statusLabel: STATUS_LABELS[project.status] || project.status,
    owners: [...project.owners]
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
      .map((owner) => ({ id: owner.id, name: owner.name, isActive: owner.isActive })),
    progress: project.progress,
    version: project.version,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
