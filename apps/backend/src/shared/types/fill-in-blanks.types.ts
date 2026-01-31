import { z } from 'zod';
export const FIBOutputSchema = z.object({
  exercises: z
    .array(
      z.object({
        template: z
          .string()
          .describe("The sentence with [*] for blanks. E.g., 'Yo [*] hambre.'"),
        answers: z
          .array(z.string())
          .describe('The correct words for the [*] slots in order.'),
        distractors: z.array(z.string()).describe('Incorrect words.'),
      }),
    )
    .describe('An array of Fill in the Blanks exercises.'),
});

export type FIBOutput = z.infer<typeof FIBOutputSchema>;
