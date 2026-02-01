import { z } from 'zod';
import { CGOutputSchema } from './conversation-generation.types';
import { FIBOutputSchema } from './fill-in-blanks.types';
import { TGOutputSchema } from './translation-generation.types';
import { WMMOutputSchema } from './word-meaning-match.types';
import { WIBOutputSchema } from './write-in-blanks.types';
import { EXOutputSchema } from './explanation.types';
import { FCOutputSchema } from './flashcard.types';
import { WPOutputSchema } from './writing-practice.types';
import { WOOutputSchema } from './word-order.types';

// ============================================================================
// UNIT INSTRUCTION SCHEMAS (from lesson plan)
// ============================================================================

export const ExplanationUnitSchema = z.object({
  type: z.literal('explanation'),
  instructions: z
    .string()
    .describe(
      'The topic or concept to explain (e.g., "The difference between Por and Para", "When to use the subjunctive").',
    ),
});

export const FillInBlanksUnitSchema = z.object({
  type: z.literal('fill in the blanks'),
  instructions: z
    .string()
    .describe(
      'The instructions for the fill in the blanks exercise to be generated.',
    ),
  blankAmount: z.number().describe('The number of blanks in each sentence.'),
  distractorInstructions: z
    .string()
    .describe('The instructions for the distractors to be generated.'),
  distractorCount: z
    .number()
    .describe('The number of distractors to be generated for each sentence.'),
});

export const WordMatchUnitSchema = z.object({
  type: z.literal('word meaning match'),
  matchType: z
    .string()
    .describe(
      'The type of match to be generated. (e.g. "Spanish Infinitive → English Translation", "Spanish Noun → Correct Article (el/la)").',
    ),
  theme: z
    .string()
    .describe(
      'The theme of the exercise. (e.g. "Common -ar verbs", "Household objects and their gender").',
    ),
  pairCount: z.number().describe('The number of pairs to be generated.'),
  distractorCount: z
    .number()
    .describe('The number of distractors to be generated.'),
});

export const WriteInBlanksUnitSchema = z.object({
  type: z.literal('write in the blanks'),
  instructions: z
    .string()
    .describe(
      'The instructions for the write in the blanks exercise to be generated.',
    ),
  blankAmount: z.number().describe('The number of blanks in each sentence.'),
});

export const TranslationUnitSchema = z.object({
  type: z.literal('translation'),
  instructions: z
    .string()
    .describe(
      'The instructions for the translation exercise to be generated. ',
    ),
  sentenceCount: z
    .number()
    .describe('The number of sentences to be generated.'),
  startingLanguage: z
    .string()
    .describe('The starting language of the exercise.'),
  languageToTranslateTo: z
    .string()
    .describe('The language the user will be translating into.'),
});

export const ConversationUnitSchema = z.object({
  type: z.literal('conversation'),
  instructions: z
    .string()
    .describe('The instructions for the conversation to be generated.'),
  conversationLength: z
    .enum(['short', 'medium', 'long'])
    .describe('The length of the conversation.'),
});

export const FlashcardUnitSchema = z.object({
  type: z.literal('flashcard'),
  instructions: z
    .string()
    .describe(
      'The vocabulary theme or list of words/phrases to teach (e.g., "Basic greetings", "Food vocabulary", "Numbers 1-20").',
    ),
  cardCount: z
    .number()
    .describe('The number of flashcards to generate (typically 5-10).'),
});

export const WritingPracticeUnitSchema = z.object({
  type: z.literal('writing practice'),
  instructions: z
    .string()
    .describe(
      'The topic, theme, or type of prompts to generate (e.g., "Daily routines", "Opinion on technology", "Describe your ideal vacation").',
    ),
  promptCount: z
    .number()
    .describe('The number of writing prompts to generate (typically 2-4).'),
});

export const WordOrderUnitSchema = z.object({
  type: z.literal('word order'),
  instructions: z
    .string()
    .describe(
      'The theme or grammar focus for the sentences (e.g., "Questions with interrogatives", "Sentences with reflexive verbs").',
    ),
  sentenceCount: z
    .number()
    .describe('The number of sentences to generate (typically 5-8).'),
});

// ============================================================================
// LESSON PLAN OUTPUT SCHEMA
// ============================================================================

export const LessonPlanUnitSchema = z.discriminatedUnion('type', [
  FlashcardUnitSchema,
  ExplanationUnitSchema,
  FillInBlanksUnitSchema,
  WordMatchUnitSchema,
  WriteInBlanksUnitSchema,
  TranslationUnitSchema,
  ConversationUnitSchema,
  WritingPracticeUnitSchema,
  WordOrderUnitSchema,
]);

export const CLGOutputSchema = z.object({
  units: z
    .array(LessonPlanUnitSchema)
    .describe(
      'A sequence of learning units tailored to the user request and level. Each unit has a specific type and set of instructions for a sub-agent to execute.',
    ),
});

// ============================================================================
// COMPILED OUTPUT SCHEMAS (after executing each unit)
// Each includes the original plan (instructions) for redo functionality
// ============================================================================

export const CompiledExplanationUnitSchema = z.object({
  type: z.literal('explanation'),
  plan: ExplanationUnitSchema,
  output: EXOutputSchema,
});

export const CompiledFillInBlanksUnitSchema = z.object({
  type: z.literal('fill in the blanks'),
  plan: FillInBlanksUnitSchema,
  output: FIBOutputSchema,
});

export const CompiledWordMatchUnitSchema = z.object({
  type: z.literal('word meaning match'),
  plan: WordMatchUnitSchema,
  output: WMMOutputSchema,
});

export const CompiledWriteInBlanksUnitSchema = z.object({
  type: z.literal('write in the blanks'),
  plan: WriteInBlanksUnitSchema,
  output: WIBOutputSchema,
});

export const CompiledTranslationUnitSchema = z.object({
  type: z.literal('translation'),
  plan: TranslationUnitSchema,
  output: TGOutputSchema,
});

export const CompiledConversationUnitSchema = z.object({
  type: z.literal('conversation'),
  plan: ConversationUnitSchema,
  output: CGOutputSchema,
});

export const CompiledFlashcardUnitSchema = z.object({
  type: z.literal('flashcard'),
  plan: FlashcardUnitSchema,
  output: FCOutputSchema,
});

export const CompiledWritingPracticeUnitSchema = z.object({
  type: z.literal('writing practice'),
  plan: WritingPracticeUnitSchema,
  output: WPOutputSchema,
});

export const CompiledWordOrderUnitSchema = z.object({
  type: z.literal('word order'),
  plan: WordOrderUnitSchema,
  output: WOOutputSchema,
});

export const CompiledUnitSchema = z.discriminatedUnion('type', [
  CompiledFlashcardUnitSchema,
  CompiledExplanationUnitSchema,
  CompiledFillInBlanksUnitSchema,
  CompiledWordMatchUnitSchema,
  CompiledWriteInBlanksUnitSchema,
  CompiledTranslationUnitSchema,
  CompiledConversationUnitSchema,
  CompiledWritingPracticeUnitSchema,
  CompiledWordOrderUnitSchema,
]);

export const CompiledLessonSchema = z.object({
  units: z.array(CompiledUnitSchema),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ExplanationUnit = z.infer<typeof ExplanationUnitSchema>;
export type FillInBlanksUnit = z.infer<typeof FillInBlanksUnitSchema>;
export type WordMatchUnit = z.infer<typeof WordMatchUnitSchema>;
export type WriteInBlanksUnit = z.infer<typeof WriteInBlanksUnitSchema>;
export type TranslationUnit = z.infer<typeof TranslationUnitSchema>;
export type ConversationUnit = z.infer<typeof ConversationUnitSchema>;
export type FlashcardUnit = z.infer<typeof FlashcardUnitSchema>;
export type WritingPracticeUnit = z.infer<typeof WritingPracticeUnitSchema>;
export type WordOrderUnit = z.infer<typeof WordOrderUnitSchema>;
export type LessonPlanUnit = z.infer<typeof LessonPlanUnitSchema>;

export type CLGOutput = z.infer<typeof CLGOutputSchema>;

export type CompiledExplanationUnit = z.infer<
  typeof CompiledExplanationUnitSchema
>;
export type CompiledFillInBlanksUnit = z.infer<
  typeof CompiledFillInBlanksUnitSchema
>;
export type CompiledWordMatchUnit = z.infer<typeof CompiledWordMatchUnitSchema>;
export type CompiledWriteInBlanksUnit = z.infer<
  typeof CompiledWriteInBlanksUnitSchema
>;
export type CompiledTranslationUnit = z.infer<
  typeof CompiledTranslationUnitSchema
>;
export type CompiledConversationUnit = z.infer<
  typeof CompiledConversationUnitSchema
>;
export type CompiledFlashcardUnit = z.infer<typeof CompiledFlashcardUnitSchema>;
export type CompiledWritingPracticeUnit = z.infer<
  typeof CompiledWritingPracticeUnitSchema
>;
export type CompiledWordOrderUnit = z.infer<typeof CompiledWordOrderUnitSchema>;
export type CompiledUnit = z.infer<typeof CompiledUnitSchema>;
export type CompiledLesson = z.infer<typeof CompiledLessonSchema>;
