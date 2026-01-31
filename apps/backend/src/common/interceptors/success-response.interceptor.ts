import { ApiResponse } from '../../shared';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: unknown) => {
        const successResponse: ApiResponse<typeof data> = {
          success: true,
          statusCode,
          message: null,
          error: null,
          path: request.url,
          method: request.method,
          timestamp: new Date().toISOString(),
          data,
        };

        return successResponse;
      }),
    );
  }
}
