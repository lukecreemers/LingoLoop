import { z } from 'zod';

// ============================================================================
// EXPLAIN WRONG ANSWER
// ============================================================================

export const ExplainWrongInputSchema = z.object({
  unitType: z
    .string()
    .describe('The type of exercise (e.g., "fill_in_blanks", "translation")'),
  context: z
    .string()
    .describe('The exercise context (sentence, question, etc.)'),
  userAnswer: z.string().describe("The user's incorrect answer"),
  correctAnswer: z.string().describe('The correct answer'),
  targetLanguage: z.string().describe('The language being learned'),
});

export const ExplainWrongOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      'A brief, encouraging explanation of why the answer was wrong and how to remember the correct answer.',
    ),
  tip: z
    .string()
    .describe('A short memory tip or mnemonic to help remember the rule.'),
});

export type ExplainWrongInput = z.infer<typeof ExplainWrongInputSchema>;
export type ExplainWrongOutput = z.infer<typeof ExplainWrongOutputSchema>;

// ============================================================================
// TRANSLATE SELECTION
// ============================================================================

export const TranslateSelectionInputSchema = z.object({
  text: z.string().describe('The text to translate'),
  sourceLanguage: z.string().describe('The source language'),
  targetLanguage: z.string().describe('The target language for translation'),
});

export const TranslateSelectionOutputSchema = z.object({
  translation: z.string().describe('The translated text'),
  breakdown: z
    .array(
      z.object({
        word: z.string().describe('A word or phrase from the original'),
        translation: z.string().describe('Its translation'),
        note: z
          .string()
          .optional()
          .describe('Optional grammatical note or context'),
      }),
    )
    .optional()
    .describe('Word-by-word breakdown for learning (for short selections)'),
});

export type TranslateSelectionInput = z.infer<
  typeof TranslateSelectionInputSchema
>;
export type TranslateSelectionOutput = z.infer<
  typeof TranslateSelectionOutputSchema
>;

