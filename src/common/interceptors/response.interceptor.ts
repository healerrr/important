import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ListResult<T> {
  items: T[];
  meta: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value === undefined) return value;
        if (this.isListResult(value)) return { data: value.items, meta: value.meta };
        return { data: value };
      }),
    );
  }

  private isListResult(value: unknown): value is ListResult<unknown> {
    return typeof value === 'object' && value !== null && 'items' in value && 'meta' in value;
  }
}
