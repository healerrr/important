import { ApiProperty } from '@nestjs/swagger';

export class OwnerOptionDto {
  @ApiProperty({ type: String, example: 'd4bc5cb6-e5e4-4452-b0cf-33c101aa0181' })
  value!: string;

  @ApiProperty({ type: String, example: '袁志刚' })
  label!: string;
}

export class OwnerOptionsResponseDto {
  @ApiProperty({ type: () => [OwnerOptionDto] })
  data!: OwnerOptionDto[];
}
