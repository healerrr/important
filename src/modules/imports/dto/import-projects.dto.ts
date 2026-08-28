import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DuplicateStrategy } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ImportProjectsDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
  @ApiPropertyOptional({ enum: DuplicateStrategy, default: DuplicateStrategy.error })
  @IsEnum(DuplicateStrategy)
  @IsOptional()
  duplicateStrategy: DuplicateStrategy = DuplicateStrategy.error;
}
