import { z } from 'zod';
// ============================================================================
// OUTPUT SCHEMA
// ============================================================================

export const EXOutputSchema = z.object({
  explanation: z.string().describe('The full explanation in Markdown format.'),
});

export type EXOutput = z.infer<typeof EXOutputSchema>;
