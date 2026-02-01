import type { PromptTestConfig, ModelConfig, TestCase } from '../prompt-tester';
import { WOOutputSchema } from '../../shared/types/word-order.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface WOInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  sentenceCount: number;
  targetLanguage: string;
  nativeLanguage: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const WO_PROMPT_TEMPLATE = `
You are a language learning assistant creating word order exercises.

### CONTEXT
- User Level: {{userLevel}}
- Target Language: {{targetLanguage}}
- Native Language: {{nativeLanguage}}

### TASK
Generate {{sentenceCount}} sentences based on: "{{instructions}}"

Each sentence should:
1. Be appropriate for the user's level
2. Be a complete, grammatically correct sentence
3. Include the translation in the native language
4. Be interesting and varied (not repetitive patterns)

### GUIDELINES
- Beginners: 4-7 words per sentence, simple structures
- Intermediate: 6-10 words, include some subordinate clauses
- Advanced: 8-15 words, complex structures allowed

### OUTPUT FORMAT
Return JSON with an array of sentences, each containing 'sentence' and 'translation'.
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
      instructions: 'Daily activities and routines',
      sentenceCount: 5,
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
    },
  },
  {
    name: 'Intermediate - Travel',
    description: 'Medium complexity travel sentences',
    inputs: {
      userLevel: 'intermediate',
      instructions: 'Traveling and asking for directions',
      sentenceCount: 4,
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
    },
  },
  {
    name: 'Advanced - Opinions',
    description: 'Complex sentences expressing opinions',
    inputs: {
      userLevel: 'advanced',
      instructions: 'Expressing opinions about technology',
      sentenceCount: 3,
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
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

