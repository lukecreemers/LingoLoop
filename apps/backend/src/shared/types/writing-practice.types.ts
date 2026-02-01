import { z } from 'zod';

// ============================================================================
// WRITING PRACTICE GENERATION OUTPUT SCHEMA
// ============================================================================

export const WritingPromptSchema = z.object({
  prompt: z
    .string()
    .describe(
      'The writing prompt/question in the target language that the user must respond to',
    ),
  promptTranslation: z
    .string()
    .describe('Translation of the prompt in the native language for clarity'),
  hints: z
    .array(z.string())
    .optional()
    .describe('Optional vocabulary or grammar hints to help the user'),
  expectedLength: z
    .enum(['short', 'medium', 'long'])
    .describe(
      'Expected response length: short (1-2 sentences), medium (3-5 sentences), long (paragraph)',
    ),
});

export const WPOutputSchema = z.object({
  topic: z.string().describe('The overall topic or theme of the writing prompts'),
  prompts: z
    .array(WritingPromptSchema)
    .describe('Array of writing prompts for the user to respond to'),
});

// ============================================================================
// WRITING PRACTICE MARKING INPUT/OUTPUT SCHEMAS
// ============================================================================

export const WPMarkingInputSchema = z.object({
  prompt: z.string().describe('The original writing prompt'),
  userResponse: z.string().describe("The user's written response"),
  targetLanguage: z.string().describe('The language the user is writing in'),
  nativeLanguage: z.string().describe("The user's native language"),
  userLevel: z.string().describe("The user's proficiency level"),
});

export const WPMarkingOutputSchema = z.object({
  markedText: z
    .string()
    .describe(
      'The user\'s response reconstructed with inline <err> tags around mistakes. Format: <err fix="Correct Version" why="Reason">User\'s Wrong Word</err>',
    ),
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall score from 0-100'),
  feedback: z
    .string()
    .describe(
      'Overall feedback on the response in an encouraging but constructive tone',
    ),
  modelAnswer: z
    .string()
    .describe(
      "A refined version of the user's response with all mistakes corrected, maintaining their original intent and ideas",
    ),
  strengths: z
    .array(z.string())
    .describe('What the user did well (2-3 points)'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WritingPrompt = z.infer<typeof WritingPromptSchema>;
export type WPOutput = z.infer<typeof WPOutputSchema>;
export type WPMarkingInput = z.infer<typeof WPMarkingInputSchema>;
export type WPMarkingOutput = z.infer<typeof WPMarkingOutputSchema>;

