import { z } from 'zod';
export const WIBOutputSchema = z.object({
  exercises: z
    .array(
      z.object({
        template: z
          .string()
          .describe("The sentence with [*] for blanks. E.g., 'Yo [*] hambre.'"),
        blanks: z.array(
          z.object({
            correctAnswer: z
              .string()
              .describe('The exact string the user must type.'),
            clue: z
              .string()
              .describe("The infinitive or root word, e.g., '(ir)'"),
            acceptedAlternates: z
              .array(z.string())
              .describe(
                'e.g. variations with/without accents if you want to be lenient.',
              ),
          }),
        ),
      }),
    )
    .describe('An array of Fill in the Blanks exercises.'),
});

export type WIBOutput = z.infer<typeof WIBOutputSchema>;
