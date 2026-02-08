import { z } from 'zod';

// ============================================================================
// ONBOARDING AGENT TOOLS (All internal — auto-execute on backend)
// ============================================================================

/**
 * Tool 1: Update User Preferences
 * Creates User + LanguageCourse (or updates existing), sets level, preferences, marking prefs.
 */
export const UpdateUserPreferencesToolSchema = z.object({
  level: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .describe("The user's assessed proficiency level"),
  targetLanguage: z
    .string()
    .describe('The language the user wants to learn (e.g. "Spanish")'),
  nativeLanguage: z
    .string()
    .describe("The user's native language (e.g. \"English\")"),
  preferences: z
    .string()
    .describe(
      'Free-text summary of user interests, topics, learning style. E.g. "Likes football, travel-focused, prefers conversational content, motivated by upcoming trip to Madrid"',
    ),
  markingPreferences: z
    .string()
    .describe(
      'Free-text summary of marking/grading strictness. E.g. "Lenient on accents, strict on verb conjugation, ignore punctuation in writing exercises"',
    ),
  userName: z
    .string()
    .optional()
    .describe("The user's name if they provided it"),
});

export type UpdateUserPreferencesTool = z.infer<
  typeof UpdateUserPreferencesToolSchema
>;

/**
 * Tool 2: Create Grammar Roadmap
 * Generates the curriculum and persists it to the database.
 */
export const CreateGrammarRoadmapToolSchema = z.object({
  userGoal: z
    .string()
    .describe(
      'A detailed description of the user\'s learning goal, timeline, and context. E.g. "Complete beginner in Spanish, moving to Madrid in 6 months, wants to be conversationally fluent for daily life and work."',
    ),
  targetLanguage: z.string().describe('The language the user wants to learn'),
  nativeLanguage: z.string().describe("The user's native language"),
});

export type CreateGrammarRoadmapTool = z.infer<
  typeof CreateGrammarRoadmapToolSchema
>;

/**
 * Tool 3: Create Daily Loop
 * Sets up the daily loop modules and their configs.
 */
export const CreateDailyLoopToolSchema = z.object({
  modules: z
    .array(
      z.object({
        type: z
          .enum([
            'FLASHCARDS',
            'READING',
            'WRITING',
            'TRANSLATION',
            'CUSTOM_LESSON',
            'REVIEW',
          ])
          .describe('The type of daily loop module'),
        order: z.number().describe('The sequence order (0, 1, 2...)'),
        config: z
          .record(z.string(), z.unknown())
          .describe(
            'Module-specific config. FLASHCARDS: { newCards, reviewCards }. READING: { topics, length, types }. WRITING: { length, preferences }. TRANSLATION: { direction, difficulty }. CUSTOM_LESSON: {}. REVIEW: {}.',
          ),
      }),
    )
    .min(1)
    .describe('The daily loop modules in order'),
  targetLanguage: z.string().describe('The language the user wants to learn'),
  nativeLanguage: z.string().describe("The user's native language"),
});

export type CreateDailyLoopTool = z.infer<typeof CreateDailyLoopToolSchema>;

/**
 * Tool 4: Generate Roadmap Overview
 * Generates a high-level overview of topics & concepts the user will learn,
 * where they are now, and what they'll know by the end. No timeframes —
 * a future agent will break these into phases and individual lessons.
 */
export const GenerateRoadmapOverviewToolSchema = z.object({
  targetLanguage: z.string().describe('The language the user wants to learn'),
  nativeLanguage: z.string().describe("The user's native language"),
  currentLevel: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .describe("The user's current proficiency level"),
  userGoal: z
    .string()
    .describe(
      'A detailed description of the user\'s learning goal. E.g. "Complete beginner, wants conversational fluency for a move to Madrid"',
    ),
  additionalContext: z
    .string()
    .optional()
    .describe(
      'Any additional context from the conversation: topics of interest, specific skills to focus on, etc.',
    ),
});

export type GenerateRoadmapOverviewTool = z.infer<
  typeof GenerateRoadmapOverviewToolSchema
>;

/**
 * A single topic area in the roadmap overview.
 */
export interface RoadmapOverviewTopic {
  title: string;
  description: string;
  concepts: string[];
}

/**
 * The full roadmap overview returned by the tool.
 */
export interface RoadmapOverview {
  currentSnapshot: string;
  endGoalSnapshot: string;
  topicAreas: RoadmapOverviewTopic[];
  note?: string;
}

// ============================================================================
// TOOL NAMES
// ============================================================================

/** All onboarding tools are internal — auto-execute on backend */
export const ONBOARDING_TOOL_NAMES = [
  'update_user_preferences',
  'create_grammar_roadmap',
  'create_daily_loop',
  'generate_roadmap_overview',
] as const;

export type OnboardingToolName = (typeof ONBOARDING_TOOL_NAMES)[number];

// ============================================================================
// CHAT INPUT
// ============================================================================

export const OnboardingChatInputSchema = z.object({
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

  /** User ID — if returning user adding a new language */
  userId: z.string().optional().describe('Existing user ID if known'),
});

export type OnboardingChatInput = z.infer<typeof OnboardingChatInputSchema>;

