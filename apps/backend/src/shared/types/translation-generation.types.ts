import { z } from 'zod';

export const TGOutputSchema = z.object({
  exercises: z.array(z.object({
    paragraph: z
    .string()
    .describe(
      'The paragraph or sentence in the starting language the user needs to translate.',
    ),
  translation: z.string().describe('The ideal translation of the paragraph.'),
})).describe('An array of Translation exercises.'),});

export type TGOutput = z.infer<typeof TGOutputSchema>;