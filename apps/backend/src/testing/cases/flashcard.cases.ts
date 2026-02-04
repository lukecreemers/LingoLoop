import type { PromptTestConfig, ModelConfig, TestCase } from '../prompt-tester';
import { FCOutputSchema } from '../../shared/types/flashcard.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface FCInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const FC_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
Given that context, your job is to create vocabulary flashcards for the following student:

{{userProfile}}

### INSTRUCTIONS (contains all specifications)
{{instructions}}


### CONSTRAINTS
1. Each card has: term, definition, optional example sentence with translation
2. Terms should be appropriate for the user's level
3. Order cards from simpler/more common to more complex
4. Examples should demonstrate natural usage
5. Term and definition should be matching lengths (e.g. if the Term is "Tener", the Definition should be "To have")

### OUTPUT FORMAT
Return JSON with:
- theme: Brief description of the vocabulary theme
- cards: Array of { term, definition, example?, exampleTranslation? }
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const FC_TEST_CASES: TestCase<FCInputs>[] = [
  {
    name: 'Beginner - Greetings',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 5 flashcards for basic greetings and introductions (hola, adiós, buenos días, etc). Include example sentences for each.',
    },
  },
  {
    name: 'Intermediate - Food',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 7 flashcards for restaurant vocabulary (ordering, describing food, asking for the check). Include natural example sentences.',
    },
  },
  {
    name: 'Advanced - Idioms',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create 8 flashcards for common Spanish idioms related to work and productivity. Explain the literal vs figurative meaning.',
    },
  },
];

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const FC_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic',
    model: 'claude-haiku-4-5',
  },
];

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export const FC_TEST_CONFIG: PromptTestConfig<FCInputs, unknown> = {
  featureName: 'Flashcard Generation',
  promptTemplate: FC_PROMPT_TEMPLATE,
  testCases: FC_TEST_CASES,
  models: FC_MODELS,
  outputSchema: FCOutputSchema,
};
