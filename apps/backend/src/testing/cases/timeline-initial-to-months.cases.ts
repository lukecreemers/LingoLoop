import { InitialToMonthsOutputSchema } from '../../shared/types/timeline.types';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface TLInitialInputs extends Record<
  string,
  string | number | string[]
> {
  learningGoal: string;
  targetLanguage: string;
  nativeLanguage: string;
  userLevel: string;
  totalMonths: number;
  additionalContext: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const TL_INITIAL_TO_MONTHS_PROMPT_TEMPLATE = `
### ROLE
You are the first stage of a curriculum generation pipeline for language learning. Your task is to take a user's learning goals and break them down into a logical month-by-month learning plan.

### USER PROFILE
- Level: {{userLevel}}
- Target Language: {{targetLanguage}} 
- Native Language: {{nativeLanguage}}
- Learning Duration: {{totalMonths}} months

### USER'S LEARNING GOAL
{{learningGoal}}

### ADDITIONAL CONTEXT
{{additionalContext}}

### YOUR TASK
Create a {{totalMonths}}-month curriculum that will help the user achieve their learning goal. Each month should:
1. Have a clear, focused theme or objective
2. Build logically on previous months
3. Be achievable within ~4 weeks of study
4. Progress the user toward their overall goal

### PROGRESSION PRINCIPLES
- Start with foundations before building complexity
- Introduce grammar concepts gradually
- Balance grammar, vocabulary, and practical usage
- Include review and consolidation periods
- Consider the user's level when pacing content

### OUTPUT FORMAT
Return exactly {{totalMonths}} months. Each month needs:
- **title**: Short title for the month (max 30 chars) like "Present Tense Foundations" or "Past Tense Mastery"
- **description**: A detailed paragraph (4-6 sentences) describing:
  - What the user will learn this month

### IMPORTANT
- These monthly themes will be broken up into 20 individual lessons. Keep this in mind when planning the content for each month.

`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TL_INITIAL_TEST_CASES: TestCase<TLInitialInputs>[] = [
  {
    name: 'Beginner Spanish - 3 Months',
    description: 'Standard beginner curriculum for survival Spanish.',
    inputs: {
      learningGoal:
        'I want to learn conversational Spanish so I can travel to Spain and have basic conversations with locals. I want to be able to order food, ask for directions, and have simple conversations about myself and my interests.',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      userLevel: 'beginner',
      totalMonths: 5,
      additionalContext:
        'I have about 30 minutes per day to study. I learn best through practical examples rather than pure grammar drills.',
    },
  },
  {
    name: 'Intermediate Spanish - 3 Months',
    description: 'Intermediate learner focusing on fluency improvement.',
    inputs: {
      learningGoal:
        'I already know basic Spanish but want to become more fluent. I struggle with past tenses and subjunctive mood. I want to be able to read Spanish news articles and have deeper conversations.',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      userLevel: 'intermediate',
      totalMonths: 3,
      additionalContext:
        'I can already hold basic conversations but often get stuck on complex grammar.',
    },
  },
  {
    name: 'Beginner Spanish - 6 Months',
    description: 'Beginner learning a non-Latin script language.',
    inputs: {
      learningGoal:
        'Learn Spanish from scratch for an upcoming trip to South America. I want to be able to read basic signs, navigate public transport, and have polite interactions.',
      targetLanguage: 'Japanese',
      nativeLanguage: 'English',
      userLevel: 'beginner',
      totalMonths: 6,
      additionalContext:
        'I have no experience with European languages. I am interested in Spanish culture and anime.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const TL_INITIAL_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const TL_INITIAL_TEST_CONFIG: PromptTestConfig<
  TLInitialInputs,
  unknown
> = {
  featureName: 'Timeline Initial to Months',
  promptTemplate: TL_INITIAL_TO_MONTHS_PROMPT_TEMPLATE,
  outputSchema: InitialToMonthsOutputSchema,
  testCases: TL_INITIAL_TEST_CASES,
  models: TL_INITIAL_MODELS,
};
