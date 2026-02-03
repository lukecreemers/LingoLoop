import { z } from 'zod';

// ============================================================================
// TIMELINE INPUT SCHEMA (NEW - User Goals Based)
// ============================================================================

export const TimelineUserInputSchema = z.object({
  learningGoal: z
    .string()
    .describe('The overall learning goal or what the user wants to achieve.'),
  targetLanguage: z.string().describe('The language the user is learning.'),
  nativeLanguage: z.string().describe("The user's native language."),
  userLevel: z
    .string()
    .describe(
      'The proficiency level of the user (beginner, intermediate, advanced).',
    ),
  totalMonths: z
    .number()
    .int()
    .min(1)
    .max(12)
    .describe('Total duration in months for the learning plan.'),
  lessonsPerWeek: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Target number of lessons to generate per week.'),
  additionalContext: z
    .string()
    .optional()
    .describe(
      'Any additional context about the user or their learning preferences.',
    ),
});

export type TimelineUserInput = z.infer<typeof TimelineUserInputSchema>;

// ============================================================================
// LEGACY TIMELINE INPUT SCHEMA (kept for backwards compatibility)
// ============================================================================

export const TimelineInputSchema = z.object({
  phases: z
    .array(z.string())
    .min(1)
    .describe(
      'Array of phase instructions describing what the user will learn in each phase.',
    ),
  phaseType: z
    .enum(['week', 'month'])
    .describe('Whether each phase represents a week or a month of learning.'),
  lessonsPerWeek: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Target number of lessons to generate per week.'),
  targetLanguage: z.string().describe('The language the user is learning.'),
  nativeLanguage: z.string().describe("The user's native language."),
  userLevel: z
    .string()
    .describe(
      'The proficiency level of the user (beginner, intermediate, advanced).',
    ),
});

export type TimelineInput = z.infer<typeof TimelineInputSchema>;

// ============================================================================
// STAGE 0: INITIAL → MONTHS OUTPUT SCHEMA
// ============================================================================

export const MonthBreakdownItemSchema = z.object({
  title: z
    .string()
    .describe(
      'Short title for the month (e.g., "Present Tense Foundations", "Ser vs Estar"). Max 30 chars.',
    ),
  description: z
    .string()
    .describe(
      'A paragraph describing what will be covered this month and the learning objectives.',
    ),
});

export type MonthBreakdownItem = z.infer<typeof MonthBreakdownItemSchema>;

export const InitialToMonthsOutputSchema = z.object({
  months: z
    .array(MonthBreakdownItemSchema)
    .describe(
      'Array of months, each with a title and description of what will be covered.',
    ),
});

export type InitialToMonthsOutput = z.infer<typeof InitialToMonthsOutputSchema>;

// ============================================================================
// STAGE 1: MONTH → WEEKS OUTPUT SCHEMA
// ============================================================================

export const WeekBreakdownItemSchema = z.object({
  title: z
    .string()
    .describe(
      'Short title for the week (e.g., "AR Verb Basics", "Ser Introduction"). Max 25 chars.',
    ),
  description: z
    .string()
    .describe(
      'A description of what will be covered this week and the learning objectives.',
    ),
});

export type WeekBreakdownItem = z.infer<typeof WeekBreakdownItemSchema>;

export const MonthToWeeksOutputSchema = z.object({
  weeks: z
    .array(WeekBreakdownItemSchema)
    .length(4)
    .describe(
      'Exactly 4 weeks breaking down the monthly goal into weekly milestones.',
    ),
});

export type MonthToWeeksOutput = z.infer<typeof MonthToWeeksOutputSchema>;

// ============================================================================
// STAGE 2: WEEK → LESSONS OUTPUT SCHEMA
// ============================================================================

export const LessonBreakdownItemSchema = z.object({
  title: z
    .string()
    .describe(
      'Short title for the lesson (e.g., "Conjugation Basics", "Daily Routines"). Max 25 chars.',
    ),
  description: z
    .string()
    .describe('A description of what will be covered in this lesson.'),
});

export type LessonBreakdownItem = z.infer<typeof LessonBreakdownItemSchema>;

export const WeekToLessonsOutputSchema = z.object({
  lessons: z
    .array(LessonBreakdownItemSchema)
    .describe(
      'Array of lessons for this week. Each lesson should be a complete learning session.',
    ),
});

export type WeekToLessonsOutput = z.infer<typeof WeekToLessonsOutputSchema>;

// ============================================================================
// FINAL OUTPUT STRUCTURES (NEW - Hierarchical)
// ============================================================================

export const LessonNodeSchema = z.object({
  lessonIndex: z
    .number()
    .describe('Index of this lesson within the week (0-based).'),
  globalLessonIndex: z
    .number()
    .describe('Global index across the entire timeline (0-based).'),
  title: z.string().describe('Short title for UI.'),
  description: z.string().describe('Description of what this lesson covers.'),
});

export type LessonNode = z.infer<typeof LessonNodeSchema>;

export const WeekNodeSchema = z.object({
  weekIndex: z
    .number()
    .describe('Index of this week within the month (0-based).'),
  globalWeekIndex: z
    .number()
    .describe('Global week index across the entire timeline (0-based).'),
  title: z.string().describe('Short title for UI.'),
  description: z.string().describe('Description of what this week covers.'),
  lessons: z.array(LessonNodeSchema).describe('The lessons for this week.'),
});

export type WeekNode = z.infer<typeof WeekNodeSchema>;

export const MonthNodeSchema = z.object({
  monthIndex: z.number().describe('Index of this month (0-based).'),
  title: z.string().describe('Short title for UI.'),
  description: z.string().describe('Description of what this month covers.'),
  weeks: z.array(WeekNodeSchema).describe('The 4 weeks for this month.'),
});

export type MonthNode = z.infer<typeof MonthNodeSchema>;

export const TimelineFullOutputSchema = z.object({
  input: TimelineUserInputSchema.describe(
    'The original user input used to generate this timeline.',
  ),
  totalMonths: z.number().describe('Total number of months in the timeline.'),
  totalWeeks: z.number().describe('Total number of weeks in the timeline.'),
  totalLessons: z.number().describe('Total number of lessons in the timeline.'),
  months: z
    .array(MonthNodeSchema)
    .describe('All months with their weeks and lessons.'),
});

export type TimelineFullOutput = z.infer<typeof TimelineFullOutputSchema>;

// ============================================================================
// LEGACY FINAL OUTPUT STRUCTURES (kept for backwards compatibility)
// ============================================================================

export const LegacyLessonNodeSchema = z.object({
  lessonIndex: z
    .number()
    .describe('Index of this lesson within the week (0-based).'),
  globalLessonIndex: z
    .number()
    .describe('Global index across the entire timeline (0-based).'),
  displayName: z.string().describe('Short display name for UI.'),
  instruction: z
    .string()
    .describe('The lesson instruction to pass to lesson generation.'),
});

export type LegacyLessonNode = z.infer<typeof LegacyLessonNodeSchema>;

export const LegacyWeekNodeSchema = z.object({
  weekIndex: z
    .number()
    .describe('Global week index across the entire timeline (0-based).'),
  monthIndex: z
    .number()
    .optional()
    .describe(
      'Which month this week belongs to (0-based). Only present if input was month phases.',
    ),
  displayName: z.string().describe('Short display name for UI.'),
  originalPhase: z
    .string()
    .describe('The original phase instruction this week was derived from.'),
  weekInstruction: z.string().describe('The broken-down week instruction.'),
  lessons: z
    .array(LegacyLessonNodeSchema)
    .describe('The lessons for this week.'),
});

export type LegacyWeekNode = z.infer<typeof LegacyWeekNodeSchema>;

export const TimelineOutputSchema = z.object({
  input: TimelineInputSchema.describe(
    'The original input used to generate this timeline.',
  ),
  totalWeeks: z.number().describe('Total number of weeks in the timeline.'),
  totalLessons: z.number().describe('Total number of lessons in the timeline.'),
  weeks: z
    .array(LegacyWeekNodeSchema)
    .describe('All weeks with their lessons.'),
});

export type TimelineOutput = z.infer<typeof TimelineOutputSchema>;
