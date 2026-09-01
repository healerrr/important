import { ApiProperty } from '@nestjs/swagger';

export class OwnerOptionDto {
  @ApiProperty({ type: String, example: '袁志刚' })
  value!: string;

  @ApiProperty({ type: String, example: '袁志刚' })
  label!: string;
}

export class OwnerOptionsResponseDto {
  @ApiProperty({ type: () => [OwnerOptionDto] })
  data!: OwnerOptionDto[];
}
