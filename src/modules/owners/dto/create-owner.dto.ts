import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimTransform } from '../../../common/dto/pagination.dto';

export class CreateOwnerDto {
  @ApiProperty({ example: '张伟', maxLength: 50 })
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;
}
