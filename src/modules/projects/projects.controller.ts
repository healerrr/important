import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  ProgressHistoryQueryDto,
  QueryProjectsDto,
  SetOwnersDto,
  UpdateProgressDto,
  UpdateProjectDto,
} from './dto/project.dto';

@ApiTags('重点项目')
@SkipThrottle()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}
  @Get()
  @ApiOperation({ summary: '筛选、搜索、排序和分页查询重点项目' })
  @ApiQuery({ name: 'year', required: false, example: 2026, description: '年度' })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: '搜索关键词（项目名称/年度目标/需求部门）',
  })
  @ApiQuery({ name: 'ownerId', required: false, description: '负责人名称（兼容旧字段）' })
  @ApiQuery({
    name: 'ownerIds',
    required: false,
    isArray: true,
    type: String,
    description: '负责人名称数组（兼容旧字段）；也支持逗号分隔字符串',
  })
  @ApiQuery({
    name: 'owners',
    required: false,
    isArray: true,
    type: String,
    description: '负责人名称数组；也支持逗号分隔字符串',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED'],
    description: '项目状态',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'updatedAt', description: '排序字段' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'desc', enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  list(@Query() q: QueryProjectsDto): Promise<unknown> {
    return this.service.list(q);
  }
  @Get(':id') @ApiOperation({ summary: '查询项目详情' }) findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<unknown> {
    return this.service.findOne(id);
  }
  @Post() @ApiOperation({ summary: '新增重点项目' }) create(
    @Body() dto: CreateProjectDto,
  ): Promise<unknown> {
    return this.service.create(dto);
  }
  @Patch(':id') @ApiOperation({ summary: '修改项目基础信息' }) update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<unknown> {
    return this.service.update(id, dto);
  }
  @Patch([':id/owner', ':id/owners']) @ApiOperation({ summary: '设置或清空多个负责人' }) setOwners(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetOwnersDto,
  ): Promise<unknown> {
    return this.service.setOwners(id, dto);
  }
  @Patch(':id/progress') @ApiOperation({ summary: '修改进度并记录历史' }) progress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
  ): Promise<unknown> {
    return this.service.updateProgress(id, dto);
  }
  @Get(':id/progress-history') @ApiOperation({ summary: '查询进度变更历史' }) history(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() q: ProgressHistoryQueryDto,
  ): Promise<unknown> {
    return this.service.progressHistory(id, q);
  }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) @ApiOperation({ summary: '删除项目' }) remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.remove(id);
  }
}
