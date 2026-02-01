import { Controller, Post, Body } from '@nestjs/common';
import { TMOutputSchema, MarkTranslationDto } from '../../shared';
import type { TMOutput } from '../../shared';
import { ZodResponse } from '../../common/decorators/zod-response.decorator';
import { TranslationMarkingService } from './translation-marking.service';

@Controller('translation-marking')
export class TranslationMarkingController {
  constructor(
    private readonly translationMarkingService: TranslationMarkingService,
  ) {}

  @Post()
  @ZodResponse(TMOutputSchema)
  async markTranslation(@Body() dto: MarkTranslationDto): Promise<TMOutput> {
    return this.translationMarkingService.markTranslation(dto);
  }
}

