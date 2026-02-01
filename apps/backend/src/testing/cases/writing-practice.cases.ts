import type { PromptTestConfig, ModelConfig, TestCase } from '../prompt-tester';
import { WPOutputSchema } from '../../shared/types/writing-practice.types';

// ============================================================================
// WRITING PRACTICE GENERATION PROMPT
// ============================================================================

export const WP_PROMPT_TEMPLATE = `You are an expert language teacher creating writing practice prompts.

## Context
- User Level: {{userLevel}}
- Target Language: {{targetLanguage}}
- Native Language: {{nativeLanguage}}
- Known Vocabulary: {{userWordList}}

## Instructions
{{instructions}}

## Requirements
1. Create {{promptCount}} writing prompts based on the instructions
2. Each prompt should:
   - Be written in {{targetLanguage}}
   - Include a translation in {{nativeLanguage}} for clarity
   - Be appropriate for the user's level
   - Encourage creative but structured responses
3. For beginners: Focus on simple questions about daily life, preferences, descriptions
4. For intermediate: Include opinion questions, comparisons, short narratives
5. For advanced: Complex topics, hypotheticals, argumentative prompts
6. Include optional hints (useful vocabulary or grammar structures) when helpful
7. Specify expected response length based on complexity

## Output Format
Provide a JSON object with:
- topic: The overall theme of the prompts
- prompts: Array of writing prompt objects`;

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface WPInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  instructions: string;
  promptCount: string;
  userWordList: string;
}

// ============================================================================
// TEST CASES
// ============================================================================

export const WP_TEST_CASES: TestCase<WPInputs>[] = [
  {
    name: 'beginner_daily_life',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create prompts about daily routines and describing your typical day',
      promptCount: '3',
      userWordList: 'despertarse, comer, trabajar, dormir',
    },
  },
  {
    name: 'intermediate_opinions',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create prompts asking for opinions about technology and social media',
      promptCount: '2',
      userWordList: 'tecnología, redes sociales, ventajas, desventajas',
    },
  },
  {
    name: 'advanced_hypotheticals',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create prompts using subjunctive mood for hypothetical situations',
      promptCount: '2',
      userWordList: 'si pudiera, ojalá, como si, aunque',
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

