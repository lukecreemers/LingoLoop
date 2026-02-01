import z from 'zod';

export const SGOutputSchema = z.object({
  story: z.string().describe('The output story.'),
});

export type SGOutput = z.infer<typeof SGOutputSchema>;
