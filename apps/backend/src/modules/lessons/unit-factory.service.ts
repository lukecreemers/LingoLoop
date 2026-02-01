import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable } from '@nestjs/common';

// Schemas
import {
  SGOutputSchema,
  CGOutputSchema,
  FIBOutputSchema,
  TGOutputSchema,
  WMMOutputSchema,
  WIBOutputSchema,
} from 'src/shared';
import type {
  LessonPlanUnit,
  CompiledUnit,
  StoryUnit,
  ConversationUnit,
  FillInBlanksUnit,
  TranslationUnit,
  WordMatchUnit,
  WriteInBlanksUnit,
} from 'src/shared';

// Prompt templates from test cases
import { SG_PROMPT_TEMPLATE } from 'src/testing/cases/story-generation.cases';
import { CG_PROMPT_TEMPLATE } from 'src/testing/cases/conversation-generation.cases';
import { FIB_PROMPT_TEMPLATE } from 'src/testing/cases/fill-in-blanks.cases';
import { TG_PROMPT_TEMPLATE } from 'src/testing/cases/translation-generation.cases';
import { WMM_PROMPT_TEMPLATE } from 'src/testing/cases/word-meaning-match.cases';
import { WIB_PROMPT_TEMPLATE } from 'src/testing/cases/write-in-blanks.cases';

import type { LessonContext } from './lesson.context';

// Batching configuration for exercise generation
const TOTAL_EXERCISES = 10;
const MAX_BATCH_SIZE = 3;

@Injectable()
export class UnitFactoryService {
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Execute a single unit from the lesson plan
   */
  async executeUnit(
    unit: LessonPlanUnit,
    context: LessonContext,
  ): Promise<CompiledUnit> {
    switch (unit.type) {
      case 'story':
        return this.executeStoryUnit(unit, context);
      case 'conversation':
        return this.executeConversationUnit(unit, context);
      case 'fill in the blanks':
        return this.executeFillInBlanksUnit(unit, context);
      case 'translation':
        return this.executeTranslationUnit(unit, context);
      case 'word meaning match':
        return this.executeWordMatchUnit(unit, context);
      case 'write in the blanks':
        return this.executeWriteInBlanksUnit(unit, context);
      default:
        throw new Error(`Unknown unit type: ${(unit as LessonPlanUnit).type}`);
    }
  }

  /**
   * Execute all units in a lesson plan
   */
  async executeAllUnits(
    units: LessonPlanUnit[],
    context: LessonContext,
  ): Promise<CompiledUnit[]> {
    const compiledUnits: CompiledUnit[] = [];
    for (const unit of units) {
      const compiled = await this.executeUnit(unit, context);
      compiledUnits.push(compiled);
    }
    return compiledUnits;
  }

  // ============================================================================
  // STORY GENERATION
  // ============================================================================

  private async executeStoryUnit(
    unit: StoryUnit,
    context: LessonContext,
  ): Promise<CompiledUnit> {
    const prompt = this.buildPrompt(SG_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      targetLanguage: context.targetLanguage,
      instructions: unit.instructions,
      textType: unit.textType,
      textLength: unit.length,
      userWordList: context.userWordList.join(', '),
      userGrammarList: context.userGrammarList.join(', '),
    });

    const structuredLlm = this.llm.withStructuredOutput(SGOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'story', output };
  }

  // ============================================================================
  // CONVERSATION GENERATION
  // ============================================================================

  private async executeConversationUnit(
    unit: ConversationUnit,
    context: LessonContext,
  ): Promise<CompiledUnit> {
    const prompt = this.buildPrompt(CG_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      targetLanguage: context.targetLanguage,
      instructions: unit.instructions,
      conversationLength: unit.conversationLength,
      userWordList: context.userWordList.join(', '),
      userGrammarList: context.userGrammarList.join(', '),
    });

    const structuredLlm = this.llm.withStructuredOutput(CGOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'conversation', output };
  }

  // ============================================================================
  // FILL IN THE BLANKS
  // ============================================================================

  private async executeFillInBlanksUnit(
    unit: FillInBlanksUnit,
    context: LessonContext,
  ): Promise<CompiledUnit> {
    // Calculate batch sizes: [3, 3, 3, 1] for 10 total
    const batchSizes = this.calculateBatchSizes(
      TOTAL_EXERCISES,
      MAX_BATCH_SIZE,
    );

    // Run all batches in parallel
    const batchPromises = batchSizes.map((batchSize) => {
      const prompt = this.buildPrompt(FIB_PROMPT_TEMPLATE, {
        userLevel: context.userLevel,
        instructions: unit.instructions,
        blankAmount: unit.blankAmount.toString(),
        distractorInstructions: unit.distractorInstructions,
        distractorCount: unit.distractorCount.toString(),
        userWordList: context.userWordList.join(', '),
        sentenceCount: batchSize.toString(),
      });

      const structuredLlm = this.llm.withStructuredOutput(FIBOutputSchema);
      return structuredLlm.invoke(prompt);
    });

    const batchResults = await Promise.all(batchPromises);

    // Combine all exercises from batches
    const allExercises = batchResults.flatMap((result) => result.exercises);

    return { type: 'fill in the blanks', output: { exercises: allExercises } };
  }

  // ============================================================================
  // TRANSLATION GENERATION
  // ============================================================================

  private async executeTranslationUnit(
    unit: TranslationUnit,
    context: LessonContext,
  ): Promise<CompiledUnit> {
    const prompt = this.buildPrompt(TG_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      instructions: unit.instructions,
      sentenceCount: unit.sentenceCount.toString(),
      startingLanguage: unit.startingLanguage,
      languageToTranslateTo: unit.languageToTranslateTo,
      userWordList: context.userWordList.join(', '),
    });

    const structuredLlm = this.llm.withStructuredOutput(TGOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'translation', output };
  }

  // ============================================================================
  // WORD MEANING MATCH
  // ============================================================================

  private async executeWordMatchUnit(
    unit: WordMatchUnit,
    context: LessonContext,
  ): Promise<CompiledUnit> {
    const prompt = this.buildPrompt(WMM_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      matchType: unit.matchType,
      theme: unit.theme,
      pairCount: unit.pairCount.toString(),
      distractorCount: unit.distractorCount.toString(),
      userWordList: context.userWordList.join(', '),
    });

    const structuredLlm = this.llm.withStructuredOutput(WMMOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'word meaning match', output };
  }

  // ============================================================================
  // WRITE IN THE BLANKS
  // ============================================================================

  private async executeWriteInBlanksUnit(
    unit: WriteInBlanksUnit,
    context: LessonContext,
  ): Promise<CompiledUnit> {
    // Calculate batch sizes: [3, 3, 3, 1] for 10 total
    const batchSizes = this.calculateBatchSizes(
      TOTAL_EXERCISES,
      MAX_BATCH_SIZE,
    );

    // Run all batches in parallel
    const batchPromises = batchSizes.map((batchSize) => {
      const prompt = this.buildPrompt(WIB_PROMPT_TEMPLATE, {
        userLevel: context.userLevel,
        instructions: unit.instructions,
        blankAmount: unit.blankAmount.toString(),
        userWordList: context.userWordList.join(', '),
        sentenceCount: batchSize.toString(),
      });

      const structuredLlm = this.llm.withStructuredOutput(WIBOutputSchema);
      return structuredLlm.invoke(prompt);
    });

    const batchResults = await Promise.all(batchPromises);

    // Combine all exercises from batches
    const allExercises = batchResults.flatMap((result) => result.exercises);

    return { type: 'write in the blanks', output: { exercises: allExercises } };
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

  /**
   * Calculate batch sizes for parallel execution
   * E.g., (10, 3) => [3, 3, 3, 1]
   */
  private calculateBatchSizes(total: number, maxBatchSize: number): number[] {
    const batches: number[] = [];
    let remaining = total;

    while (remaining > 0) {
      const batchSize = Math.min(remaining, maxBatchSize);
      batches.push(batchSize);
      remaining -= batchSize;
    }

    return batches;
  }
}
