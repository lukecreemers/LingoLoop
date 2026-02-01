import z from 'zod';

export const CreateLessonDto = z.object({
  instructions: z.string(),
  userLevel: z.string(),
  targetLanguage: z.string(),
  nativeLanguage: z.string(),
});

export type CreateLessonDto = z.infer<typeof CreateLessonDto>;
