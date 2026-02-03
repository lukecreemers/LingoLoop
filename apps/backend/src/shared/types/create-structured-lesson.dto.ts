import { z } from 'zod';

/**
 * DTO for creating a structured lesson with context from the learning journey
 */
export const CreateStructuredLessonDto = z.object({
  // User profile
  userLevel: z.string(),
  targetLanguage: z.string(),
  nativeLanguage: z.string(),

  // Lesson info
  lessonTitle: z.string(),
  lessonDescription: z.string(),

  // Context from learning journey (optional)
  weekTitle: z.string().optional(),
  weekDescription: z.string().optional(),
  weekLessonsSoFar: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  previousWeeksSummary: z.string().optional(),
});

export type CreateStructuredLessonDto = z.infer<typeof CreateStructuredLessonDto>;

