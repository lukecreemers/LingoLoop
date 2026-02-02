import type { PromptTestConfig, ModelConfig, TestCase } from '../prompt-tester';
import { WOOutputSchema } from '../../shared/types/word-order.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface WOInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const WO_PROMPT_TEMPLATE = `
### TASK
Create word order exercises for a {{userLevel}} {{targetLanguage}} learner (native {{nativeLanguage}}).
The student will see scrambled words and must arrange them in the correct order.

### INSTRUCTIONS (contains all specifications)
{{instructions}}

### LEVEL DEFAULTS (use if not specified in instructions)
- **Beginner:** 4-5 sentences, 4-6 words each, simple SVO structures
- **Intermediate:** 5-6 sentences, 6-9 words each, some subordinate clauses
- **Advanced:** 6-8 sentences, 8-12 words each, complex structures allowed

### CONSTRAINTS
1. Each sentence must be grammatically correct
2. Include the translation in {{nativeLanguage}}
3. Sentences should be varied (not repetitive patterns)
4. Match complexity to the user's level

### OUTPUT FORMAT
Return JSON with:
- sentences: Array of { sentence, translation }
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const WO_TEST_CASES: TestCase<WOInputs>[] = [
  {
    name: 'Beginner - Daily Activities',
    description: 'Simple sentences about daily routines',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 5 word-order sentences about daily activities (wake up, eat, go to school/work). 4-6 words per sentence. Simple present tense.',
    },
  },
  {
    name: 'Intermediate - Questions',
    description: 'Question formation practice',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 5 word-order sentences practicing question formation with interrogatives (qué, dónde, cuándo, por qué). 6-8 words per sentence.',
    },
  },
  {
    name: 'Advanced - Subjunctive Clauses',
    description: 'Complex sentences with subjunctive',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 6 word-order sentences with subjunctive clauses (quiero que, es importante que, dudo que). 8-12 words per sentence with dependent clauses.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const WO_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.7,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const WO_TEST_CONFIG: PromptTestConfig<WOInputs, unknown> = {
  featureName: 'Word Order Generation',
  promptTemplate: WO_PROMPT_TEMPLATE,
  outputSchema: WOOutputSchema,
  testCases: WO_TEST_CASES,
  models: WO_MODELS,
};
