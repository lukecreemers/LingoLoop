import { z } from 'zod';

// ============================================================================
// CURRICULUM TYPES (Parsed from XML)
// ============================================================================

export const CurriculumLessonSchema = z.object({
  name: z.string().describe('Name/title of the lesson'),
  description: z.string().describe('Bullet points describing what the lesson covers'),
  lessonIndex: z.number().describe('Index within the week (0-4)'),
  globalLessonIndex: z.number().describe('Global index across entire curriculum'),
});

export type CurriculumLesson = z.infer<typeof CurriculumLessonSchema>;

export const CurriculumWeekSchema = z.object({
  name: z.string().describe('Theme/title of the week'),
  description: z.string().describe('2-3 sentence description of what this week covers'),
  weekIndex: z.number().describe('Index within the month (0-3)'),
  globalWeekIndex: z.number().describe('Global index across entire curriculum'),
  lessons: z.array(CurriculumLessonSchema).describe('The 5 lessons for this week'),
});

export type CurriculumWeek = z.infer<typeof CurriculumWeekSchema>;

export const CurriculumMonthSchema = z.object({
  name: z.string().describe('Theme/title of the month'),
  description: z.string().describe('2-3 sentence description of what this month covers'),
  monthIndex: z.number().describe('Index of this month (0-based)'),
  weeks: z.array(CurriculumWeekSchema).describe('The 4 weeks for this month'),
});

export type CurriculumMonth = z.infer<typeof CurriculumMonthSchema>;

export const CurriculumSchema = z.object({
  userGoal: z.string().describe('The original user goal'),
  totalMonths: z.number().describe('Total number of months'),
  totalWeeks: z.number().describe('Total number of weeks'),
  totalLessons: z.number().describe('Total number of lessons'),
  months: z.array(CurriculumMonthSchema).describe('All months in the curriculum'),
});

export type Curriculum = z.infer<typeof CurriculumSchema>;

