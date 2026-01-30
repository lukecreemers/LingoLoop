import { ApiResponse } from '@lingoloop/shared';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // catch ALL exceptions
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'An unexpected error occurred';
    let details: unknown = null;

    // 1. HttpException (most common)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseData = exception.getResponse();

      if (typeof responseData === 'string') {
        message = responseData;
      } else if (typeof responseData === 'object' && responseData !== null) {
        const r = responseData as Record<string, unknown>;
        message = (r.message as string) ?? message;
        error = (r.error as string) ?? error;
        details = r.details ?? r.issues ?? r.errors ?? null;
      }
    }

    // 2. Prisma Known Errors
    // else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    //   switch (exception.code) {
    //     case 'P2002': {
    //       statusCode = HttpStatus.CONFLICT;
    //       error = 'Conflict';
    //       const target = Array.isArray(exception.meta?.target)
    //         ? (exception.meta?.target as string[]).join(', ')
    //         : 'unknown field';
    //       message = `Unique constraint failed on: ${target}`;
    //       break;
    //     }

    //     case 'P2025':
    //       statusCode = HttpStatus.NOT_FOUND;
    //       error = 'Not Found';
    //       message = 'Record not found';
    //       break;

    //     case 'P2003':
    //       statusCode = HttpStatus.BAD_REQUEST;
    //       error = 'Bad Request';
    //       message = 'Foreign key constraint failed';
    //       break;

    //     default:
    //       this.logger.error(
    //         `Prisma Error ${exception.code}: ${exception.message}`,
    //       );
    //   }
    // }

    // 3. Generic JS Error
    else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = exception.message;
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      statusCode,
      error,
      data: null,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      details,
    };

    response.status(statusCode).json(errorResponse);
  }
}
