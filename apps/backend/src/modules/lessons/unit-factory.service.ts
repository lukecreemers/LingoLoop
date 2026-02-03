import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import type { LessonDebugService } from './lesson-debug.service';

// Schemas (EXOutputSchema not needed - explanation uses raw text)
import {
  CGOutputSchema,
  FIBOutputSchema,
  TGOutputSchema,
  WMMOutputSchema,
  WIBOutputSchema,
  FCOutputSchema,
  WPOutputSchema,
  WOOutputSchema,
} from 'src/shared';
import type { LessonPlanUnit, CompiledUnit } from 'src/shared';
import type { RedoUnitInput } from 'src/shared/types/redo-unit.dto';

// Prompt templates from test cases
import { EX_PROMPT_TEMPLATE } from 'src/testing/cases/explanation.cases';
import { FIB_PROMPT_TEMPLATE } from 'src/testing/cases/fill-in-blanks.cases';
import { WMM_PROMPT_TEMPLATE } from 'src/testing/cases/word-meaning-match.cases';
import { WIB_PROMPT_TEMPLATE } from 'src/testing/cases/write-in-blanks.cases';
import { TG_PROMPT_TEMPLATE } from 'src/testing/cases/translation-generation.cases';
import { CG_PROMPT_TEMPLATE } from 'src/testing/cases/conversation-generation.cases';
import { FC_PROMPT_TEMPLATE } from 'src/testing/cases/flashcard.cases';
import { WP_PROMPT_TEMPLATE } from 'src/testing/cases/writing-practice.cases';
import { WO_PROMPT_TEMPLATE } from 'src/testing/cases/word-order.cases';
import type { LessonContext } from './lesson.context';
import { formatUserProfile, TEST_USER_PROFILE } from './lesson.context';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

@Injectable()
export class UnitFactoryService {
  private readonly logger = new Logger(UnitFactoryService.name);
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Execute a single unit from the lesson plan with retry logic
   * All units now just have type + instructions
   */
  async executeUnit(
    unit: LessonPlanUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    const prompt = this.buildUnitPrompt(unit, context, avoidContext);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        let output: unknown;

        // Explanation doesn't need structured output - just get raw text
        if (unit.type === 'explanation') {
          const response = await this.llm.invoke(prompt);
          output =
            typeof response.content === 'string'
              ? response.content
              : String(response.content);
        } else {
          // All other unit types use structured output
          const schema = this.getSchemaForType(unit.type);
          const structuredLlm = this.llm.withStructuredOutput(schema);
          output = await structuredLlm.invoke(prompt);
        }

        return { type: unit.type, plan: unit, output } as CompiledUnit;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Unit execution failed (attempt ${attempt}/${MAX_RETRIES}) for ${unit.type}: ${lastError.message}`,
        );

        if (attempt < MAX_RETRIES) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    // All retries exhausted
    this.logger.error(
      `Unit execution failed after ${MAX_RETRIES} attempts for ${unit.type}`,
    );
    throw lastError;
  }

  /**
   * Execute all units in a lesson plan (in parallel)
   */
  async executeAllUnits(
    units: LessonPlanUnit[],
    context: LessonContext,
  ): Promise<CompiledUnit[]> {
    return Promise.all(units.map((unit) => this.executeUnit(unit, context)));
  }

  /**
   * Execute all units with debug logging (in parallel)
   */
  async executeAllUnitsWithDebug(
    units: LessonPlanUnit[],
    context: LessonContext,
    sectionIndex: number,
    debugService: LessonDebugService,
  ): Promise<CompiledUnit[]> {
    return Promise.all(
      units.map(async (unit, unitIndex) => {
        const prompt = this.buildUnitPrompt(unit, context);

        try {
          const result = await this.executeUnit(unit, context);
          debugService.logUnitExecution(
            sectionIndex,
            unitIndex,
            unit.type,
            prompt,
            undefined,
            result.output,
          );
          return result;
        } catch (error) {
          debugService.logUnitExecution(
            sectionIndex,
            unitIndex,
            unit.type,
            prompt,
            undefined,
            undefined,
            error as Error,
          );
          throw error;
        }
      }),
    );
  }

  /**
   * Regenerate a unit with different content
   */
  async redoUnit(input: RedoUnitInput): Promise<CompiledUnit> {
    const context: LessonContext = {
      userLevel: input.userLevel,
      targetLanguage: input.targetLanguage ?? 'Spanish',
      nativeLanguage: input.nativeLanguage ?? 'English',
      userProfile: TEST_USER_PROFILE,
    };

    const avoidContext = this.buildAvoidContext(input.previousOutput);
    return this.executeUnit(input.unitPlan, context, avoidContext);
  }

  // ============================================================================
  // PROMPT BUILDING
  // ============================================================================

  /**
   * Build the prompt for a unit based on its type (public for debug purposes)
   */
  buildUnitPrompt(
    unit: LessonPlanUnit,
    context: LessonContext,
    avoidContext?: string,
  ): string {
    const template = this.getTemplateForType(unit.type);
    const userProfileText = formatUserProfile(context.userProfile);

    // Build lesson plan context section if available
    const lessonPlanContext = context.lessonPlanContext
      ? `### LESSON CONTEXT
This The lesson is up to this unit now. Here is the full lesson plan up to and including this unit:

${context.lessonPlanContext}

You are generating content for the current unit. Use the above context to maintain coherence with the lesson flow, but focus on the specific instructions below.
`
      : '';

    let prompt = this.buildPrompt(template, {
      userLevel: context.userLevel,
      targetLanguage: context.targetLanguage,
      nativeLanguage: context.nativeLanguage,
      instructions: unit.instructions,
      userProfile: userProfileText,
      lessonPlanContext,
    });

    if (avoidContext) {
      prompt = `${avoidContext}\n\n${prompt}`;
    }

    return prompt;
  }

  /**
   * Get the prompt template for a unit type
   */
  private getTemplateForType(type: LessonPlanUnit['type']): string {
    switch (type) {
      case 'flashcard':
        return FC_PROMPT_TEMPLATE;
      case 'explanation':
        return EX_PROMPT_TEMPLATE;
      case 'fill_in_blanks':
        return FIB_PROMPT_TEMPLATE;
      case 'word_match':
        return WMM_PROMPT_TEMPLATE;
      case 'write_in_blanks':
        return WIB_PROMPT_TEMPLATE;
      case 'translation':
        return TG_PROMPT_TEMPLATE;
      case 'conversation':
        return CG_PROMPT_TEMPLATE;
      case 'writing_practice':
        return WP_PROMPT_TEMPLATE;
      case 'word_order':
        return WO_PROMPT_TEMPLATE;
      default:
        throw new Error(`Unknown unit type: ${type}`);
    }
  }

  /**
   * Get the output schema for a unit type (explanation handled separately - no structured output)
   */
  private getSchemaForType(type: LessonPlanUnit['type']) {
    switch (type) {
      case 'flashcard':
        return FCOutputSchema;
      case 'fill_in_blanks':
        return FIBOutputSchema;
      case 'word_match':
        return WMMOutputSchema;
      case 'write_in_blanks':
        return WIBOutputSchema;
      case 'translation':
        return TGOutputSchema;
      case 'conversation':
        return CGOutputSchema;
      case 'writing_practice':
        return WPOutputSchema;
      case 'word_order':
        return WOOutputSchema;
      case 'explanation':
        throw new Error(
          'Explanation uses raw text output, not structured output',
        );
      default:
        throw new Error(`Unknown unit type: ${type}`);
    }
  }

  /**
   * Build a string describing what to avoid from previous output
   */
  private buildAvoidContext(previousOutput: CompiledUnit): string {
    switch (previousOutput.type) {
      case 'flashcard':
        const terms = previousOutput.output.cards.map((c) => c.term).join(', ');
        return `IMPORTANT: Generate completely different flashcards. DO NOT use any of these terms: ${terms}. Choose different vocabulary within the same theme.`;

      case 'explanation':
        // output is now just a string (the markdown content directly)
        const explanation = previousOutput.output as string;
        return `IMPORTANT: Generate completely different content. The previous explanation covered: "${explanation.slice(0, 500)}...". Use different examples, different structure, and different explanations.`;

      case 'fill_in_blanks':
      case 'write_in_blanks':
        const sentences = previousOutput.output.exercises
          .map((e) => e.template)
          .join('; ');
        return `IMPORTANT: Generate completely different sentences. DO NOT use any of these sentences or similar variations: ${sentences}`;

      case 'word_match':
        const pairs = previousOutput.output.exercises
          .flatMap((e) => e.pairs.map((p) => p[0]))
          .join(', ');
        return `IMPORTANT: Generate completely different word pairs. DO NOT use any of these words: ${pairs}`;

      case 'translation':
        const paragraph = previousOutput.output.paragraph;
        return `IMPORTANT: Generate a completely different paragraph. DO NOT use this paragraph or similar variations: ${paragraph}`;

      case 'conversation':
        return `IMPORTANT: Generate a completely different conversation. The previous conversation was: "${previousOutput.output.conversation.slice(0, 500)}...". Use different characters, different scenario, different dialogue.`;

      case 'writing_practice':
        const prompts = previousOutput.output.prompts
          .map((p) => p.prompt)
          .join('; ');
        return `IMPORTANT: Generate completely different writing prompts. DO NOT use any of these prompts or similar variations: ${prompts}`;

      case 'word_order':
        const woSentences = previousOutput.output.sentences
          .map((s) => s.sentence)
          .join('; ');
        return `IMPORTANT: Generate completely different sentences. DO NOT use any of these sentences or similar variations: ${woSentences}`;

      default:
        return '';
    }
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Replace {{placeholders}} in a template with values
   */
  private buildPrompt(
    template: string,
    values: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return values[key] ?? '';
    });
  }
}
