import { z } from 'zod';
import { SectionedLessonSchema } from './sectioned-lesson.types';

export const RedoSectionDto = z.object({
  /** The full lesson (needed for context) */
  lesson: SectionedLessonSchema,
  /** The index of the section to regenerate */
  sectionIndex: z.number(),
});

export type RedoSectionDto = z.infer<typeof RedoSectionDto>;

