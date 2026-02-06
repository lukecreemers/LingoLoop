import { TGOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface TGInputs extends Record<string, string | number | string[]> {
  lessonPlanContext: string;
  userProfile: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const TG_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
Given that context, your job is to create "Translation" exercises for the following student:
{{userProfile}}

### INSTRUCTIONS (contains all specifications)
{{instructions}}

The paragraph for each exercise could be a short phrase, sentence or entire paragraph. This will depened on the instructions and context.
Complexity should be appropriate for the user's level. For more advanced users, its okay to include more complex sentences and paragraphs with more of a focus on natural sounding language.

### OUTPUT FORMAT
Return JSON with:
- exercises: Array of { paragraph, translation }
  `.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TG_TEST_CASES: TestCase<TGInputs>[] = [
  {
    name: 'Beginner - Morning Routine EN→ES',
    description: 'Simple present tense sentences.',
    inputs: {
      lessonPlanContext: 'This is a lesson about daily routines and present tense verbs.',
      userProfile: 'Level: beginner\nTarget Language: Spanish\nNative Language: English',
      instructions:
        'Generate 2 sentences about a morning routine for translation from English to Spanish. Use present tense, simple vocabulary (wake up, eat, go to work/school).',
    },
  },
  {
    name: 'Intermediate - Travel Memory ES→EN',
    description: 'Past tense narrative.',
    inputs: {
      lessonPlanContext: 'This is a lesson about past tense and storytelling using preterite and imperfect.',
      userProfile: 'Level: intermediate\nTarget Language: Spanish\nNative Language: English',
      instructions:
        'Generate 3 sentences in Spanish about a memorable vacation experience for translation to English. Use preterite and imperfect tenses. Include time expressions like "ayer", "mientras".',
    },
  },
  {
    name: 'Advanced - Opinion Piece EN→ES',
    description: 'Complex structures with subjunctive.',
    inputs: {
      lessonPlanContext: 'This is a lesson on advanced grammar including subjunctive mood and conditional structures.',
      userProfile: 'Level: advanced\nTarget Language: Spanish\nNative Language: English',
      instructions:
        'Generate 4 sentences in English about the impact of technology on education for translation to Spanish. Include structures requiring subjunctive (doubt, opinion) and conditional sentences.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const TG_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.7,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const TG_TEST_CONFIG: PromptTestConfig<TGInputs, unknown> = {
  featureName: 'Translation Generation',
  promptTemplate: TG_PROMPT_TEMPLATE,
  outputSchema: TGOutputSchema,
  testCases: TG_TEST_CASES,
  models: TG_MODELS,
};
