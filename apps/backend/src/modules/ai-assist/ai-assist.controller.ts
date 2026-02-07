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
import {
  SectionChatInputSchema,
  type SectionChatInput,
} from '../../shared/types/section-chat.dto';
import { StructuredLessonService } from '../lessons/structured-lesson.service';

@Controller('ai-assist')
export class AiAssistController {
  constructor(
    private readonly aiAssistService: AiAssistService,
    private readonly structuredLessonService: StructuredLessonService,
  ) {}

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

  // ============================================================================
  // SECTION CHAT (with tool calling for lesson update structure)
  // ============================================================================

  /**
   * Stream a section chat response.
   *
   * SSE events:
   * - data: { content: "..." }              — streamed chat text
   * - data: { tool_call: true, message: "..." }  — indicates extra units are being generated
   * - data: { extra_sections: [...] }        — the compiled extra sections
   * - data: { done: true }                   — stream complete
   * - data: { error: "..." }                 — error
   */
  @Post('section-chat')
  async streamSectionChat(
    @Body() body: Record<string, unknown>,
    @Res() res: express.Response,
  ): Promise<void> {
    // Parse and validate input
    const parseResult = SectionChatInputSchema.safeParse(body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.message });
      return;
    }
    const input: SectionChatInput = parseResult.data;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      // Format conversation context for the update structure prompt
      const conversationContextStr = [
        ...input.chatHistory.slice(-10),
        { role: 'user' as const, content: input.userMessage },
      ]
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      for await (const event of this.aiAssistService.streamSectionChat(input)) {
        if (event.type === 'content') {
          res.write(`data: ${JSON.stringify({ content: event.content })}\n\n`);
        } else if (event.type === 'tool_call') {
          // Notify client that extra units are being generated
          res.write(
            `data: ${JSON.stringify({
              tool_call: true,
              message: 'Generating extra practice units...',
            })}\n\n`,
          );

          // Generate the extra sections via the lesson update structure pipeline
          // Stream progress events back to the client
          try {
            const extraSections =
              await this.structuredLessonService.generateExtraSections(
                {
                  userLevel: input.userLevel,
                  targetLanguage: input.targetLanguage,
                  nativeLanguage: input.nativeLanguage,
                  lessonStructureSoFar: input.lessonPlanContext,
                  specificInstruction: event.instruction,
                  conversationContext: conversationContextStr,
                },
                (progressEvent) => {
                  res.write(
                    `data: ${JSON.stringify({ generation_progress: progressEvent })}\n\n`,
                  );
                },
              );

            // Send the compiled sections to the client
            res.write(
              `data: ${JSON.stringify({ extra_sections: extraSections })}\n\n`,
            );
          } catch (genError) {
            res.write(
              `data: ${JSON.stringify({
                error: `Failed to generate extra units: ${genError instanceof Error ? genError.message : 'Unknown error'}`,
              })}\n\n`,
            );
          }
        } else if (event.type === 'done') {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
      }
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}

