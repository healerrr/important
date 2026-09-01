import type { Project } from '@prisma/client';
import { STATUS_LABELS } from './dto/project.dto';

export function mapProject(project: Project): Record<string, unknown> {
  return {
    id: project.id,
    year: project.year,
    name: project.name,
    annualGoal: project.annualGoal,
    departments: project.departments,
    status: project.status,
    statusLabel: STATUS_LABELS[project.status] || project.status,
    owners: project.owners,
    progress: project.progress,
    version: project.version,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
