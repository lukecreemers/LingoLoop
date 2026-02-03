import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import { CURRICULUM_PROMPT_TEMPLATE } from 'src/testing/cases/curriculum-generation.cases';
import {
  parseCurriculumXml,
  extractCurriculumXml,
} from './curriculum-parser.util';
import type { Curriculum } from 'src/shared/types/curriculum.types';

export interface GenerateCurriculumDto {
  userGoal: string;
}

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 1,
      maxTokens: 40000,
    });
  }

  /**
   * Generate a complete curriculum from a user goal
   */
  async generateCurriculum(dto: GenerateCurriculumDto): Promise<Curriculum> {
    this.logger.log(`Generating curriculum for goal: "${dto.userGoal.slice(0, 50)}..."`);

    // Build and send prompt
    const prompt = CURRICULUM_PROMPT_TEMPLATE.replace('{{userGoal}}', dto.userGoal);

    // Use streaming for long requests
    let rawXml = '';
    const stream = await this.llm.stream(prompt);
    for await (const chunk of stream) {
      const content = typeof chunk.content === 'string' 
        ? chunk.content 
        : chunk.content.map((c: { type: string; text?: string }) => 'text' in c ? c.text : '').join('');
      rawXml += content;
    }

    // Parse XML into structured data
    const xml = extractCurriculumXml(rawXml);
    const curriculum = parseCurriculumXml(xml, dto.userGoal);

    this.logger.log(
      `Generated curriculum: ${curriculum.totalMonths} months, ${curriculum.totalWeeks} weeks, ${curriculum.totalLessons} lessons`,
    );

    return curriculum;
  }
}

