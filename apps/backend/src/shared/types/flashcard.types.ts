import { z } from 'zod';

// ============================================================================
// FLASHCARD OUTPUT SCHEMA
// ============================================================================

export const FlashcardItemSchema = z.object({
  term: z.string().describe('The word or phrase in the target language'),
  definition: z
    .string()
    .describe('The translation/meaning in the native language'),
  example: z
    .string()
    .optional()
    .describe('An example sentence using the term (in target language)'),
  exampleTranslation: z
    .string()
    .optional()
    .describe('Translation of the example sentence'),
});

export const FCOutputSchema = z.object({
  cards: z
    .array(FlashcardItemSchema)
    .describe(
      'Array of flashcard items with terms, definitions, and optional examples',
    ),
  theme: z.string().describe('The theme or category of these flashcards'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FlashcardItem = z.infer<typeof FlashcardItemSchema>;
export type FCOutput = z.infer<typeof FCOutputSchema>;

