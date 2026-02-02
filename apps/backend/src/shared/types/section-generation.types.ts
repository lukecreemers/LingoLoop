import { z } from 'zod';
import { LessonPlanUnitSchema } from './custom-lesson-generation.types';

// ============================================================================
// SECTION GENERATION OUTPUT SCHEMA
// Reuses the same unit schemas as CLG but for a single section
// ============================================================================

export const SecGenOutputSchema = z.object({
  units: z
    .array(LessonPlanUnitSchema)
    .describe(
      'A sequence of learning units for this section. Each unit has a specific type and instructions.',
    ),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SecGenOutput = z.infer<typeof SecGenOutputSchema>;
