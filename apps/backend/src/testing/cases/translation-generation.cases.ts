import { TGOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface TGInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const TG_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
Generate a paragraph for a {{userLevel}} student to translate. You will provide both the source text and an ideal translation.

{{userProfile}}

### INSTRUCTIONS (contains all specifications)
{{instructions}}

### LEVEL DEFAULTS (use if not specified in instructions)
- **Beginner:** 1-2 short sentences, simple vocabulary, present tense
- **Intermediate:** 2-3 sentences, mixed tenses, moderate complexity
- **Advanced:** 3-4 sentences, complex structures, nuanced vocabulary

### CONSTRAINTS
1. **Level-Appropriate:** Vocabulary and grammar must match the user's level.
2. **Natural Flow:** The paragraph should read like native speech, not disconnected sentences.
3. **Coherent Theme:** All sentences should connect to form a unified paragraph.
4. **Useful Practice:** Focus on structures the student needs to practice.
5. **Personalize:** Use themes related to the learner's goals and interests where possible.

### OUTPUT FORMAT
Return JSON with:
- paragraph: The source text to translate
- translation: The ideal translation
- difficulty: "beginner" | "intermediate" | "advanced"
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TG_TEST_CASES: TestCase<TGInputs>[] = [
  {
    name: 'Beginner - Morning Routine EN→ES',
    description: 'Simple present tense sentences.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Generate 2 sentences about a morning routine for translation from English to Spanish. Use present tense, simple vocabulary (wake up, eat, go to work/school).',
    },
  },
  {
    name: 'Intermediate - Travel Memory ES→EN',
    description: 'Past tense narrative.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Generate 3 sentences in Spanish about a memorable vacation experience for translation to English. Use preterite and imperfect tenses. Include time expressions like "ayer", "mientras".',
    },
  },
  {
    name: 'Advanced - Opinion Piece EN→ES',
    description: 'Complex structures with subjunctive.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
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
