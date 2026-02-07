import { Controller, Get, Post, Body } from '@nestjs/common';
import { DailyLoopService } from './daily-loop.service';
import { ReadingGenerationService } from './reading-generation.service';
import type { DailyVocab, ReadingPassage } from '../../shared/types/daily-loop.types';

@Controller('daily-loop')
export class DailyLoopController {
  constructor(
    private readonly dailyLoopService: DailyLoopService,
    private readonly readingGeneration: ReadingGenerationService,
  ) {}

  @Get()
  getDailyLoop() {
    return this.dailyLoopService.getDailyLoop();
  }

  /**
   * Generate a complete new reading exercise using AI.
   * Returns a full ReadingPassage with content, vocab, questions, phrases.
   */
  @Post('generate-reading')
  async generateReading(
    @Body()
    body: {
      contentType: string;
      length: string;
      customRequest?: string;
      dailyVocab?: DailyVocab;
      targetLanguage?: string;
      nativeLanguage?: string;
      level?: string;
    },
  ): Promise<ReadingPassage> {
    return this.readingGeneration.generateReading({
      contentType: body.contentType,
      length: body.length,
      customRequest: body.customRequest,
      dailyVocab: body.dailyVocab,
      targetLanguage: body.targetLanguage,
      nativeLanguage: body.nativeLanguage,
      level: body.level,
    });
  }

  /**
   * Extend an existing reading with 1-2 more paragraphs using AI.
   * Returns the new text to append.
   */
  @Post('extend-reading')
  async extendReading(
    @Body()
    body: {
      existingContent: string;
      dailyVocab?: DailyVocab;
      targetLanguage?: string;
      nativeLanguage?: string;
      level?: string;
    },
  ): Promise<{ content: string }> {
    const content = await this.readingGeneration.extendReading({
      existingContent: body.existingContent,
      targetLanguage: body.targetLanguage,
      nativeLanguage: body.nativeLanguage,
      level: body.level,
      dailyVocab: body.dailyVocab,
    });
    return { content };
  }

  /**
   * Stub endpoint for generating a new writing exercise.
   * In future: uses AI to generate prompts based on user preferences + daily vocab.
   */
  @Post('generate-writing')
  async generateWriting(
    @Body()
    body: {
      length: string;
      promptCount: number;
      customRequest?: string;
      targetVocab?: string[];
      targetConcepts?: string[];
    },
  ) {
    return {
      message: 'AI writing generation coming soon',
      request: body,
    };
  }
}
