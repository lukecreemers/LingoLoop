import { z } from 'zod';

export const ExplanationChatInputSchema = z.object({
  explanationContext: z
    .string()
    .describe('The original explanation content the user is asking about.'),
  userQuestion: z.string().describe("The user's follow-up question."),
  targetLanguage: z
    .string()
    .default('Spanish')
    .describe('The language being learned.'),
  nativeLanguage: z
    .string()
    .default('English')
    .describe("The user's native language."),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .default([])
    .describe('Previous messages in the conversation.'),
});

export type ExplanationChatInput = z.infer<typeof ExplanationChatInputSchema>;
