import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DuplicateStrategy, ImportStatus, Prisma } from '@prisma/client';
import { basename, extname } from 'node:path';
import { ErrorCode } from '../../common/constants/error-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../database/prisma.service';
import { ImportProjectsDto } from './dto/import-projects.dto';
import { parseExcel, type ExcelRowError, type ParsedProjectRow } from './excel.parser';

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async import(
    file: Express.Multer.File | undefined,
    dto: ImportProjectsDto,
  ): Promise<Record<string, number | string>> {
    const filename = basename(file?.originalname ?? 'unknown');
    let totalRows = 0;
    try {
      if (!file)
        throw new ApiException(
          ErrorCode.EXCEL_INVALID_FILE,
          '请选择 Excel 文件',
          HttpStatus.BAD_REQUEST,
        );
      this.validateFile(file);
      let parsed: { rows: ParsedProjectRow[]; errors: ExcelRowError[] };
      try {
        parsed = parseExcel(file.buffer, this.config.get<number>('EXCEL_MAX_ROWS', 2000));
      } catch {
        throw new ApiException(
          ErrorCode.EXCEL_INVALID_FILE,
          'Excel 文件损坏或格式不正确',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      totalRows = parsed.rows.length;
      if (parsed.errors.length)
        throw new ApiException(
          ErrorCode.EXCEL_VALIDATION_FAILED,
          'Excel 文件存在数据错误',
          HttpStatus.UNPROCESSABLE_ENTITY,
          { errors: parsed.errors },
        );
      return await this.execute(filename, dto, parsed.rows);
    } catch (error) {
      const errors =
        error instanceof ApiException &&
        error.details &&
        typeof error.details === 'object' &&
        'errors' in error.details
          ? (error.details as { errors: unknown }).errors
          : [
              {
                row: 0,
                field: '文件',
                message: error instanceof Error ? error.message : '导入失败',
              },
            ];
      await this.prisma.importBatch.create({
        data: {
          originalFilename: filename,
          year: dto.year,
          duplicateStrategy: dto.duplicateStrategy,
          status: ImportStatus.FAILED,
          totalRows,
          errors: errors as Prisma.InputJsonValue,
        },
      });
      throw error;
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const ext = extname(file.originalname).toLowerCase();
    if (!['.xlsx', '.xls'].includes(ext))
      throw new ApiException(
        ErrorCode.EXCEL_INVALID_FILE,
        '只接受.xlsx 或.xls 文件',
        HttpStatus.BAD_REQUEST,
      );
    const zip = file.buffer.length >= 4 && file.buffer[0] === 0x50 && file.buffer[1] === 0x4b;
    const cfb =
      file.buffer.length >= 8 &&
      file.buffer
        .subarray(0, 8)
        .equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    if ((ext === '.xlsx' && !zip) || (ext === '.xls' && !cfb))
      throw new ApiException(
        ErrorCode.EXCEL_INVALID_FILE,
        '文件签名与扩展名不匹配',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    const mime = file.mimetype.toLowerCase();
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ];
    if (!allowed.includes(mime))
      throw new ApiException(
        ErrorCode.EXCEL_INVALID_FILE,
        'Excel MIME 类型不正确',
        HttpStatus.BAD_REQUEST,
      );
  }

  private async execute(
    filename: string,
    dto: ImportProjectsDto,
    rows: ParsedProjectRow[],
  ): Promise<Record<string, number | string>> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.project.findMany({
        where: { year: dto.year, name: { in: rows.map((r) => r.name) } },
        select: { id: true, name: true, progress: true },
      });
      const byName = new Map(existing.map((p) => [p.name, p]));
      if (dto.duplicateStrategy === DuplicateStrategy.error && existing.length) {
        const errors = rows
          .filter((r) => byName.has(r.name))
          .map((r) => ({
            row: r.row,
            field: '项目名称',
            message: `项目"${r.name}"在${dto.year}年度已存在`,
          }));
        throw new ApiException(
          ErrorCode.EXCEL_DUPLICATE_PROJECT,
          '存在同年度同名项目，未导入任何数据',
          HttpStatus.CONFLICT,
          { errors },
        );
      }
      let importedRows = 0;
      let updatedRows = 0;
      let skippedRows = 0;
      for (const row of rows) {
        let ownerId: string | null = null;
        if (row.ownerName) {
          const owner = await tx.owner.upsert({
            where: { name: row.ownerName },
            update: {},
            create: { name: row.ownerName },
          });
          ownerId = owner.id;
        }
        const old = byName.get(row.name);
        if (old && dto.duplicateStrategy === DuplicateStrategy.skip) {
          skippedRows += 1;
          continue;
        }
        if (old) {
          await tx.project.update({
            where: { id: old.id },
            data: {
              annualGoal: row.annualGoal,
              department: row.department,
              status: row.status ?? 'NOT_STARTED',
              ownerId,
              progress: row.progress,
              version: { increment: 1 },
              updatedAt: new Date(),
            },
          });
          if (old.progress !== row.progress)
            await tx.projectProgressLog.create({
              data: { projectId: old.id, oldProgress: old.progress, newProgress: row.progress },
            });
          updatedRows += 1;
        } else {
          const project = await tx.project.create({
            data: {
              year: dto.year,
              name: row.name,
              annualGoal: row.annualGoal,
              department: row.department,
              status: row.status ?? 'NOT_STARTED',
              ownerId,
              progress: row.progress,
            },
          });
          if (row.progress > 0)
            await tx.projectProgressLog.create({
              data: { projectId: project.id, oldProgress: 0, newProgress: row.progress },
            });
          importedRows += 1;
        }
      }
      const batch = await tx.importBatch.create({
        data: {
          originalFilename: filename,
          year: dto.year,
          duplicateStrategy: dto.duplicateStrategy,
          status: ImportStatus.SUCCESS,
          totalRows: rows.length,
          importedRows,
          updatedRows,
          skippedRows,
        },
      });
      return { batchId: batch.id, totalRows: rows.length, importedRows, updatedRows, skippedRows };
    });
  }
}
