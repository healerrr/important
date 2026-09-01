import { ProjectStatus } from '@prisma/client';
import type { PrismaService } from '../src/database/prisma.service';
import { ProjectsService } from '../src/modules/projects/projects.service';

const projectId = '1b3dc6f2-1a72-4e67-a2d8-3a271947e401';
const ownerId = 'fc2d3b21-45cc-4fbf-b4f6-40167d706753';
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
  owners: [
    {
      id: ownerId,
      name: '李红',
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
};

describe('Projects service compatibility', () => {
  it('normalizes a legacy ownerId body before updating the owner relation', async () => {
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
      owner: {
        findMany: jest.fn().mockResolvedValue([{ id: ownerId, isActive: true }]),
      },
    };
    const service = new ProjectsService(prisma as unknown as PrismaService);

    await service.setOwners(projectId, { ownerId: [ownerId], version: 1 });

    expect(updateArgument).toMatchObject({
      where: { id: projectId, version: 1 },
      data: { owners: { set: [{ id: ownerId }] } },
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
