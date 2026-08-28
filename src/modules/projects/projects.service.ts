import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../../common/exceptions/api.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProjectDto,
  ProgressHistoryQueryDto,
  QueryProjectsDto,
  SetOwnerDto,
  UpdateProgressDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { mapProject } from './project.mapper';

const withOwner = { owner: true } as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: QueryProjectsDto): Promise<{ items: unknown[]; meta: Record<string, unknown> }> {
    const where: Prisma.ProjectWhereInput = {
      year: q.year,
      ...(q.ownerId ? { ownerId: q.ownerId } : {}),
      ...(q.keyword
        ? {
            OR: [
              { name: { contains: q.keyword, mode: 'insensitive' } },
              { annualGoal: { contains: q.keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.ProjectOrderByWithRelationInput = { [q.sortBy]: q.sortOrder };
    const [items, total, latest] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: withOwner,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.project.count({ where }),
      this.prisma.project.findFirst({
        where,
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);
    return {
      items: items.map(mapProject),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
        latestUpdatedAt: latest?.updatedAt.toISOString() ?? null,
      },
    };
  }

  async findOne(id: string): Promise<Record<string, unknown>> {
    return mapProject(await this.getProject(id));
  }

  async create(dto: CreateProjectDto): Promise<Record<string, unknown>> {
    if (dto.ownerId) await this.requireOwner(dto.ownerId, false);
    try {
      const project = await this.prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: {
            year: dto.year,
            name: dto.name,
            annualGoal: dto.annualGoal,
            ownerId: dto.ownerId ?? null,
            progress: dto.progress,
          },
          include: withOwner,
        });
        if (dto.progress > 0)
          await tx.projectProgressLog.create({
            data: { projectId: created.id, oldProgress: 0, newProgress: dto.progress },
          });
        return created;
      });
      return mapProject(project);
    } catch (e) {
      this.throwDuplicate(e);
      throw e;
    }
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Record<string, unknown>> {
    await this.assertVersion(id, dto.version);
    const data: Prisma.ProjectUpdateManyMutationInput = {
      ...(dto.year !== undefined ? { year: dto.year } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.annualGoal !== undefined ? { annualGoal: dto.annualGoal } : {}),
    };
    try {
      const result = await this.prisma.project.updateMany({
        where: { id, version: dto.version },
        data: { ...data, version: { increment: 1 }, updatedAt: new Date() },
      });
      if (!result.count) throw this.versionConflict();
      return mapProject(await this.getProject(id));
    } catch (e) {
      this.throwDuplicate(e);
      throw e;
    }
  }

  async setOwner(id: string, dto: SetOwnerDto): Promise<Record<string, unknown>> {
    await this.assertVersion(id, dto.version);
    if (dto.ownerId) await this.requireOwner(dto.ownerId, true);
    const result = await this.prisma.project.updateMany({
      where: { id, version: dto.version },
      data: { ownerId: dto.ownerId, version: { increment: 1 }, updatedAt: new Date() },
    });
    if (!result.count) throw this.versionConflict();
    return mapProject(await this.getProject(id));
  }

  async updateProgress(id: string, dto: UpdateProgressDto): Promise<Record<string, unknown>> {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.project.findUnique({ where: { id } });
      if (!current) throw this.notFound();
      if (current.version !== dto.version) throw this.versionConflict();
      if (current.progress === dto.progress) return;
      const changed = await tx.project.updateMany({
        where: { id, version: dto.version },
        data: { progress: dto.progress, version: { increment: 1 }, updatedAt: new Date() },
      });
      if (!changed.count) throw this.versionConflict();
      await tx.projectProgressLog.create({
        data: { projectId: id, oldProgress: current.progress, newProgress: dto.progress },
      });
    });
    return mapProject(await this.getProject(id));
  }

  async progressHistory(
    id: string,
    q: ProgressHistoryQueryDto,
  ): Promise<{ items: unknown[]; meta: Record<string, unknown> }> {
    await this.getProject(id);
    const where = { projectId: id };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.projectProgressLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.projectProgressLog.count({ where }),
    ]);
    return {
      items: items.map((x) => ({
        id: x.id,
        projectId: x.projectId,
        oldProgress: x.oldProgress,
        newProgress: x.newProgress,
        createdAt: x.createdAt.toISOString(),
      })),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    };
  }

  async remove(id: string): Promise<void> {
    await this.getProject(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.projectProgressLog.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    });
  }

  private async getProject(
    id: string,
  ): Promise<Prisma.ProjectGetPayload<{ include: { owner: true } }>> {
    const project = await this.prisma.project.findUnique({ where: { id }, include: withOwner });
    if (!project) throw this.notFound();
    return project;
  }
  private async assertVersion(id: string, version: number): Promise<void> {
    const p = await this.prisma.project.findUnique({ where: { id }, select: { version: true } });
    if (!p) throw this.notFound();
    if (p.version !== version) throw this.versionConflict();
  }
  private async requireOwner(id: string, activeOnly: boolean): Promise<void> {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner)
      throw new ApiException(ErrorCode.OWNER_NOT_FOUND, '负责人不存在', HttpStatus.BAD_REQUEST);
    if (activeOnly && !owner.isActive)
      throw new ApiException(
        ErrorCode.OWNER_INACTIVE,
        '不能设置已停用的负责人',
        HttpStatus.BAD_REQUEST,
      );
  }
  private notFound(): ApiException {
    return new ApiException(ErrorCode.PROJECT_NOT_FOUND, '重点项目不存在', HttpStatus.NOT_FOUND);
  }
  private versionConflict(): ApiException {
    return new ApiException(
      ErrorCode.PROJECT_VERSION_CONFLICT,
      '项目已被其他人修改，请刷新后重试',
      HttpStatus.CONFLICT,
    );
  }
  private throwDuplicate(e: unknown): void {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      throw new ApiException(
        ErrorCode.PROJECT_DUPLICATE,
        '同一年度下项目名称不能重复',
        HttpStatus.CONFLICT,
      );
  }
}
