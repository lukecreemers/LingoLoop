import { z } from 'zod';

// ============================================================================
// TOPIC BREAKDOWN OUTPUT SCHEMA
// ============================================================================

/**
 * Simple topic breakdown - just an array of detailed instruction strings
 * Each string describes a logical sub-section of the topic with teaching guidance
 */
export const TBOutputSchema = z.object({
  sections: z
    .array(z.string())
    .min(1)
    .describe(
      'An array of detailed instructional strings. Each string describes one logical sub-section of the topic, what specifically to teach, key points to cover, common mistakes to address, and the suggested flow of activities for that section.',
    ),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TBOutput = z.infer<typeof TBOutputSchema>;
