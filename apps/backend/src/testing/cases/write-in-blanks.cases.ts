import { WIBOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface WIBInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const WIB_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
Given that context, your job is to create "Write in the Blank" exercises for the following student:

{{userProfile}}

### INSTRUCTIONS (contains all exercise specifications)
{{instructions}}

### LEVEL DEFAULTS (use if not specified in instructions)
- **Beginner:** 3-4 exercises, 1 blank per exercise
- **Intermediate:** 3-4 exercises, 1-2 blanks per exercise  
- **Advanced:** 4-5 exercises, 2 blanks per exercise

### CONSTRAINTS (CRITICAL)
1. **Clue Required:** Every blank MUST have a clue that tells the user what word to transform (e.g., infinitive verb "(tener)", base noun, English translation). The clue should NEVER be identical to the answer.
2. **Deterministic Answers:** The context must be specific enough that only ONE correct form fits. And if its not ensure the clue provides enough context.
3. **Accepted Alternates:** For valid variations (e.g., -ra/-se subjunctive Me [nombre] vs me [llamo]), include them in "acceptedAlternates". If the user has been taught multiple forms in previous lessons that fit the blank/context, include them all.
4. **Natural Syntax:** Sentences must sound native and conversational.
5. **Blank Marker:** Use [*] to mark each blank position in the template.

### OUTPUT FORMAT
Return JSON with "exercises" array. Each exercise has:
- template: Sentence with [*] markers for blanks
- blanks: Array of blank objects, each with:
  - correctAnswer: The primary correct answer
  - clue: What the user sees as a hint (e.g., "(hablar)")
  - acceptedAlternates: Array of other valid answers
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const WIB_TEST_CASES: TestCase<WIBInputs>[] = [
  {
    name: 'Beginner - Present Tense AR Verbs',
    description: 'Simple verb conjugation practice.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      instructions:
        'Create 3 write-in-the-blank sentences for present tense -ar verb conjugation (hablar, estudiar, trabajar). 1 blank per sentence. Provide the infinitive as a clue in parentheses. Use different subject pronouns.',
    },
  },
  {
    name: 'Intermediate - Reflexive Verbs',
    description: 'Reflexive pronoun + verb production.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      instructions:
        'Create 4 write-in-the-blank sentences for reflexive verbs in present tense (levantarse, ducharse, vestirse). 1 blank per sentence. The answer should include both the pronoun AND conjugated verb (e.g., "me levanto"). Clue format: infinitive with se, like "(ducharse)".',
    },
  },
  {
    name: 'Advanced - Imperfect Subjunctive',
    description: 'Hypothetical constructions with "como si".',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      instructions:
        'Create 4 write-in-the-blank sentences using imperfect subjunctive triggered by "como si". 2 blanks per sentence. Use -ra form as primary answer but include -se form in acceptedAlternates.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const WIB_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.7,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const WIB_TEST_CONFIG: PromptTestConfig<WIBInputs, unknown> = {
  featureName: 'Write in the Blanks',
  promptTemplate: WIB_PROMPT_TEMPLATE,
  outputSchema: WIBOutputSchema,
  testCases: WIB_TEST_CASES,
  models: WIB_MODELS,
};
