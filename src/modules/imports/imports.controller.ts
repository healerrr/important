import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportProjectsDto } from './dto/import-projects.dto';
import { ImportsService } from './imports.service';

@ApiTags('Excel导入')
@Controller('projects/import')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '从.xlsx或.xls批量导入年度重点项目' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '全量覆盖导入：导入前会删除该年度所有现有项目，请谨慎操作！',
    schema: {
      type: 'object',
      required: ['file', 'year'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Excel 文件 (.xlsx 或.xls)' },
        year: { type: 'integer', example: 2026, description: '年度' },
      },
    },
  })
  import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ImportProjectsDto,
  ): Promise<unknown> {
    return this.service.import(file, dto);
  }
}
