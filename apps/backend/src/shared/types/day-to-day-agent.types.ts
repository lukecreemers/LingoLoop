import { z } from 'zod';
import { UnitTypeSchema } from './custom-lesson-generation.types';

// ============================================================================
// DAY-TO-DAY AGENT TOOLS
// These are the tool schemas the agent can call. For now, they don't execute
// anything — the frontend just displays the tool call payload.
// ============================================================================

/**
 * Tool 1: Create Custom Lesson
 * When the user wants to learn something that needs a full lesson.
 */
export const CreateCustomLessonToolSchema = z.object({
  lessonTitle: z.string().describe('A short title for the lesson'),
  lessonDescription: z
    .string()
    .describe('Detailed description of what the lesson should cover'),
  userLevel: z.string().describe('User proficiency level'),
  targetLanguage: z.string().describe('The language the user is learning'),
  nativeLanguage: z.string().describe("The user's native language"),
});

export type CreateCustomLessonTool = z.infer<
  typeof CreateCustomLessonToolSchema
>;

/**
 * Tool 2: Custom Drill Segment
 * A single unit exercise (e.g. fill-in-blanks for verb conjugations).
 */
export const CustomDrillSegmentToolSchema = z.object({
  instruction: z
    .string()
    .describe(
      'Detailed instruction for the drill. What to practice, difficulty, specifics.',
    ),
  unitType: UnitTypeSchema.describe(
    'The type of exercise unit to generate (e.g. fill_in_blanks, word_order, write_in_blanks, etc.)',
  ),
});

export type CustomDrillSegmentTool = z.infer<
  typeof CustomDrillSegmentToolSchema
>;

/**
 * Tool 3: Custom Drill Series
 * A series of varied unit exercises.
 */
export const CustomDrillSeriesToolSchema = z.object({
  drills: z
    .array(
      z.object({
        instruction: z
          .string()
          .describe('Detailed instruction for this drill unit'),
        unitType: UnitTypeSchema.describe('The type of exercise unit'),
      }),
    )
    .min(2)
    .describe('An array of drill units to generate in sequence'),
});

export type CustomDrillSeriesTool = z.infer<typeof CustomDrillSeriesToolSchema>;

/**
 * Tool 4: Restructure Roadmap
 * Change the learning roadmap content (e.g. "3 months to survival Spanish").
 */
export const RestructureRoadmapToolSchema = z.object({
  instructions: z
    .string()
    .describe(
      'Detailed instructions for how to restructure the roadmap. What the user is unhappy with, what they want changed, goals, timeline preferences, etc.',
    ),
});

export type RestructureRoadmapTool = z.infer<
  typeof RestructureRoadmapToolSchema
>;

/**
 * Tool 5: Restructure Daily Loop
 * Change the daily activities (flash cards, reading, writing practice, etc.)
 * Future feature — placeholder tool.
 */
export const RestructureDailyLoopToolSchema = z.object({
  instructions: z
    .string()
    .describe(
      'Detailed instructions for how to restructure the daily loop. What activities to add/remove/change, frequency preferences, etc.',
    ),
});

export type RestructureDailyLoopTool = z.infer<
  typeof RestructureDailyLoopToolSchema
>;

/**
 * Tool 6: User Preferences
 * Ongoing learning preferences (marking strictness, AI tone, etc.)
 */
export const UserPreferencesToolSchema = z.object({
  instructions: z
    .string()
    .describe(
      'Detailed description of the preference change. What the user is unhappy with and what they want changed. E.g. marking strictness, AI tone, accent handling, punctuation sensitivity, etc.',
    ),
});

export type UserPreferencesTool = z.infer<typeof UserPreferencesToolSchema>;

/**
 * Internal Tool: Get User Roadmap
 * Auto-executes without user permission — provides roadmap context to the agent.
 */
export const GetUserRoadmapToolSchema = z.object({
  reason: z
    .string()
    .describe(
      'Brief reason why you need the roadmap (e.g. "user asked about their progress", "need context for roadmap restructure")',
    ),
});

export type GetUserRoadmapTool = z.infer<typeof GetUserRoadmapToolSchema>;

// ============================================================================
// AGENT TOOL NAMES
// ============================================================================

/** External tools — require user confirmation, displayed on frontend */
export const EXTERNAL_TOOL_NAMES = [
  'create_custom_lesson',
  'custom_drill_segment',
  'custom_drill_series',
  'restructure_roadmap',
  'restructure_daily_loop',
  'user_preferences',
] as const;

/** Internal tools — auto-execute, feed result back to LLM */
export const INTERNAL_TOOL_NAMES = ['get_user_roadmap'] as const;

export const DAY_TO_DAY_TOOL_NAMES = [
  ...EXTERNAL_TOOL_NAMES,
  ...INTERNAL_TOOL_NAMES,
] as const;

export type DayToDayToolName = (typeof DAY_TO_DAY_TOOL_NAMES)[number];

// ============================================================================
// CHAT INPUT/OUTPUT
// ============================================================================

export const DayToDayChatInputSchema = z.object({
  /** The user's current message */
  userMessage: z.string().describe("The user's message"),

  /** Chat history */
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .default([])
    .describe('Previous messages in the conversation'),

  /** User context — supplied by the frontend, NOT the AI */
  userLevel: z
    .string()
    .default('beginner')
    .describe('User proficiency level'),
  targetLanguage: z
    .string()
    .default('Spanish')
    .describe('The language being learned'),
  nativeLanguage: z
    .string()
    .default('English')
    .describe("The user's native language"),
});

export type DayToDayChatInput = z.infer<typeof DayToDayChatInputSchema>;

