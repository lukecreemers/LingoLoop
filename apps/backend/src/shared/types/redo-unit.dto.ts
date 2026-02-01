import { z } from 'zod';
import { LessonPlanUnitSchema, CompiledUnitSchema } from './custom-lesson-generation.types';

// ============================================================================
// REDO UNIT REQUEST
// ============================================================================

export const RedoUnitInputSchema = z.object({
  // The unit instructions (what to generate)
  unitPlan: LessonPlanUnitSchema.describe('The original unit plan with instructions'),
  
  // The previous output to avoid
  previousOutput: CompiledUnitSchema.describe('The previous compiled unit output to avoid duplicating'),
  
  // Context for generation
  userLevel: z.string().describe('User proficiency level (e.g., "beginner", "intermediate")'),
  targetLanguage: z.string().default('Spanish').describe('The language being learned'),
  nativeLanguage: z.string().default('English').describe('The user native language'),
});

export const RedoUnitOutputSchema = CompiledUnitSchema;

export type RedoUnitInput = z.infer<typeof RedoUnitInputSchema>;
export type RedoUnitOutput = z.infer<typeof RedoUnitOutputSchema>;

// ============================================================================
// DTO CLASS (for NestJS validation)
// ============================================================================

export class RedoUnitDto {
  unitPlan: z.infer<typeof LessonPlanUnitSchema>;
  previousOutput: z.infer<typeof CompiledUnitSchema>;
  userLevel: string;
  targetLanguage?: string;
  nativeLanguage?: string;
}

