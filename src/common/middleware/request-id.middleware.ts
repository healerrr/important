import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export type RequestWithId = Request & { requestId: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header('X-Request-Id')?.trim();
    const request = req as RequestWithId;
    request.requestId = incoming && incoming.length <= 128 ? incoming : randomUUID();
    res.setHeader('X-Request-Id', request.requestId);
    next();
  }
}
