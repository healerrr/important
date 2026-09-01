import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateProjectDto,
  QueryProjectsDto,
  SetOwnersDto,
  UpdateProjectDto,
} from '../src/modules/projects/dto/project.dto';

const owner1 = 'kc';
const owner2 = '苏春雨';
const validationOptions = { whitelist: true, forbidNonWhitelisted: true } as const;

describe('Project DTO compatibility', () => {
  it('accepts owner name arrays when changing owners', async () => {
    const dto = plainToInstance(SetOwnersDto, { owners: [owner1, owner2], version: 1 });

    expect(await validate(dto, validationOptions)).toEqual([]);
    expect(dto.owners).toEqual([owner1, owner2]);
  });

  it('accepts owner names under the legacy ownerIds key', async () => {
    const dto = plainToInstance(SetOwnersDto, { ownerIds: [owner1, owner2], version: 1 });

    expect(await validate(dto, validationOptions)).toEqual([]);
    expect(dto.ownerIds).toEqual([owner1, owner2]);
  });

  it('accepts an owner name array under the legacy ownerId key', async () => {
    const dto = plainToInstance(SetOwnersDto, { ownerId: [owner1, owner2], version: 1 });

    expect(await validate(dto, validationOptions)).toEqual([]);
    expect(dto.ownerId).toEqual([owner1, owner2]);
  });

  it('accepts legacy owner and department fields when creating or updating', async () => {
    const createDto = plainToInstance(CreateProjectDto, {
      year: 2026,
      name: '兼容项目',
      ownerId: owner1,
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
    const single = plainToInstance(QueryProjectsDto, { ownerId: owner1 });
    const multiple = plainToInstance(QueryProjectsDto, { owners: `${owner1},${owner2}` });
    const empty = plainToInstance(QueryProjectsDto, { ownerId: '' });

    expect(await validate(single, validationOptions)).toEqual([]);
    expect(await validate(multiple, validationOptions)).toEqual([]);
    expect(await validate(empty, validationOptions)).toEqual([]);
    expect(multiple.owners).toEqual([owner1, owner2]);
    expect(empty.ownerId).toBeUndefined();
  });
});
