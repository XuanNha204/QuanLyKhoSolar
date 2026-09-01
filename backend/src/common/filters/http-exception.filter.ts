import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';

interface ErrorBody {
  code?: string;
  message?: string | string[];
  details?: unknown;
}

interface MongoLikeError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Đã xảy ra lỗi hệ thống.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const errorBody = body as ErrorBody;
        code = errorBody.code ?? this.defaultCode(status);
        message = Array.isArray(errorBody.message)
          ? 'Dữ liệu không hợp lệ.'
          : (errorBody.message ?? exception.message);
        details =
          errorBody.details ??
          (Array.isArray(errorBody.message) ? errorBody.message : undefined);
      }
    } else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'INVALID_OBJECT_ID';
      message = 'Định danh không hợp lệ.';
    } else if (this.isMongoError(exception) && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      code = 'DUPLICATE_VALUE';
      message = 'Dữ liệu đã tồn tại.';
      details = exception.keyValue;
    } else {
      this.logger.error(exception);
    }

    response.status(status).json({
      success: false,
      error: { code, message, ...(details === undefined ? {} : { details }) },
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private isMongoError(value: unknown): value is MongoLikeError {
    return value instanceof Error && 'code' in value;
  }

  private defaultCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
    };
    return codes[status] ?? 'HTTP_ERROR';
  }
}
