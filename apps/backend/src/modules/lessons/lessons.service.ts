import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable } from '@nestjs/common';
import { CLGOutputSchema, CompiledLesson } from 'src/shared';
import { CreateLessonDto } from 'src/shared/types/create-lesson/create-lesson.dto';
import { CLG_PROMPT_TEMPLATE } from 'src/testing/cases/custom-lesson-generation.cases';
import { UnitFactoryService } from './unit-factory.service';
import { buildLessonContext } from './lesson.context';

@Injectable()
export class LessonsService {
  private llm: ChatAnthropic;

  constructor(private readonly unitFactory: UnitFactoryService) {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.6,
    });
  }

  /**
   * Create a custom lesson by:
   * 1. Generating a lesson plan from the user's instructions
   * 2. Executing each unit in the plan via specialized sub-agents
   * 3. Compiling all outputs into a single lesson response
   */
  async createCustomLesson(dto: CreateLessonDto): Promise<CompiledLesson> {
    // Step 1: Generate the lesson plan
    const prompt = this.createCustomLessonPrompt(dto);
    const structuredLlm = this.llm.withStructuredOutput(CLGOutputSchema);
    const lessonPlan = await structuredLlm.invoke(prompt);

    // Step 2: Build context for unit execution
    const context = buildLessonContext(
      dto.userLevel,
      dto.targetLanguage,
      dto.nativeLanguage,
    );

    // Step 3: Execute all units and compile results
    const compiledUnits = await this.unitFactory.executeAllUnits(
      lessonPlan.units,
      context,
    );

    return { units: compiledUnits };
  }

  private createCustomLessonPrompt(dto: CreateLessonDto): string {
    return CLG_PROMPT_TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = dto[key as keyof CreateLessonDto];
      return value ?? '';
    });
  }
}
