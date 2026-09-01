import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateProjectDto,
  QueryProjectsDto,
  SetOwnersDto,
  UpdateProjectDto,
} from '../src/modules/projects/dto/project.dto';

const ownerId1 = 'fc2d3b21-45cc-4fbf-b4f6-40167d706753';
const ownerId2 = 'cddfd403-4054-4f46-86e2-6f46256be5cf';
const validationOptions = { whitelist: true, forbidNonWhitelisted: true } as const;

describe('Project DTO compatibility', () => {
  it('accepts the legacy ownerId body when changing owners', async () => {
    const dto = plainToInstance(SetOwnersDto, { ownerId: ownerId1, version: 1 });

    expect(await validate(dto, validationOptions)).toEqual([]);
    expect(dto.ownerId).toBe(ownerId1);
    expect(dto.ownerIds).toBeUndefined();
  });

  it('accepts the ownerIds array body when changing owners', async () => {
    const dto = plainToInstance(SetOwnersDto, { ownerIds: [ownerId1, ownerId2], version: 1 });

    expect(await validate(dto, validationOptions)).toEqual([]);
    expect(dto.ownerIds).toEqual([ownerId1, ownerId2]);
  });

  it('accepts an owner array under the legacy ownerId key', async () => {
    const dto = plainToInstance(SetOwnersDto, { ownerId: [ownerId1, ownerId2], version: 1 });

    expect(await validate(dto, validationOptions)).toEqual([]);
    expect(dto.ownerId).toEqual([ownerId1, ownerId2]);
  });

  it('accepts legacy owner and department fields when creating or updating', async () => {
    const createDto = plainToInstance(CreateProjectDto, {
      year: 2026,
      name: '兼容项目',
      ownerId: ownerId1,
      department: '技术部、质量部',
    });
    const updateDto = plainToInstance(UpdateProjectDto, {
      version: 1,
      department: ['技术部', '质量部'],
    });

    expect(await validate(createDto, validationOptions)).toEqual([]);
    expect(await validate(updateDto, validationOptions)).toEqual([]);
  });

  it('accepts single, repeated, comma-separated, and empty owner filters', async () => {
    const single = plainToInstance(QueryProjectsDto, { ownerId: ownerId1 });
    const multiple = plainToInstance(QueryProjectsDto, { ownerIds: `${ownerId1},${ownerId2}` });
    const empty = plainToInstance(QueryProjectsDto, { ownerId: '' });

    expect(await validate(single, validationOptions)).toEqual([]);
    expect(await validate(multiple, validationOptions)).toEqual([]);
    expect(await validate(empty, validationOptions)).toEqual([]);
    expect(multiple.ownerIds).toEqual([ownerId1, ownerId2]);
    expect(empty.ownerId).toBeUndefined();
  });
});
