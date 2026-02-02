import { z } from 'zod';
import { CompiledUnitSchema, LessonPlanUnitSchema } from './custom-lesson-generation.types';

// ============================================================================
// SECTIONED LESSON TYPES
// A lesson broken into logical sections, each with its own units
// ============================================================================

/**
 * A compiled section containing executed units
 */
export const CompiledSectionSchema = z.object({
  /** The original section instruction from topic breakdown */
  sectionInstruction: z.string(),
  /** The section's position in the lesson (0-indexed) */
  sectionIndex: z.number(),
  /** The unit plans for this section (for redo functionality) */
  unitPlans: z.array(LessonPlanUnitSchema),
  /** The compiled/executed units */
  units: z.array(CompiledUnitSchema),
});

/**
 * A complete lesson organized into sections
 */
export const SectionedLessonSchema = z.object({
  /** Original user input for regeneration */
  input: z.object({
    instructions: z.string(),
    userLevel: z.string(),
    targetLanguage: z.string(),
    nativeLanguage: z.string(),
  }),
  /** The section breakdown from stage 1 */
  sectionInstructions: z.array(z.string()),
  /** All compiled sections */
  sections: z.array(CompiledSectionSchema),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CompiledSection = z.infer<typeof CompiledSectionSchema>;
export type SectionedLesson = z.infer<typeof SectionedLessonSchema>;

