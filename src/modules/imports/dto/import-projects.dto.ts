import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';

export enum DuplicateStrategy {
  error = 'error',
  skip = 'skip',
  update = 'update',
}

export class ImportProjectsDto {
  @ApiProperty({ example: 2026, description: '年度' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
  @ApiPropertyOptional({ enum: DuplicateStrategy, deprecated: true, description: '已废弃：现在始终使用全量覆盖模式' })
  @IsEnum(DuplicateStrategy)
  @IsOptional()
  duplicateStrategy?: DuplicateStrategy;
}
