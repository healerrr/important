import type { Project } from '@prisma/client';
import { ProjectStatus } from '@prisma/client';
import { mapProject } from '../src/modules/projects/project.mapper';

describe('Project mapper', () => {
  it('returns owners and departments as string arrays', () => {
    const timestamp = new Date('2026-08-31T00:00:00.000Z');
    const project: Project = {
      id: 'project-1',
      year: 2026,
      name: '重点项目',
      annualGoal: '',
      departments: ['质量部', '技术部'],
      status: ProjectStatus.NOT_STARTED,
      progress: 0,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      owners: ['袁志刚', '李红'],
    };

    const mapped = mapProject(project);

    expect(mapped.departments).toEqual(['质量部', '技术部']);
    expect(mapped.owners).toEqual(['袁志刚', '李红']);
  });
});
