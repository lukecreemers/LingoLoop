import { z } from 'zod';

export const TGOutputSchema = z.object({
  paragraph: z
    .string()
    .describe(
      'The paragraph in the starting language the user needs to translate.',
    ),
  translation: z.string().describe('The ideal translation of the paragraph.'),
});

export type TGOutput = z.infer<typeof TGOutputSchema>;
