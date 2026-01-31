import { z } from 'zod';

export const TMOutputSchema = z.object({
  markedText: z
    .string()
    .describe(
      'The user\'s text reconstructed with inline <err> tags around mistakes. Format: <err fix="Correct Version" why="Reason">User\'s Wrong Word</err>',
    ),
  overallScore: z
    .number()
    .min(1)
    .max(10)
    .describe('The overall score of the translation.'),
});

export type TMOutput = z.infer<typeof TMOutputSchema>;
