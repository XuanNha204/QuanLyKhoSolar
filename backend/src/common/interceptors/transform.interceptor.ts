import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Observable, map } from 'rxjs';

type PlainRecord = Record<string, unknown>;

function isRecord(value: unknown): value is PlainRecord {
  return typeof value === 'object' && value !== null;
}

function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Types.ObjectId) return value.toHexString();
  if (Array.isArray(value)) return value.map(serialize);
  if (!isRecord(value)) return value;

  const source =
    typeof value.toObject === 'function'
      ? (value.toObject() as PlainRecord)
      : value;
  const output: PlainRecord = {};
  for (const [key, nested] of Object.entries(source)) {
    if (key === '__v' || key === 'passwordHash' || key === 'normalizedName')
      continue;
    output[key === '_id' ? 'id' : key] = serialize(nested);
  }
  return output;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (isRecord(result) && 'data' in result && 'meta' in result) {
          return {
            success: true,
            data: serialize(result.data),
            meta: result.meta,
          };
        }
        return { success: true, data: serialize(result) };
      }),
    );
  }
}
