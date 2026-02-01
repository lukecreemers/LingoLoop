import type { PromptTestConfig, ModelConfig, TestCase } from '../prompt-tester';
import { FCOutputSchema } from '../../shared/types/flashcard.types';

// ============================================================================
// FLASHCARD GENERATION PROMPT
// ============================================================================

export const FC_PROMPT_TEMPLATE = `You are an expert language teacher creating flashcards for vocabulary learning.

## Context
- User Level: {{userLevel}}
- Target Language: {{targetLanguage}}
- Native Language: {{nativeLanguage}}
- Known Vocabulary: {{userWordList}}

## Instructions
{{instructions}}

## Requirements
1. Create {{cardCount}} flashcard items based on the instructions
2. Each card should have:
   - A term in {{targetLanguage}}
   - A clear, concise definition in {{nativeLanguage}}
   - Optionally, a simple example sentence using the term
   - If example is provided, include its translation
3. Ensure terms are appropriate for the user's level
4. Avoid words already in their known vocabulary list
5. Group related terms around the theme specified in instructions
6. Order cards from simpler/more common to more complex/less common

## Output Format
Provide a JSON object with:
- cards: Array of flashcard items
- theme: A brief description of the vocabulary theme`;

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface FCInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  instructions: string;
  cardCount: string;
  userWordList: string;
}

// ============================================================================
// TEST CASES
// ============================================================================

export const FC_TEST_CASES: TestCase<FCInputs>[] = [
  {
    name: 'basic_greetings',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions: 'Create flashcards for basic greetings and introductions',
      cardCount: '6',
      userWordList: 'hola, adiós',
    },
  },
  {
    name: 'food_vocabulary',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create flashcards for common food and restaurant vocabulary',
      cardCount: '8',
      userWordList: 'comida, agua, pan',
    },
  },
  {
    name: 'time_expressions',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create flashcards for telling time and time-related expressions',
      cardCount: '5',
      userWordList: '',
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
