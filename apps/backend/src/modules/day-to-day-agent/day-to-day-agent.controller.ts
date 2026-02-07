import { Controller, Post, Body, Res } from '@nestjs/common';
import * as express from 'express';
import { DayToDayAgentService } from './day-to-day-agent.service';
import { DayToDayChatInputSchema } from '../../shared/types/day-to-day-agent.types';

@Controller('day-to-day')
export class DayToDayAgentController {
  constructor(private readonly agentService: DayToDayAgentService) {}

  /**
   * Stream a day-to-day agent chat response.
   * Uses @Res() to bypass the global SuccessResponseInterceptor.
   *
   * SSE events:
   * - data: { content: "..." }                               — streamed chat text
   * - data: { status: "..." }                                — status message (e.g. "Fetching your roadmap...")
   * - data: { tool_call: true, name: "...", input: {...} }   — tool call from the agent
   * - data: { done: true }                                   — stream complete
   * - data: { error: "..." }                                 — error
   */
  @Post('chat')
  async streamChat(
    @Body() body: Record<string, unknown>,
    @Res() res: express.Response,
  ): Promise<void> {
    // Parse and validate input
    const parseResult = DayToDayChatInputSchema.safeParse(body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.message });
      return;
    }
    const input = parseResult.data;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      for await (const event of this.agentService.streamChat(input)) {
        if (event.type === 'content') {
          res.write(
            `data: ${JSON.stringify({ content: event.content })}\n\n`,
          );
        } else if (event.type === 'status') {
          res.write(
            `data: ${JSON.stringify({ status: event.message })}\n\n`,
          );
        } else if (event.type === 'tool_call') {
          res.write(
            `data: ${JSON.stringify({
              tool_call: true,
              name: event.name,
              input: event.input,
            })}\n\n`,
          );
        } else if (event.type === 'done') {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        }
      }
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({
          error:
            error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
