import type { PromptTestConfig, ModelConfig, TestCase } from '../prompt-tester';
import { WPOutputSchema } from '../../shared/types/writing-practice.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface WPInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const WP_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
Create writing practice prompts for a {{userLevel}} {{targetLanguage}} learner (native {{nativeLanguage}}).

{{userProfile}}

### INSTRUCTIONS (contains all specifications)
{{instructions}}

### LEVEL DEFAULTS (use if not specified in instructions)
- **Beginner:** 2 prompts, expect 2-3 sentence responses, simple questions (describe, list)
- **Intermediate:** 2-3 prompts, expect short paragraph responses, opinion/comparison questions
- **Advanced:** 3 prompts, expect longer responses, hypothetical/argumentative questions

### CONSTRAINTS
1. Write prompts in {{targetLanguage}} with translation in {{nativeLanguage}}
2. Include helpful hints (useful vocabulary or structures)
3. Match complexity to the user's level
4. Prompts should encourage creative but structured responses
5. **Personalize:** Create prompts related to the learner's interests and goals where possible

### OUTPUT FORMAT
Return JSON with:
- topic: Overall theme of the prompts
- prompts: Array of { prompt, promptTranslation, hints[], expectedLength }
  - expectedLength: "short" | "medium" | "long"
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const WP_TEST_CASES: TestCase<WPInputs>[] = [
  {
    name: 'Beginner - Daily Routine',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 2 writing prompts about daily routines. Expect 2-3 sentence responses. Include vocabulary hints for common verbs (despertarse, comer, trabajar).',
    },
  },
  {
    name: 'Intermediate - Technology Opinions',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 2 writing prompts asking for opinions about social media. Expect short paragraph responses. Include hints for expressing opinion (creo que, en mi opinión).',
    },
  },
  {
    name: 'Advanced - Hypotheticals',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 3 writing prompts using hypothetical situations (si pudiera, si hubiera). Expect longer paragraph responses. Focus on subjunctive structures.',
    },
  },
];

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const WP_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic',
    model: 'claude-haiku-4-5',
  },
];

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export const WP_TEST_CONFIG: PromptTestConfig<WPInputs, unknown> = {
  featureName: 'Writing Practice Generation',
  promptTemplate: WP_PROMPT_TEMPLATE,
  testCases: WP_TEST_CASES,
  models: WP_MODELS,
  outputSchema: WPOutputSchema,
};
