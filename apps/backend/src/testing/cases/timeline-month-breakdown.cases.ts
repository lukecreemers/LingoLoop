import { MonthToWeeksOutputSchema } from '../../shared/types/timeline.types';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface TLMonthInputs extends Record<string, string | number | string[]> {
  // User context
  learningGoal: string;
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  additionalContext: string;
  // Month context
  currentMonthIndex: number;
  currentMonthTitle: string;
  currentMonthDescription: string;
  totalMonths: number;
  allMonthsSummary: string; // JSON or formatted string of all months
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const TL_MONTH_PROMPT_TEMPLATE = `
### ROLE
You are part of a curriculum generation pipeline for language learning. Your task is to break down a MONTHLY learning goal into exactly 4 WEEKLY milestones.

### USER PROFILE
- Level: {{userLevel}}
- Target Language: {{targetLanguage}}
- Native Language: {{nativeLanguage}}
- Overall Learning Goal: {{learningGoal}}

### ADDITIONAL USER CONTEXT
{{additionalContext}}

### FULL CURRICULUM OVERVIEW
This is Month {{currentMonthIndex}} of {{totalMonths}} total months. Here's the complete learning journey:

{{allMonthsSummary}}

### THIS MONTH'S FOCUS
**Month {{currentMonthIndex}}: {{currentMonthTitle}}**
{{currentMonthDescription}}

### YOUR TASK
Break this month into exactly 4 weekly milestones. Each week should:
1. Build logically on the previous week
2. Be achievable in ~5-7 lessons
3. Have a clear, focused objective
4. Progress toward the monthly goal
5. Consider what comes before and after in the overall curriculum

### PROGRESSION STRATEGY
- **Week 1:** Introduction and foundations - set up the core concept
- **Week 2:** Expand and practice - add complexity, drill the basics
- **Week 3:** Deepen understanding - tackle exceptions, edge cases, nuances
- **Week 4:** Consolidate and apply - review, combine, real-world application

### OUTPUT FORMAT
Return exactly 4 weeks. Each week needs:
- **title**: Short title (max 25 chars) like "AR Verb Basics" or "Ser vs Estar"
- **description**: A clear description (2-3 sentences) of what will be covered this week and the learning objectives

### EXAMPLE OUTPUT
For a monthly goal of "Master present tense regular verb conjugations":
{
  "weeks": [
    {
      "title": "AR Verb Foundations",
      "description": "Introduce the -AR verb conjugation pattern with all 6 forms (yo, tú, él, nosotros, vosotros, ellos). Focus on high-frequency verbs like hablar, cantar, bailar, trabajar through pattern recognition and repetition."
    },
    {
      "title": "ER & IR Verbs",
      "description": "Expand to -ER verbs (comer, beber, leer) and -IR verbs (vivir, escribir). Compare and contrast all three conjugation patterns. Practice identifying and using the correct endings."
    },
    {
      "title": "Verbs in Context",
      "description": "Apply learned verbs in real contexts: daily routines, likes/dislikes, and descriptions. Build practical phrases and expressions that combine multiple verbs naturally."
    },
    {
      "title": "Consolidation & Review",
      "description": "Comprehensive review of all verb types with mixed exercises. Practice conversation scenarios and writing exercises. Ensure mastery before moving to next month."
    }
  ]
}
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TL_MONTH_TEST_CASES: TestCase<TLMonthInputs>[] = [
  {
    name: 'Beginner - Present Tense Month',
    description: 'Break down a month focused on present tense basics.',
    inputs: {
      learningGoal: 'Learn conversational Spanish for travel, able to order food, ask directions, and have basic conversations.',
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      additionalContext: '30 minutes daily study. Prefers practical examples over grammar drills.',
      currentMonthIndex: 2,
      currentMonthTitle: 'Present Tense Mastery',
      currentMonthDescription: 'Master present tense conjugations for regular -AR, -ER, and -IR verbs. By the end of this month, the user should be able to conjugate any regular verb in present tense and use them in simple sentences.',
      totalMonths: 5,
      allMonthsSummary: `Month 1: Foundation & Essentials - Basic greetings, numbers, survival phrases
Month 2: Present Tense Mastery - Regular verb conjugations (current month)
Month 3: Ser vs Estar - Master both "to be" verbs
Month 4: Past Tense Basics - Preterite for completed actions
Month 5: Practical Conversations - Real-world scenarios and review`,
    },
  },
  {
    name: 'Beginner - Ser vs Estar Month',
    description: 'A challenging beginner topic that needs careful progression.',
    inputs: {
      learningGoal: 'Learn conversational Spanish for travel, able to order food, ask directions, and have basic conversations.',
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      additionalContext: '30 minutes daily study. Prefers practical examples over grammar drills.',
      currentMonthIndex: 3,
      currentMonthTitle: 'Ser vs Estar',
      currentMonthDescription: 'Understand and correctly use "ser" and "estar" (both meaning "to be"). Cover all major use cases and help the user develop intuition for choosing the correct verb.',
      totalMonths: 5,
      allMonthsSummary: `Month 1: Foundation & Essentials - Basic greetings, numbers, survival phrases
Month 2: Present Tense Mastery - Regular verb conjugations
Month 3: Ser vs Estar - Master both "to be" verbs (current month)
Month 4: Past Tense Basics - Preterite for completed actions
Month 5: Practical Conversations - Real-world scenarios and review`,
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const TL_MONTH_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const TL_MONTH_TEST_CONFIG: PromptTestConfig<TLMonthInputs, unknown> = {
  featureName: 'Timeline Month Breakdown',
  promptTemplate: TL_MONTH_PROMPT_TEMPLATE,
  outputSchema: MonthToWeeksOutputSchema,
  testCases: TL_MONTH_TEST_CASES,
  models: TL_MONTH_MODELS,
};

