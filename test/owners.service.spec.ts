import type { PrismaService } from '../src/database/prisma.service';
import { OwnersService } from '../src/modules/owners/owners.service';

describe('Owners service string values', () => {
  it('returns owner names as option values', async () => {
    const prisma = {
      owner: {
        findMany: jest.fn().mockResolvedValue([{ id: 'owner-id', name: '袁志刚' }]),
      },
    };
    const service = new OwnersService(prisma as unknown as PrismaService);

    const options = await service.options();

    expect(options).toContainEqual({ value: '袁志刚', label: '袁志刚' });
  });

  it('prevents deleting an owner name stored in a project array', async () => {
    const count = jest.fn().mockResolvedValue(1);
    const prisma = {
      owner: {
        findUnique: jest.fn().mockResolvedValue({ id: 'owner-id', name: '苏春雨' }),
        delete: jest.fn(),
      },
      project: { count },
    };
    const service = new OwnersService(prisma as unknown as PrismaService);

    await expect(service.remove('owner-id')).rejects.toMatchObject({ status: 409 });
    expect(count).toHaveBeenCalledWith({ where: { owners: { has: '苏春雨' } } });
  });
});
