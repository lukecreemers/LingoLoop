import { WeekToLessonsOutputSchema } from '../../shared/types/timeline.types';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface TLWeekInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  weekInstruction: string;
  weekIndex: number;
  lessonsPerWeek: number;
  targetLanguage: string;
  nativeLanguage: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const TL_WEEK_PROMPT_TEMPLATE = `
### ROLE
You are part of a curriculum generation pipeline for language learning. Your task is to break down a WEEKLY learning goal into exactly {{lessonsPerWeek}} individual LESSONS.

### CONTEXT
You are generating lessons for Week {{weekIndex}} of a language learning curriculum.
Each lesson output will be passed to a lesson generation system that creates full interactive lessons with explanations, exercises, conversations, and practice activities.

### USER PROFILE
- Level: {{userLevel}}
- Target: {{targetLanguage}} / Native: {{nativeLanguage}}

### WEEKLY GOAL
{{weekInstruction}}

### YOUR TASK
Break this weekly goal into exactly {{lessonsPerWeek}} lessons. Each lesson should:
1. Be completable in 15-30 minutes
2. Have a single, clear focus
3. Build on previous lessons in the week
4. Balance explanation with practice

### LESSON STRUCTURE GUIDANCE
A good week might follow this pattern:
- **Lesson 1:** Introduce the core concept with explanation
- **Lessons 2-3:** Drill and practice with exercises
- **Lesson 4:** Apply in context (conversation, reading, real scenarios)
- **Lesson 5:** Review and consolidate (if 5 lessons)

### OUTPUT FORMAT
Return exactly {{lessonsPerWeek}} lessons. Each lesson needs:
- **displayName**: Short UI label (max 20 chars) like "Conjugation Intro" or "Daily Routines"
- **instruction**: Detailed instruction for the lesson generator

Be concise - the lesson generator knows the language. Focus on WHAT, not HOW.

### EXAMPLE OUTPUT
For a weekly goal of "Introduce -AR verb conjugation pattern" with 5 lessons:
{
  "lessons": [
    {
      "displayName": "Conjugation Basics",
      "instruction": "Explain -AR verb conjugation: the 6 endings (-o, -as, -a, -amos, -áis, -an). Use 'hablar' as the model verb. Include conjugation table."
    },
    {
      "displayName": "Common AR Verbs",
      "instruction": "Vocabulary building: Introduce 10 common -AR verbs (trabajar, estudiar, cantar, bailar, comprar, llevar, llamar, escuchar, mirar, cocinar). Flashcard style with examples."
    },
    {
      "displayName": "Practice Drills",
      "instruction": "Fill-in-the-blank practice: Sentences using the 10 -AR verbs. Focus on matching subject to correct conjugation."
    },
    {
      "displayName": "Reading Practice",
      "instruction": "Reading comprehension: A short paragraph about someone's daily routine using -AR verbs. Identify and translate the verbs."
    },
    {
      "displayName": "Your Daily Routine",
      "instruction": "Speaking/Writing practice: Describe your own daily routine using at least 5 -AR verbs. Focus on first person (yo) and third person (él/ella)."
    }
  ]
}
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TL_WEEK_TEST_CASES: TestCase<TLWeekInputs>[] = [
  {
    name: 'Beginner - AR Verbs Introduction (5 lessons)',
    description: 'First week introducing -AR verb conjugation.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      weekInstruction: 'Week 1 of Present Tense: Introduce -AR verb conjugation pattern. Focus on the 6 forms (yo, tú, él, nosotros, vosotros, ellos). Use high-frequency verbs: hablar, cantar, bailar, trabajar.',
      weekIndex: 1,
      lessonsPerWeek: 5,
    },
  },
  {
    name: 'Beginner - Ser Basics (5 lessons)',
    description: 'Introduction to the verb ser.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      weekInstruction: 'Week 1 of Ser vs Estar: Introduce "ser" - conjugation and core uses (identity, origin, profession, characteristics, time). Build strong foundation before introducing estar.',
      weekIndex: 5,
      lessonsPerWeek: 5,
    },
  },
  {
    name: 'Intermediate - Preterite vs Imperfect (7 lessons)',
    description: 'Complex grammar with more lessons for depth.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      weekInstruction: 'Week 3 of Past Tenses: Focus on using preterite and imperfect together in narratives. Teach the "background vs action" model. Practice with storytelling.',
      weekIndex: 7,
      lessonsPerWeek: 7,
    },
  },
  {
    name: 'Advanced - Subjunctive Triggers (5 lessons)',
    description: 'Advanced grammar requiring precise explanations.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      weekInstruction: 'Week 2 of Subjunctive: Deep dive into WEIRDO triggers - focus on Wishes and Emotions this week. Cover common phrases and their patterns.',
      weekIndex: 6,
      lessonsPerWeek: 5,
    },
  },
  {
    name: 'Beginner - Short Week (3 lessons)',
    description: 'Testing with fewer lessons per week.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      weekInstruction: 'Week 4 of Present Tense: Consolidation week. Mixed verb practice across all types. Review and reinforce.',
      weekIndex: 4,
      lessonsPerWeek: 3,
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const TL_WEEK_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const TL_WEEK_TEST_CONFIG: PromptTestConfig<TLWeekInputs, unknown> = {
  featureName: 'Timeline Week Breakdown',
  promptTemplate: TL_WEEK_PROMPT_TEMPLATE,
  outputSchema: WeekToLessonsOutputSchema,
  testCases: TL_WEEK_TEST_CASES,
  models: TL_WEEK_MODELS,
};

