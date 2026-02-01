import { z } from 'zod';

export const WMMOutputSchema = z.object({
  exercises: z.array(
    z.object({
      columnLabels: z.object({
        a: z.string().describe("E.g., 'Sentence Start'"),
        b: z.string().describe("E.g., 'Sentence End'"),
      }),

      pairs: z
        .array(z.tuple([z.string(), z.string()]))
        .describe('Pairs of strings that belong together.'),

      distractors: z
        .array(z.string())
        .describe('Extra items for Column B that fit the theme but are wrong.'),

      instruction: z
        .string()
        .describe(
          "E.g., 'Match the Spanish verbs with their English translations.'",
        ),
    }),
  ),
});

export type WMMOutput = z.infer<typeof WMMOutputSchema>;
