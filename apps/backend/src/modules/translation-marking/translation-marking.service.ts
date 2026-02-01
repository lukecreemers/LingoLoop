import { Injectable } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';
import { TMOutput, TMOutputSchema, MarkTranslationDto } from '../../shared';
import { TM_PROMPT_TEMPLATE } from '../../testing/cases/translation-marking.cases';

@Injectable()
export class TranslationMarkingService {
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.5,
    });
  }

  async markTranslation(dto: MarkTranslationDto): Promise<TMOutput> {
    const prompt = TM_PROMPT_TEMPLATE.replace(
      '{{referenceText}}',
      dto.referenceText,
    ).replace('{{userTranslation}}', dto.userTranslation);

    const structuredLlm = this.llm.withStructuredOutput(TMOutputSchema);
    const response = await structuredLlm.invoke(prompt);

    return response;
  }
}
