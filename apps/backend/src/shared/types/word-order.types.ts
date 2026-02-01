import { z } from 'zod';

// ============================================================================
// WORD ORDER UNIT OUTPUT SCHEMA
// ============================================================================

export const WOSentenceSchema = z.object({
  sentence: z.string().describe('A complete sentence in the target language'),
  translation: z
    .string()
    .describe('The translation of the sentence in the native language'),
});

export const WOOutputSchema = z.object({
  sentences: z
    .array(WOSentenceSchema)
    .describe('Array of sentences for the user to reorder'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WOSentence = z.infer<typeof WOSentenceSchema>;
export type WOOutput = z.infer<typeof WOOutputSchema>;

