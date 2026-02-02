import { FIBOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface FIBInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const FIB_PROMPT_TEMPLATE = `
### TASK
Create "Fill in the Blank" exercises for a {{userLevel}} {{targetLanguage}} student.

### INSTRUCTIONS (contains all exercise specifications)
{{instructions}}

### LEVEL DEFAULTS (use if not specified in instructions)
- **Beginner:** 3 sentences, 1 blank per sentence, 3 distractors
- **Intermediate:** 4 sentences, 1-2 blanks per sentence, 3-4 distractors
- **Advanced:** 5 sentences, 2 blanks per sentence, 4 distractors

### CONSTRAINTS (CRITICAL)
1. **Zero Ambiguity:** Each blank must have ONLY ONE correct answer. Distractors must be contextually and semantically **incorrect**. If a distractor could work in the sentence, it fails.
2. **Real Words Only:** All distractors must be valid, real {{targetLanguage}} words. Never invent forms.
3. **No Duplicate Answers:** Do not include correct answers in the distractors array.
4. **Natural Syntax:** Sentences must sound native and natural, not robotic.
5. **Unique Slots:** In multi-blank sentences, each answer fits only its designated slot. Answers should not be interchangeable.
6. **Distractor Strategy:** Distractors should be "near misses" - same category but wrong for the specific context (e.g., wrong conjugation, wrong gender, similar but incorrect verb).

### OUTPUT FORMAT
Return JSON with "exercises" array. Each exercise has:
- template: Sentence with [*] markers for blanks
- answers: Array of correct answers (matching [*] order)
- distractors: Array of wrong but plausible options
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const FIB_TEST_CASES: TestCase<FIBInputs>[] = [
  {
    name: 'Beginner - Ser vs Estar',
    description: 'Basic ser/estar distinction with simple sentences.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      instructions:
        'Create 3 fill-in-the-blank sentences testing ser vs estar. 1 blank per sentence. Distractors should be the wrong verb choice (if answer is "es", include "está" as distractor).',
    },
  },
  {
    name: 'Intermediate - Preterite vs Imperfect',
    description: 'Past tense contrast in narrative context.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      instructions:
        'Create 4 fill-in-the-blank sentences testing preterite vs imperfect. 1 blank per sentence. Include context clues (time expressions, ongoing vs completed actions). Distractors: wrong tense of the same verb.',
    },
  },
  {
    name: 'Advanced - Subjunctive Triggers',
    description: 'Subjunctive mood after specific triggers.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      instructions:
        'Create 5 fill-in-the-blank sentences testing subjunctive after doubt/emotion triggers (dudo que, es posible que, ojalá). 2 blanks per sentence. Distractors: indicative forms of the same verb.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const FIB_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.7,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const FIB_TEST_CONFIG: PromptTestConfig<FIBInputs, unknown> = {
  featureName: 'Fill in the Blanks',
  promptTemplate: FIB_PROMPT_TEMPLATE,
  outputSchema: FIBOutputSchema,
  testCases: FIB_TEST_CASES,
  models: FIB_MODELS,
};
