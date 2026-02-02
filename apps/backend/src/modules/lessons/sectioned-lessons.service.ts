import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import { TBOutputSchema } from 'src/shared/types/topic-breakdown.types';
import { SecGenOutputSchema } from 'src/shared/types/section-generation.types';
import type { SectionedLesson, CompiledSection } from 'src/shared';
import { CreateLessonDto } from 'src/shared/types/create-lesson/create-lesson.dto';
import { UnitFactoryService } from './unit-factory.service';
import { buildLessonContext } from './lesson.context';
import { LessonDebugService } from './lesson-debug.service';

// Import prompt templates
import { TB_PROMPT_TEMPLATE } from 'src/testing/cases/topic-breakdown.cases';
import { SECGEN_PROMPT_TEMPLATE } from 'src/testing/cases/section-generation.cases';

@Injectable()
export class SectionedLessonsService {
  private readonly logger = new Logger(SectionedLessonsService.name);
  private llm: ChatAnthropic;

  constructor(
    private readonly unitFactory: UnitFactoryService,
    private readonly debugService: LessonDebugService,
  ) {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.6,
    });
  }

  /**
   * Create a sectioned lesson using the multi-stage flow:
   * 1. Topic Breakdown → section instructions
   * 2. Section Generation → unit plans for each section
   * 3. Unit Factory → execute units
   */
  async createSectionedLesson(dto: CreateLessonDto): Promise<SectionedLesson> {
    this.logger.log(
      `Creating sectioned lesson: "${dto.instructions.slice(0, 50)}..."`,
    );

    // Start debug session
    this.debugService.startSession(dto.instructions);

    let success = false;
    try {
      // Stage 1: Topic Breakdown
      this.logger.debug('Stage 1: Topic Breakdown');
      const sectionInstructions = await this.topicBreakdown(dto);
      this.logger.debug(`Generated ${sectionInstructions.length} sections`);

      // Stage 2 & 3: Section Generation + Unit Execution (all sections in parallel)
      this.logger.debug(
        'Stage 2 & 3: Section Generation + Unit Execution (parallel)',
      );
      const context = buildLessonContext(
        dto.userLevel,
        dto.targetLanguage,
        dto.nativeLanguage,
      );

      // Process all sections in parallel
      const compiledSections = await Promise.all(
        sectionInstructions.map(async (sectionInstruction, i) => {
          this.logger.debug(
            `Processing section ${i + 1}/${sectionInstructions.length}`,
          );

          // Stage 2: Generate unit plans for this section
          const unitPlans = await this.generateSectionUnits(
            i,
            sectionInstruction,
            dto.userLevel,
            dto.targetLanguage,
            dto.nativeLanguage,
          );

          // Stage 3: Execute all units in this section
          const compiledUnits = await this.unitFactory.executeAllUnitsWithDebug(
            unitPlans,
            context,
            i,
            this.debugService,
          );

          return {
            sectionInstruction,
            sectionIndex: i,
            unitPlans,
            units: compiledUnits,
          };
        }),
      );

      this.logger.log('Sectioned lesson created successfully');
      success = true;

      return {
        input: {
          instructions: dto.instructions,
          userLevel: dto.userLevel,
          targetLanguage: dto.targetLanguage,
          nativeLanguage: dto.nativeLanguage,
        },
        sectionInstructions,
        sections: compiledSections,
      };
    } finally {
      this.debugService.endSession(success);
    }
  }

  /**
   * Regenerate a single section with new content
   */
  async redoSection(
    lesson: SectionedLesson,
    sectionIndex: number,
  ): Promise<CompiledSection> {
    const sectionInstruction = lesson.sectionInstructions[sectionIndex];
    if (!sectionInstruction) {
      throw new Error(`Section ${sectionIndex} not found`);
    }

    this.logger.debug(`Regenerating section ${sectionIndex}`);

    const context = buildLessonContext(
      lesson.input.userLevel,
      lesson.input.targetLanguage,
      lesson.input.nativeLanguage,
    );

    // Generate new unit plans
    const unitPlans = await this.generateSectionUnits(
      sectionIndex,
      sectionInstruction,
      lesson.input.userLevel,
      lesson.input.targetLanguage,
      lesson.input.nativeLanguage,
    );

    // Execute units
    const compiledUnits = await this.unitFactory.executeAllUnits(
      unitPlans,
      context,
    );

    return {
      sectionInstruction,
      sectionIndex,
      unitPlans,
      units: compiledUnits,
    };
  }

  // ============================================================================
  // STAGE 1: TOPIC BREAKDOWN
  // ============================================================================

  private async topicBreakdown(dto: CreateLessonDto): Promise<string[]> {
    const prompt = this.buildPrompt(TB_PROMPT_TEMPLATE, {
      userLevel: dto.userLevel,
      targetLanguage: dto.targetLanguage,
      nativeLanguage: dto.nativeLanguage,
      instructions: dto.instructions,
    });

    try {
      const structuredLlm = this.llm.withStructuredOutput(TBOutputSchema);
      const result = await structuredLlm.invoke(prompt);
      this.debugService.logTopicBreakdown(prompt, result);
      return result.sections;
    } catch (error) {
      this.debugService.logTopicBreakdown(prompt, undefined, error as Error);
      throw error;
    }
  }

  // ============================================================================
  // STAGE 2: SECTION GENERATION
  // ============================================================================

  private async generateSectionUnits(
    sectionIndex: number,
    sectionInstruction: string,
    userLevel: string,
    targetLanguage: string,
    nativeLanguage: string,
  ) {
    const prompt = this.buildPrompt(SECGEN_PROMPT_TEMPLATE, {
      userLevel,
      targetLanguage,
      nativeLanguage,
      sectionInstruction,
    });

    try {
      const structuredLlm = this.llm.withStructuredOutput(SecGenOutputSchema);
      const result = await structuredLlm.invoke(prompt);
      this.debugService.logSectionGeneration(sectionIndex, prompt, result);
      return result.units;
    } catch (error) {
      this.debugService.logSectionGeneration(
        sectionIndex,
        prompt,
        undefined,
        error as Error,
      );
      throw error;
    }
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  private buildPrompt(
    template: string,
    values: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return values[key] ?? '';
    });
  }
}
