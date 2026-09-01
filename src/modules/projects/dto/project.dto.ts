import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsEnum,
  IsArray,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationDto, trimTransform } from '../../../common/dto/pagination.dto';

const trimStringArray = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;
  return Array.isArray(input)
    ? input.map((item: unknown) => (typeof item === 'string' ? item.trim() : item))
    : input;
};

const trimNullableString = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;
  if (input === null || input === undefined) return input;
  if (Array.isArray(input))
    return input.map((item: unknown) => (typeof item === 'string' ? item.trim() : item));
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  return trimmed || null;
};

const normalizeOptionalQueryValue = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;
  return input === '' || input === null || input === 'null' || input === 'undefined'
    ? undefined
    : input;
};

const normalizeQueryStringArray = ({ value }: TransformFnParams): unknown => {
  const input: unknown = value;
  if (
    input === '' ||
    input === null ||
    input === undefined ||
    input === 'null' ||
    input === 'undefined'
  )
    return undefined;
  if (Array.isArray(input))
    return input.map((item: unknown) => (typeof item === 'string' ? item.trim() : item));
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  if (trimmed === '[]') return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed))
        return parsed.map((item: unknown) => (typeof item === 'string' ? item.trim() : item));
    } catch {
      return [trimmed];
    }
  }
  return trimmed.split(',').map((item) => item.trim());
};

export enum ProjectStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.NOT_STARTED]: '未启动',
  [ProjectStatus.IN_PROGRESS]: '进行中',
  [ProjectStatus.COMPLETED]: '已完成',
  [ProjectStatus.PAUSED]: '已暂停',
  [ProjectStatus.CANCELLED]: '已取消',
};

export class CreateProjectDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
  @ApiProperty({ example: 'IT 资产可视化平台' })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
  @ApiPropertyOptional({ example: '实现 IT 资产全生命周期可视化管理', default: '' })
  @Transform(trimTransform)
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  annualGoal = '';
  @ApiPropertyOptional({ type: [String], example: ['技术部', '质量部'], default: [] })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  @IsOptional()
  departments?: string[];
  @ApiPropertyOptional({ deprecated: true, nullable: true, example: '技术部' })
  @Transform(trimNullableString)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  @IsOptional()
  department?: string | string[] | null;
  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.NOT_STARTED })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
  @ApiPropertyOptional({ type: [String], format: 'uuid', default: [] })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  ownerIds?: string[];
  @ApiPropertyOptional({ deprecated: true, nullable: true, format: 'uuid' })
  @Transform(trimNullableString)
  @IsUUID('4', { each: true })
  @IsOptional()
  ownerId?: string | string[] | null;
  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress = 0;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;
  @ApiPropertyOptional()
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  name?: string;
  @ApiPropertyOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  annualGoal?: string;
  @ApiPropertyOptional({ type: [String], example: ['技术部', '质量部'] })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  @IsOptional()
  departments?: string[];
  @ApiPropertyOptional({ deprecated: true, nullable: true, example: '技术部' })
  @Transform(trimNullableString)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  @IsOptional()
  department?: string | string[] | null;
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class SetOwnersDto {
  @ApiPropertyOptional({ type: [String], format: 'uuid', example: [] })
  @ValidateIf((dto: SetOwnersDto) => dto.ownerId === undefined)
  @IsDefined()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ownerIds?: string[];
  @ApiPropertyOptional({ deprecated: true, nullable: true, format: 'uuid' })
  @Transform(trimNullableString)
  @IsUUID('4', { each: true })
  @IsOptional()
  ownerId?: string | string[] | null;
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class UpdateProgressDto {
  @ApiProperty({ example: 81 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export enum ProjectSortBy {
  name = 'name',
  progress = 'progress',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}
export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class QueryProjectsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year = new Date().getFullYear();
  @ApiPropertyOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(200)
  @IsOptional()
  keyword?: string;
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @Transform(normalizeQueryStringArray)
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  ownerIds?: string[];
  @ApiPropertyOptional({ format: 'uuid' })
  @Transform(normalizeOptionalQueryValue)
  @IsUUID('4')
  @IsOptional()
  ownerId?: string;
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
  @ApiPropertyOptional({ enum: ProjectSortBy, default: ProjectSortBy.updatedAt })
  @IsEnum(ProjectSortBy)
  @IsOptional()
  sortBy = ProjectSortBy.updatedAt;
  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.desc })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder = SortOrder.desc;
}

export class ProgressHistoryQueryDto extends PaginationDto {}
