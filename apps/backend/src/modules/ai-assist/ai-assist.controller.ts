import { Controller, Post, Body } from '@nestjs/common';
import { AiAssistService } from './ai-assist.service';
import { ZodResponse } from '../../common/decorators/zod-response.decorator';
import {
  ExplainWrongOutputSchema,
  TranslateSelectionOutputSchema,
} from '../../shared/types/ai-assist.types';
import type {
  ExplainWrongOutput,
  TranslateSelectionOutput,
} from '../../shared/types/ai-assist.types';
import { ExplainWrongDto, TranslateSelectionDto } from '../../shared/types/ai-assist.dto';

@Controller('ai-assist')
export class AiAssistController {
  constructor(private readonly aiAssistService: AiAssistService) {}

  @Post('explain-wrong')
  @ZodResponse(ExplainWrongOutputSchema)
  async explainWrong(
    @Body() input: ExplainWrongDto,
  ): Promise<ExplainWrongOutput> {
    return this.aiAssistService.explainWrong(input);
  }

  @Post('translate-selection')
  @ZodResponse(TranslateSelectionOutputSchema)
  async translateSelection(
    @Body() input: TranslateSelectionDto,
  ): Promise<TranslateSelectionOutput> {
    return this.aiAssistService.translateSelection(input);
  }
}

