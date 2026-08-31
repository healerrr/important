import type { Owner, Project } from '@prisma/client';
import { ProjectStatus } from '@prisma/client';
import { mapProject } from '../src/modules/projects/project.mapper';

describe('Project mapper', () => {
  it('returns every project owner as a sorted array', () => {
    const timestamp = new Date('2026-08-31T00:00:00.000Z');
    const project: Project & { owners: Owner[] } = {
      id: 'project-1',
      year: 2026,
      name: '重点项目',
      annualGoal: '',
      department: null,
      status: ProjectStatus.NOT_STARTED,
      progress: 0,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      owners: [
        {
          id: 'owner-2',
          name: '袁志刚',
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: 'owner-1',
          name: '李红',
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    };

    expect(mapProject(project).owners).toEqual([
      { id: 'owner-1', name: '李红', isActive: true },
      { id: 'owner-2', name: '袁志刚', isActive: true },
    ]);
  });
});
