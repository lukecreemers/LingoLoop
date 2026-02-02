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
// UNIT TYPE ENUM
// Using snake_case for easier AI parsing
// ============================================================================

export const UnitTypeSchema = z.enum([
  'flashcard',
  'explanation',
  'fill_in_blanks',
  'word_match',
  'write_in_blanks',
  'translation',
  'conversation',
  'writing_practice',
  'word_order',
]);

export type UnitType = z.infer<typeof UnitTypeSchema>;

// ============================================================================
// SIMPLIFIED LESSON PLAN UNIT SCHEMA
// All units now just have type + instructions
// The instructions string contains all necessary details for the sub-agent
// ============================================================================

export const LessonPlanUnitSchema = z.object({
  type: UnitTypeSchema.describe('The type of learning unit to generate.'),
  instructions: z
    .string()
    .describe(
      'Detailed instructions for the sub-agent. Must include all necessary parameters like counts, themes, difficulty settings, etc.',
    ),
});

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
  plan: LessonPlanUnitSchema,
  output: EXOutputSchema,
});

export const CompiledFillInBlanksUnitSchema = z.object({
  type: z.literal('fill_in_blanks'),
  plan: LessonPlanUnitSchema,
  output: FIBOutputSchema,
});

export const CompiledWordMatchUnitSchema = z.object({
  type: z.literal('word_match'),
  plan: LessonPlanUnitSchema,
  output: WMMOutputSchema,
});

export const CompiledWriteInBlanksUnitSchema = z.object({
  type: z.literal('write_in_blanks'),
  plan: LessonPlanUnitSchema,
  output: WIBOutputSchema,
});

export const CompiledTranslationUnitSchema = z.object({
  type: z.literal('translation'),
  plan: LessonPlanUnitSchema,
  output: TGOutputSchema,
});

export const CompiledConversationUnitSchema = z.object({
  type: z.literal('conversation'),
  plan: LessonPlanUnitSchema,
  output: CGOutputSchema,
});

export const CompiledFlashcardUnitSchema = z.object({
  type: z.literal('flashcard'),
  plan: LessonPlanUnitSchema,
  output: FCOutputSchema,
});

export const CompiledWritingPracticeUnitSchema = z.object({
  type: z.literal('writing_practice'),
  plan: LessonPlanUnitSchema,
  output: WPOutputSchema,
});

export const CompiledWordOrderUnitSchema = z.object({
  type: z.literal('word_order'),
  plan: LessonPlanUnitSchema,
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
