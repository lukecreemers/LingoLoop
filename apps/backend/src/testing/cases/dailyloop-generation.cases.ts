import { z } from 'zod';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface DailyLoopInputs extends Record<
  string,
  string | number | string[]
> {
  instructions: string;
}

// ============================================================================
// OUTPUT SCHEMA — Day-based cycle
// ============================================================================

/**
 * Module configs — each module type has its own config shape.
 * No frequencyPerWeek — frequency is implicit from which days the module appears on.
 */
const FlashcardsConfigSchema = z.object({
  type: z.literal('FLASHCARDS'),
  order: z.number().describe("Position in this day's flow (0, 1, 2...)"),
  estimatedMinutes: z.number().describe('Total estimated minutes for this day'),
  newWords: z.number().describe('Number of new flashcard words this session'),
});

const CustomLessonConfigSchema = z.object({
  type: z.literal('CUSTOM_LESSON'),
  order: z.number().describe("Position in this day's flow"),
  estimatedMinutes: z.number().describe('Total estimated minutes for this day'),
});

const ReadingConfigSchema = z.object({
  type: z.literal('READING'),
  order: z.number().describe("Position in this day's flow"),
  estimatedMinutes: z.number().describe('Total estimated minutes for this day'),
  contentTypes: z
    .array(z.enum(['story', 'conversation', 'newsletter', 'article']))
    .describe('Types of reading content'),
  activities: z
    .array(z.enum(['mcq', 'translate_phrases']))
    .describe('Post-reading activities'),
});

const TranslationConfigSchema = z.object({
  type: z.literal('TRANSLATION'),
  order: z.number().describe("Position in this day's flow"),
  estimatedMinutes: z.number().describe('Total estimated minutes for this day'),
  direction: z
    .enum(['native_to_target', 'target_to_native', 'mixed'])
    .describe('Translation direction for this session'),
  sentenceCount: z.number().describe('Number of sentences to translate'),
});

const WritingConfigSchema = z.object({
  type: z.literal('WRITING'),
  order: z.number().describe("Position in this day's flow"),
  estimatedMinutes: z.number().describe('Total estimated minutes for this day'),
  promptCount: z.number().describe('Number of writing prompts'),
  length: z
    .enum(['short', 'medium', 'long'])
    .describe('Expected response length'),
});

const DayModuleSchema = z.discriminatedUnion('type', [
  FlashcardsConfigSchema,
  CustomLessonConfigSchema,
  ReadingConfigSchema,
  TranslationConfigSchema,
  WritingConfigSchema,
]);

/**
 * A single day in the repeating cycle.
 * "day" is 1-based — Day 1 is the user's first login of the cycle,
 * Day 2 is their second, etc. These are NOT calendar days.
 */
const DayScheduleSchema = z.object({
  day: z.number().describe('Day number in the cycle (1-based)'),
  estimatedMinutes: z.number().describe('Total estimated minutes for this day'),
  modules: z
    .array(DayModuleSchema)
    .min(1)
    .describe('Ordered modules for this day'),
});

export const DailyLoopOutputSchema = z.object({
  days: z
    .array(DayScheduleSchema)
    .min(1)
    .describe('The full cycle of days, each with their own module lineup'),
  reasoning: z
    .string()
    .describe('Brief explanation of why the cycle was structured this way'),
});

export type DailyLoopOutput = z.infer<typeof DailyLoopOutputSchema>;

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const DAILYLOOP_PROMPT_TEMPLATE = `
### ROLE
You are a language learning schedule architect. Given a summary of a learner's daily loop preferences (from their onboarding conversation), generate a structured daily loop configuration.

### HOW DAYS WORK
"Days" are **login days**, not calendar days. Day 1 is the first time the user opens the app that cycle, Day 2 is the second, etc. The schedule repeats as a cycle (e.g. a 7-day cycle means every 7 logins the pattern restarts).

Different days in the cycle can have **different module compositions**. For example:
- Days 1-4: Flashcards → Grammar Lesson (lesson days)
- Days 5-7: Flashcards → Reading → Translation or Writing (practice days)

### AVAILABLE MODULES
- **FLASHCARDS** — Spaced repetition vocabulary. Each card takes ~10 seconds. Cards are doubled (EN→ES and ES→EN). For every 1 new card, expect ~7 review cards. So 6 new words = 6 new + ~42 review = ~48 cards × 10s ≈ 8 minutes.
- **CUSTOM_LESSON** — A structured grammar/concept lesson from their roadmap. Typically 15-20 minutes.
- **READING** — A passage (story, conversation, article, newsletter) with optional post-reading activities (MCQs, translate phrases). Short ~5min, medium ~10min, long ~15min.
- **TRANSLATION** — Translate sentences between native and target language. ~5-10 minutes depending on count.
- **WRITING** — Open-ended writing prompts with AI feedback. Short ~5min, medium ~10min, long ~15min.

### STANDARD MODULE ORDER (when multiple appear on the same day)
Flashcards → Custom Lesson → Reading → Translation → Writing
(Adjust if the user specified a different preference.)

### INSTRUCTIONS FROM ONBOARDING
{{instructions}}

### YOUR TASK
Generate a daily loop cycle as JSON:

1. **cycleLengthDays** — How many study days before the cycle repeats.
2. **days** — An array defining each day in the cycle. Each day has:
   - **day** — Day number (1-based)
   - **label** — Human-readable label (e.g. "Lesson Day", "Practice Day", "Light Day")
   - **estimatedMinutes** — Total time estimate for that day
   - **modules** — Ordered array of modules, each with their type, order, estimatedMinutes, and type-specific config
3. **vocabProjection** — Based on flashcard newWords × flashcard days per cycle, project total words learned over the timeframe.
4. **reasoning** — Brief explanation of the design choices.

### CONSTRAINTS
- Every module MUST have concrete config values — no placeholders.
- Each day's total estimatedMinutes should roughly match the user's stated time budget.
- If modules need to alternate (e.g. "Translation one day, Writing the next"), assign them to specific days — don't say "alternating".
- If the user doesn't want a module, don't include it on any day.
- If the user has no grammar roadmap, do NOT include CUSTOM_LESSON.
- Module order within a day should follow the standard order unless the user specified otherwise.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const DAILYLOOP_TEST_CASES: TestCase<DailyLoopInputs>[] = [
  // --------------------------------------------------------------------------
  // Case 1: The example from the user — mixed lesson/practice days
  // --------------------------------------------------------------------------
  {
    name: 'Beginner — 25 min, lesson + practice day split',
    description:
      'Mixed schedule with lesson days and non-lesson days that alternate translation/writing.',
    inputs: {
      instructions: `Daily loop for 25 minutes total: Flashcards (8 min, 6 new words daily, daily frequency) → Grammar Lesson (15-20 min, 4x per week) on lesson days. On non-lesson days (3x per week): Flashcards → Reading (10 min, short stories and news, with MCQs) → Translation OR Writing (7-10 min, alternating days - English-to-Spanish translation one day, free writing prompts the next). Content mix should align with beginner to intermediate progression and practical conversational topics. User prefers lenient marking and learning for enjoyment.`,
    },
  },

  // --------------------------------------------------------------------------
  // Case 2: All modules every day — heavy learner
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate — 60 min/day, everything daily',
    description:
      'B1→B2 learner doing all modules every day. Tests uniform day structure.',
    inputs: {
      instructions: `Daily loop for a B1 Spanish learner targeting B2 in 3 months. 60 minutes per day, 7 days a week. Every day: Flashcards (15 new words, ~15 min) → Custom Lesson (~20 min) → Reading (medium articles/newsletters, MCQs + translate phrases, ~10 min) → Translation (mixed direction, 6 sentences, ~8 min) → Writing (medium, 1 prompt, ~7 min). Interested in news, culture, and professional topics. Has a grammar roadmap.`,
    },
  },

  // --------------------------------------------------------------------------
  // Case 3: Casual learner, 3 days, no roadmap
  // --------------------------------------------------------------------------
  {
    name: 'Beginner — 15 min, 3 days/week, no roadmap',
    description:
      'Casual beginner, no grammar roadmap. Short cycle with just flashcards + reading.',
    inputs: {
      instructions: `Daily loop for a casual Spanish beginner. 15 minutes, 3 days a week. No grammar roadmap. Just flashcards (5 new words per day) and reading (short stories, with MCQs). No writing or translation — wants to keep it simple. Goal is to slowly build vocabulary over 2 months.`,
    },
  },

  // --------------------------------------------------------------------------
  // Case 4: Advanced maintenance — production-heavy practice days
  // --------------------------------------------------------------------------
  {
    name: 'Advanced — 30 min, 5 days, heavy production focus',
    description:
      'B2→C1 learner with lesson days and production-heavy practice days.',
    inputs: {
      instructions: `Daily loop for a B2 Spanish learner pushing to C1 over 4 months. 30 minutes per day, 5 days a week. Day structure: 3 lesson days (Flashcards 5 new words → Custom Lesson), 2 practice days (Flashcards → Reading long articles with translate-phrases only, no MCQs → Writing medium 1 prompt). Translation not wanted — user prefers writing for production practice. Interested in news and opinion pieces. Has a grammar roadmap.`,
    },
  },

  // --------------------------------------------------------------------------
  // Case 5: Minimal input — tests inference and defaults
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate — vague "30 min, everything, 5 days"',
    description:
      'Barely any specifics. Tests if the model creates a sensible cycle with defaults.',
    inputs: {
      instructions: `Daily loop for an intermediate Spanish learner. About 30 minutes a day, 5 days a week. Wants flashcards, lessons, reading, translation, and writing. Standard flow. Has a grammar roadmap. No other details.`,
    },
  },

  // --------------------------------------------------------------------------
  // Case 6: Odd split — 4 days, 2 lesson / 2 practice, short time
  // --------------------------------------------------------------------------
  {
    name: 'Beginner — 20 min, 4 days, 2 lesson / 2 practice',
    description: 'Tight time, small cycle with explicit lesson/practice split.',
    inputs: {
      instructions: `Daily loop for a beginner Spanish learner (A1). 20 minutes, 4 days a week over 3 months. 2 lesson days: Flashcards (8 new words, ~8 min) → Custom Lesson (~12 min). 2 practice days: Flashcards (8 new words, ~8 min) → Reading short conversations with MCQs (~7 min) → Translation native-to-target 4 sentences (~5 min). No writing for now. Has a grammar roadmap.`,
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const DAILYLOOP_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.5,
  },
  {
    provider: 'anthropic' as const,
    model: 'claude-sonnet-4-5',
    temperature: 0.5,
  },
  {
    provider: 'anthropic' as const,
    model: 'claude-opus-4-6',
    temperature: 0.5,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const DAILYLOOP_TEST_CONFIG: PromptTestConfig<
  DailyLoopInputs,
  DailyLoopOutput
> = {
  featureName: 'Daily Loop Generation',
  promptTemplate: DAILYLOOP_PROMPT_TEMPLATE,
  outputSchema: DailyLoopOutputSchema,
  testCases: DAILYLOOP_TEST_CASES,
  models: DAILYLOOP_MODELS,
};
