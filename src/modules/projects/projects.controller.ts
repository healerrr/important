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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  ProgressHistoryQueryDto,
  QueryProjectsDto,
  SetOwnerDto,
  UpdateProgressDto,
  UpdateProjectDto,
} from './dto/project.dto';

@ApiTags('重点项目')
@SkipThrottle()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}
  @Get() @ApiOperation({ summary: '筛选、搜索、排序和分页查询重点项目' }) list(
    @Query() q: QueryProjectsDto,
  ): Promise<unknown> {
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
  @Patch(':id/owner') @ApiOperation({ summary: '设置或取消负责人' }) setOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetOwnerDto,
  ): Promise<unknown> {
    return this.service.setOwner(id, dto);
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
