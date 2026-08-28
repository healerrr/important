import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BooleanTransform, PaginationDto, trimTransform } from '../../../common/dto/pagination.dto';

export class QueryOwnersDto extends PaginationDto {
  @ApiPropertyOptional()
  @Transform(trimTransform)
  @IsString()
  @MaxLength(50)
  @IsOptional()
  keyword?: string;
  @ApiPropertyOptional({ default: true })
  @BooleanTransform
  @IsOptional()
  activeOnly = true;
  override pageSize = 100;
}
