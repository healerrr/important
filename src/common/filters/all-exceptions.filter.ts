import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { MulterError } from 'multer';
import { ApiException } from '../exceptions/api.exception';
import { ErrorCode } from '../constants/error-codes';
import type { RequestWithId } from '../middleware/request-id.middleware';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>() as RequestWithId;
    const res = ctx.getResponse<Response>();
    const mapped = this.mapException(exception);
    if (mapped.status >= 500) this.logger.error(exception);
    res.status(mapped.status).json({
      code: mapped.code,
      message: mapped.message,
      details: mapped.details,
      requestId: req.requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  private mapException(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details: unknown;
  } {
    if (exception instanceof ApiException)
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    if (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE')
      return {
        status: 413,
        code: ErrorCode.FILE_TOO_LARGE,
        message: '上传文件超过大小限制',
        details: null,
      };
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002')
      return {
        status: 409,
        code: ErrorCode.VALIDATION_ERROR,
        message: '数据已存在',
        details: null,
      };
    if (exception instanceof BadRequestException)
      return {
        status: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: '请求参数校验失败',
        details: exception.getResponse(),
      };
    if (exception instanceof HttpException)
      return {
        status: exception.getStatus(),
        code:
          exception.getStatus() === 429
            ? ErrorCode.RATE_LIMIT_EXCEEDED
            : ErrorCode.VALIDATION_ERROR,
        message: exception.message,
        details: null,
      };
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: '服务器内部错误',
      details: null,
    };
  }
}
