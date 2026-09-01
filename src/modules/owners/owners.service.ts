import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PrismaService } from '../../database/prisma.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { QueryOwnersDto } from './dto/query-owners.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import type { OwnerOptionDto } from './dto/owner-option.dto';
import { BUILT_IN_OWNER_NAMES } from './owner-options.constants';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async options(): Promise<OwnerOptionDto[]> {
    const owners = await this.prisma.owner.findMany({
      where: { isActive: true, name: { in: [...BUILT_IN_OWNER_NAMES] } },
      select: { id: true, name: true },
    });
    const ownersByName = new Map(owners.map((owner) => [owner.name, owner]));
    return BUILT_IN_OWNER_NAMES.flatMap((name) => {
      const owner = ownersByName.get(name);
      return owner ? [{ value: owner.name, label: owner.name }] : [];
    });
  }

  async list(q: QueryOwnersDto): Promise<{ items: unknown[]; meta: Record<string, unknown> }> {
    const where: Prisma.OwnerWhereInput = {
      ...(q.activeOnly ? { isActive: true } : {}),
      ...(q.keyword ? { name: { contains: q.keyword, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.owner.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.owner.count({ where }),
    ]);
    return {
      items,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    };
  }

  async create(dto: CreateOwnerDto): Promise<unknown> {
    try {
      return await this.prisma.owner.create({ data: dto });
    } catch (e) {
      if (this.isUnique(e))
        throw new ApiException(ErrorCode.OWNER_DUPLICATE, '负责人姓名已存在', HttpStatus.CONFLICT);
      throw e;
    }
  }

  async update(id: string, dto: UpdateOwnerDto): Promise<unknown> {
    const current = await this.getOwner(id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.owner.update({ where: { id }, data: dto });
        if (dto.name !== undefined && dto.name !== current.name) {
          const projects = await tx.project.findMany({
            where: { owners: { has: current.name } },
            select: { id: true, owners: true },
          });
          for (const project of projects) {
            const owners = [
              ...new Set(
                project.owners.map((owner) => (owner === current.name ? dto.name! : owner)),
              ),
            ];
            await tx.project.update({
              where: { id: project.id },
              data: { owners, version: { increment: 1 }, updatedAt: new Date() },
            });
          }
        }
        return updated;
      });
    } catch (e) {
      if (this.isUnique(e))
        throw new ApiException(ErrorCode.OWNER_DUPLICATE, '负责人姓名已存在', HttpStatus.CONFLICT);
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    const owner = await this.getOwner(id);
    const used = await this.prisma.project.count({ where: { owners: { has: owner.name } } });
    if (used)
      throw new ApiException(
        ErrorCode.OWNER_IN_USE,
        '负责人已被项目引用，不能删除',
        HttpStatus.CONFLICT,
      );
    await this.prisma.owner.delete({ where: { id } });
  }

  private async getOwner(id: string): Promise<{ id: string; name: string }> {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!owner)
      throw new ApiException(ErrorCode.OWNER_NOT_FOUND, '负责人不存在', HttpStatus.NOT_FOUND);
    return owner;
  }
  private isUnique(e: unknown): boolean {
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
  }
}
