import { z } from 'zod';

export const CGOutputSchema = z.object({
  characters: z
    .array(
      z.object({
        name: z.string().describe('The name of the character.'),
        age: z
          .enum(['child', 'teen', 'adult', 'elderly'])
          .describe('The age of the character.'),
        gender: z
          .enum(['male', 'female', 'other'])
          .describe('The gender of the character.'),
      }),
    )
    .describe('The characters in the conversation.'),
  conversation: z
    .string()
    .describe(
      'The full conversation text. Format: **Name**: Dialogue sentence. Use new lines between turns.',
    ),
});

export type CGOutput = z.infer<typeof CGOutputSchema>;
