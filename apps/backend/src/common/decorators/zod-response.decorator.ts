import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ZodTypeAny } from 'zod';
import { ZodResponseInterceptor } from '../interceptors/zod-response.interceptor';

export function ZodResponse(schema: ZodTypeAny) {
  return applyDecorators(UseInterceptors(new ZodResponseInterceptor(schema)));
}
