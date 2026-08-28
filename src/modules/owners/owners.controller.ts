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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { QueryOwnersDto } from './dto/query-owners.dto';
import { OwnerOptionDto, OwnerOptionsResponseDto } from './dto/owner-option.dto';

@ApiTags('负责人')
@SkipThrottle()
@Controller('owners')
export class OwnersController {
  constructor(private readonly service: OwnersService) {}

  @Get('options')
  @ApiOperation({ summary: '查询内置且启用的负责人枚举，用于下拉框或选择器' })
  @ApiOkResponse({ type: OwnerOptionsResponseDto })
  options(): Promise<OwnerOptionDto[]> {
    return this.service.options();
  }

  @Get() @ApiOperation({ summary: '分页查询负责人' }) list(
    @Query() q: QueryOwnersDto,
  ): Promise<unknown> {
    return this.service.list(q);
  }
  @Post() @ApiOperation({ summary: '新增负责人' }) create(
    @Body() dto: CreateOwnerDto,
  ): Promise<unknown> {
    return this.service.create(dto);
  }
  @Patch(':id') @ApiOperation({ summary: '修改负责人' }) update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOwnerDto,
  ): Promise<unknown> {
    return this.service.update(id, dto);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除未被引用的负责人' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
