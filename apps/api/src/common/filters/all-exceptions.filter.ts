import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

type ErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId: string;
  path: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const requestId =
      (typeof request.headers['x-request-id'] === 'string' && request.headers['x-request-id']) ||
      request.requestId ||
      randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      let message: string | string[] = exception.message;
      let error = HttpStatus[status] ?? 'Error';

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        if (Array.isArray(body.message)) {
          message = body.message as string[];
        } else if (typeof body.message === 'string') {
          message = body.message;
        }
        if (typeof body.error === 'string') {
          error = body.error;
        }
      }

      const body: ErrorBody = {
        statusCode: status,
        error,
        message,
        requestId,
        path: request.url ?? '',
      };
      response.setHeader('x-request-id', requestId);
      response.status(status).json(body);
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);

    const body: ErrorBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
      requestId,
      path: request.url ?? '',
    };
    response.setHeader('x-request-id', requestId);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
