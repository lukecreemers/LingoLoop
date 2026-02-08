import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { OnboardingAgentService } from './onboarding-agent.service';
import { OnboardingChatInputSchema } from '../../shared/types/onboarding-agent.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingAgentController {
  constructor(private readonly agentService: OnboardingAgentService) {}

  /**
   * Stream an onboarding agent chat response.
   * Uses @Res() to bypass any global interceptors.
   *
   * SSE events:
   * - data: { content: "..." }                                         — streamed chat text
   * - data: { status: "..." }                                          — status message
   * - data: { tool_call: true, toolName: "...", args: {...} }          — tool call args for review
   * - data: { done: true }                                             — stream complete
   * - data: { error: "..." }                                           — error
   */
  @Post('chat')
  async streamChat(
    @Body() body: Record<string, unknown>,
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ): Promise<void> {
    // Parse and validate input
    const parseResult = OnboardingChatInputSchema.safeParse(body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.message });
      return;
    }
    const input = parseResult.data;

    // Override userId from the JWT token
    input.userId = req.user.sub;

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
              toolName: event.toolName,
              args: event.args,
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

  /**
   * Check if a user needs onboarding.
   * Returns { needsOnboarding: boolean, courseId?: string }
   */
  @Get('status')
  async getStatus(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ needsOnboarding: boolean; courseId?: string; userId?: string }> {
    return this.agentService.getOnboardingStatus(req.user.sub);
  }
}
