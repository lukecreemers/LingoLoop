import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable } from '@nestjs/common';

// Schemas
import {
  CGOutputSchema,
  FIBOutputSchema,
  TGOutputSchema,
  WMMOutputSchema,
  WIBOutputSchema,
  EXOutputSchema,
  FCOutputSchema,
} from 'src/shared';
import type {
  LessonPlanUnit,
  CompiledUnit,
  ExplanationUnit,
  FillInBlanksUnit,
  WordMatchUnit,
  WriteInBlanksUnit,
  TranslationUnit,
  ConversationUnit,
  FlashcardUnit,
} from 'src/shared';
import type { RedoUnitInput } from 'src/shared/types/redo-unit.dto';

// Prompt templates from test cases
import { EX_PROMPT_TEMPLATE } from 'src/testing/cases/explanation.cases';
import { FIB_PROMPT_TEMPLATE } from 'src/testing/cases/fill-in-blanks.cases';
import { WMM_PROMPT_TEMPLATE } from 'src/testing/cases/word-meaning-match.cases';
import { WIB_PROMPT_TEMPLATE } from 'src/testing/cases/write-in-blanks.cases';
import { TG_PROMPT_TEMPLATE } from 'src/testing/cases/translation-generation.cases';
import { CG_PROMPT_TEMPLATE } from 'src/testing/cases/conversation-generation.cases';
import { FC_PROMPT_TEMPLATE } from 'src/testing/cases/flashcard.cases';
import type { LessonContext } from './lesson.context';
import { DEFAULT_WORD_LIST, DEFAULT_GRAMMAR_LIST } from './lesson.context';

// Batching configuration for exercise generation
const TOTAL_EXERCISES = 3;
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
      case 'flashcard':
        return this.executeFlashcardUnit(unit, context);
      case 'explanation':
        return this.executeExplanationUnit(unit, context);
      case 'fill in the blanks':
        return this.executeFillInBlanksUnit(unit, context);
      case 'word meaning match':
        return this.executeWordMatchUnit(unit, context);
      case 'write in the blanks':
        return this.executeWriteInBlanksUnit(unit, context);
      case 'translation':
        return this.executeTranslationUnit(unit, context);
      case 'conversation':
        return this.executeConversationUnit(unit, context);
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

  /**
   * Regenerate a unit with different content
   * Includes the previous output in the prompt to ensure variety
   */
  async redoUnit(input: RedoUnitInput): Promise<CompiledUnit> {
    const context: LessonContext = {
      userLevel: input.userLevel,
      targetLanguage: input.targetLanguage ?? 'Spanish',
      nativeLanguage: input.nativeLanguage ?? 'English',
      userWordList: DEFAULT_WORD_LIST,
      userGrammarList: DEFAULT_GRAMMAR_LIST,
    };

    // Build "avoid" context from previous output
    const avoidContext = this.buildAvoidContext(input.previousOutput);

    switch (input.unitPlan.type) {
      case 'flashcard':
        return this.executeFlashcardUnit(input.unitPlan, context, avoidContext);
      case 'explanation':
        return this.executeExplanationUnit(
          input.unitPlan,
          context,
          avoidContext,
        );
      case 'fill in the blanks':
        return this.executeFillInBlanksUnit(
          input.unitPlan,
          context,
          avoidContext,
        );
      case 'word meaning match':
        return this.executeWordMatchUnit(input.unitPlan, context, avoidContext);
      case 'write in the blanks':
        return this.executeWriteInBlanksUnit(
          input.unitPlan,
          context,
          avoidContext,
        );
      case 'translation':
        return this.executeTranslationUnit(
          input.unitPlan,
          context,
          avoidContext,
        );
      case 'conversation':
        return this.executeConversationUnit(
          input.unitPlan,
          context,
          avoidContext,
        );
      default:
        throw new Error(
          `Unknown unit type: ${(input.unitPlan as LessonPlanUnit).type}`,
        );
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
        // Summarize key points to avoid repeating
        const explanation = previousOutput.output.explanation;
        return `IMPORTANT: Generate completely different content. The previous explanation covered: "${explanation.slice(0, 500)}...". Use different examples, different structure, and different explanations.`;

      case 'fill in the blanks':
      case 'write in the blanks':
        const sentences = previousOutput.output.exercises
          .map((e) => e.template)
          .join('; ');
        return `IMPORTANT: Generate completely different sentences. DO NOT use any of these sentences or similar variations: ${sentences}`;

      case 'word meaning match':
        const pairs = previousOutput.output.exercises
          .flatMap((e) => e.pairs.map((p) => p[0]))
          .join(', ');
        return `IMPORTANT: Generate completely different word pairs. DO NOT use any of these words: ${pairs}`;

      case 'translation':
        const paragraph = previousOutput.output.paragraph;
        return `IMPORTANT: Generate a completely different paragraph. DO NOT use this paragraph or similar variations: ${paragraph}`;

      case 'conversation':
        return `IMPORTANT: Generate a completely different conversation. The previous conversation was: "${previousOutput.output.conversation.slice(0, 500)}...". Use different characters, different scenario, different dialogue.`;

      default:
        return '';
    }
  }

  // ============================================================================
  // FLASHCARD GENERATION
  // ============================================================================

  private async executeFlashcardUnit(
    unit: FlashcardUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    let prompt = this.buildPrompt(FC_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      targetLanguage: context.targetLanguage,
      nativeLanguage: context.nativeLanguage,
      instructions: unit.instructions,
      cardCount: unit.cardCount.toString(),
      userWordList: context.userWordList.join(', '),
    });

    if (avoidContext) {
      prompt = `${avoidContext}\n\n${prompt}`;
    }

    const structuredLlm = this.llm.withStructuredOutput(FCOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'flashcard', plan: unit, output };
  }

  // ============================================================================
  // EXPLANATION GENERATION
  // ============================================================================

  private async executeExplanationUnit(
    unit: ExplanationUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    let prompt = this.buildPrompt(EX_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      targetLanguage: context.targetLanguage,
      instructions: unit.instructions,
      userWordList: context.userWordList.join(', '),
      userGrammarList: context.userGrammarList.join(', '),
    });

    if (avoidContext) {
      prompt = `${avoidContext}\n\n${prompt}`;
    }

    const structuredLlm = this.llm.withStructuredOutput(EXOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'explanation', plan: unit, output };
  }

  // ============================================================================
  // FILL IN THE BLANKS
  // ============================================================================

  private async executeFillInBlanksUnit(
    unit: FillInBlanksUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    // Calculate batch sizes: [3, 3, 3, 1] for 10 total
    const batchSizes = this.calculateBatchSizes(
      TOTAL_EXERCISES,
      MAX_BATCH_SIZE,
    );

    // Run all batches in parallel
    const batchPromises = batchSizes.map((batchSize) => {
      let prompt = this.buildPrompt(FIB_PROMPT_TEMPLATE, {
        userLevel: context.userLevel,
        instructions: unit.instructions,
        blankAmount: unit.blankAmount.toString(),
        distractorInstructions: unit.distractorInstructions,
        distractorCount: unit.distractorCount.toString(),
        userWordList: context.userWordList.join(', '),
        sentenceCount: batchSize.toString(),
      });

      if (avoidContext) {
        prompt = `${avoidContext}\n\n${prompt}`;
      }

      const structuredLlm = this.llm.withStructuredOutput(FIBOutputSchema);
      return structuredLlm.invoke(prompt);
    });

    const batchResults = await Promise.all(batchPromises);

    // Combine all exercises from batches
    const allExercises = batchResults.flatMap((result) => result.exercises);

    return {
      type: 'fill in the blanks',
      plan: unit,
      output: { exercises: allExercises },
    };
  }

  // ============================================================================
  // WORD MEANING MATCH
  // ============================================================================

  private async executeWordMatchUnit(
    unit: WordMatchUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    let prompt = this.buildPrompt(WMM_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      matchType: unit.matchType,
      theme: unit.theme,
      pairCount: unit.pairCount.toString(),
      distractorCount: unit.distractorCount.toString(),
      userWordList: context.userWordList.join(', '),
    });

    if (avoidContext) {
      prompt = `${avoidContext}\n\n${prompt}`;
    }

    const structuredLlm = this.llm.withStructuredOutput(WMMOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'word meaning match', plan: unit, output };
  }

  // ============================================================================
  // WRITE IN THE BLANKS
  // ============================================================================

  private async executeWriteInBlanksUnit(
    unit: WriteInBlanksUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    // Calculate batch sizes: [3, 3, 3, 1] for 10 total
    const batchSizes = this.calculateBatchSizes(
      TOTAL_EXERCISES,
      MAX_BATCH_SIZE,
    );

    // Run all batches in parallel
    const batchPromises = batchSizes.map((batchSize) => {
      let prompt = this.buildPrompt(WIB_PROMPT_TEMPLATE, {
        userLevel: context.userLevel,
        instructions: unit.instructions,
        blankAmount: unit.blankAmount.toString(),
        userWordList: context.userWordList.join(', '),
        sentenceCount: batchSize.toString(),
      });

      if (avoidContext) {
        prompt = `${avoidContext}\n\n${prompt}`;
      }

      const structuredLlm = this.llm.withStructuredOutput(WIBOutputSchema);
      return structuredLlm.invoke(prompt);
    });

    const batchResults = await Promise.all(batchPromises);

    // Combine all exercises from batches
    const allExercises = batchResults.flatMap((result) => result.exercises);

    return {
      type: 'write in the blanks',
      plan: unit,
      output: { exercises: allExercises },
    };
  }

  // ============================================================================
  // TRANSLATION GENERATION
  // ============================================================================

  private async executeTranslationUnit(
    unit: TranslationUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    let prompt = this.buildPrompt(TG_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      instructions: unit.instructions,
      sentenceCount: unit.sentenceCount.toString(),
      startingLanguage: unit.startingLanguage,
      languageToTranslateTo: unit.languageToTranslateTo,
      userWordList: context.userWordList.join(', '),
    });

    if (avoidContext) {
      prompt = `${avoidContext}\n\n${prompt}`;
    }

    const structuredLlm = this.llm.withStructuredOutput(TGOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'translation', plan: unit, output };
  }

  // ============================================================================
  // CONVERSATION GENERATION
  // ============================================================================

  private async executeConversationUnit(
    unit: ConversationUnit,
    context: LessonContext,
    avoidContext?: string,
  ): Promise<CompiledUnit> {
    let prompt = this.buildPrompt(CG_PROMPT_TEMPLATE, {
      userLevel: context.userLevel,
      targetLanguage: context.targetLanguage,
      instructions: unit.instructions,
      conversationLength: unit.conversationLength,
      userWordList: context.userWordList.join(', '),
      userGrammarList: context.userGrammarList.join(', '),
    });

    if (avoidContext) {
      prompt = `${avoidContext}\n\n${prompt}`;
    }

    const structuredLlm = this.llm.withStructuredOutput(CGOutputSchema);
    const output = await structuredLlm.invoke(prompt);

    return { type: 'conversation', plan: unit, output };
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
