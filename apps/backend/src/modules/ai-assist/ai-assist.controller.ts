import { Controller, Post, Body, Res } from '@nestjs/common';
import * as express from 'express';
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
import { WPMarkingOutputSchema } from '../../shared/types/writing-practice.types';
import type { WPMarkingOutput } from '../../shared/types/writing-practice.types';
import { MarkWritingPracticeDto } from '../../shared/types/writing-practice.dto';
import {
  ExplanationChatInputSchema,
  type ExplanationChatInput,
} from '../../shared/types/explanation-chat.dto';

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

  @Post('mark-writing')
  @ZodResponse(WPMarkingOutputSchema)
  async markWritingPractice(
    @Body() input: MarkWritingPracticeDto,
  ): Promise<WPMarkingOutput> {
    return this.aiAssistService.markWritingPractice(input);
  }

  /**
   * Stream a chat response for explanation follow-up questions
   * Uses Server-Sent Events (SSE) for streaming
   */
  @Post('explanation-chat')
  async streamExplanationChat(
    @Body() body: Record<string, unknown>,
    @Res() res: express.Response,
  ): Promise<void> {
    // Parse and validate input with Zod
    const parseResult = ExplanationChatInputSchema.safeParse(body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.message });
      return;
    }
    const input: ExplanationChatInput = parseResult.data;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const chunk of this.aiAssistService.streamExplanationChat(
        input,
      )) {
        // Send each chunk as an SSE data event
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      // Send done event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}

