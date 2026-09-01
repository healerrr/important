import { ProjectStatus } from '@prisma/client';
import type { PrismaService } from '../src/database/prisma.service';
import { ProjectSortBy, SortOrder } from '../src/modules/projects/dto/project.dto';
import { ProjectsService } from '../src/modules/projects/projects.service';

const projectId = '1b3dc6f2-1a72-4e67-a2d8-3a271947e401';
const ownerNames = ['kc', '苏春雨'];
const timestamp = new Date('2026-09-01T00:00:00.000Z');

const project = {
  id: projectId,
  year: 2026,
  name: '兼容项目',
  annualGoal: '',
  departments: ['技术部', '质量部'],
  status: ProjectStatus.NOT_STARTED,
  progress: 0,
  version: 2,
  createdAt: timestamp,
  updatedAt: timestamp,
  owners: ownerNames,
};

describe('Projects service compatibility', () => {
  it('filters the owner string array by owner names', async () => {
    let findManyArgument: unknown;
    const findMany = jest.fn().mockImplementation((argument: unknown) => {
      findManyArgument = argument;
      return Promise.resolve([project]);
    });
    const prisma = {
      project: {
        findMany,
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue({ updatedAt: timestamp }),
      },
      $transaction: jest
        .fn()
        .mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries)),
    };
    const service = new ProjectsService(prisma as unknown as PrismaService);

    await service.list({
      year: 2026,
      owners: ['苏春雨'],
      page: 1,
      pageSize: 20,
      sortBy: ProjectSortBy.updatedAt,
      sortOrder: SortOrder.desc,
    });

    expect(findManyArgument).toMatchObject({
      where: { owners: { hasSome: ['苏春雨'] } },
    });
  });

  it('normalizes legacy ownerId names before updating the string array', async () => {
    let updateArgument: unknown;
    const update = jest.fn().mockImplementation((argument: unknown) => {
      updateArgument = argument;
      return Promise.resolve(project);
    });
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({ version: 1 }),
        update,
      },
    };
    const service = new ProjectsService(prisma as unknown as PrismaService);

    await service.setOwners(projectId, { ownerId: ownerNames, version: 1 });

    expect(updateArgument).toMatchObject({
      where: { id: projectId, version: 1 },
      data: { owners: ownerNames },
    });
  });

  it('normalizes a legacy department string before updating the array column', async () => {
    let updateArgument: unknown;
    const updateMany = jest.fn().mockImplementation((argument: unknown) => {
      updateArgument = argument;
      return Promise.resolve({ count: 1 });
    });
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValueOnce({ version: 1 }).mockResolvedValueOnce(project),
        updateMany,
      },
    };
    const service = new ProjectsService(prisma as unknown as PrismaService);

    await service.update(projectId, {
      department: ['技术部', '质量部', '技术部'],
      version: 1,
    });

    expect(updateArgument).toMatchObject({
      data: { departments: ['技术部', '质量部'] },
    });
  });
});
