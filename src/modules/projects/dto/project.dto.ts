import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
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

export class CreateProjectDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
  @ApiProperty({ example: 'IT资产可视化平台' })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
  @ApiPropertyOptional({ example: '实现IT资产全生命周期可视化管理', default: '' })
  @Transform(trimTransform)
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  annualGoal = '';
  @ApiPropertyOptional({ nullable: true })
  @Transform(({ value }) => (value === '' ? null : value))
  @IsUUID()
  @IsOptional()
  ownerId?: string | null;
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
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class SetOwnerDto {
  @ApiProperty({ nullable: true })
  @IsDefined()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsUUID()
  ownerId!: string | null;
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
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ownerId?: string;
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
