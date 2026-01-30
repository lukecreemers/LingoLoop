import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ZodTypeAny } from 'zod';

@Injectable()
export class ZodResponseInterceptor implements NestInterceptor {
  constructor(private readonly schema: ZodTypeAny) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const result = this.schema.safeParse(data);

        if (!result.success) {
          throw new InternalServerErrorException({
            message: 'Response validation failed.',
            issues: result.error.format(),
          });
        }

        return result.data;
      }),
    );
  }
}
