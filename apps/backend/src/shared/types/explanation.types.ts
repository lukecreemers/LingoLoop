import { z } from 'zod';
// ============================================================================
// OUTPUT SCHEMA
// Explanation is just a markdown string - no wrapper object needed
// ============================================================================

export const EXOutputSchema = z
  .string()
  .describe('The full explanation in Markdown format.');

export type EXOutput = z.infer<typeof EXOutputSchema>;
