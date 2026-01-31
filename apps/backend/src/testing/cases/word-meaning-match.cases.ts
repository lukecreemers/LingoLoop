import { WMMOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface WMMInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  matchType: string;
  theme: string;
  pairCount: number;
  distractorCount: number;
  userWordList: string[];
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const WMM_PROMPT_TEMPLATE = `
Create a "Match the Columns" exercise for a {{userLevel}} Spanish student.

Match Type: {{matchType}}
Theme: {{theme}}
Number of correct pairs: {{pairCount}}
Number of distractors: {{distractorCount}}

The student is also reviewing these words: {{userWordList}}. If any fit naturally into the exercise, include them.

### CONSTRAINTS (CRITICAL)
1. **Column Labels:** Provide clear labels for Column A and Column B that describe what each column contains.
2. **Unique Matches:** Each item in Column A must have exactly ONE correct match in Column B. No ambiguity.
3. **Distractors:** Add {{distractorCount}} plausible but INCORRECT items to Column B. They must fit the theme but NOT match any Column A item.
4. **Difficulty:** Distractors should be "near-misses" that test understanding, not random unrelated words.
5. **Balanced Length:** Items in each column should be roughly similar in length/complexity.
6. **Clear Instruction:** Provide a concise instruction explaining the matching task.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const WMM_TEST_CASES: TestCase<WMMInputs>[] = [
  // --------------------------------------------------------------------------
  // BEGINNER: Core Vocabulary
  // --------------------------------------------------------------------------
  {
    name: 'Beginner - Verb Infinitive to English',
    description: 'Match Spanish infinitives to English translations.',
    inputs: {
      userLevel: 'beginner',
      matchType: 'Spanish Infinitive → English Translation',
      theme: 'Common -ar verbs',
      pairCount: 5,
      distractorCount: 2,
      userWordList: ['hablar', 'estudiar', 'trabajar', 'cocinar', 'caminar'],
    },
  },
  {
    name: 'Beginner - Noun to Article',
    description: 'Match nouns to correct definite article (el/la).',
    inputs: {
      userLevel: 'beginner',
      matchType: 'Spanish Noun → Correct Article (el/la)',
      theme: 'Household objects and their gender',
      pairCount: 5,
      distractorCount: 2,
      userWordList: ['mesa', 'libro', 'silla', 'ventana', 'teléfono', 'casa'],
    },
  },
  {
    name: 'Beginner - Adjective Opposites',
    description: 'Match adjectives to their antonyms.',
    inputs: {
      userLevel: 'beginner',
      matchType: 'Spanish Adjective → Its Opposite',
      theme: 'Common descriptive adjectives',
      pairCount: 5,
      distractorCount: 2,
      userWordList: ['grande', 'pequeño', 'alto', 'bajo', 'feliz', 'triste'],
    },
  },

  // --------------------------------------------------------------------------
  // INTERMEDIATE: Contextual Understanding
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - Ser vs Estar Context',
    description: 'Match sentence contexts to correct verb (ser/estar).',
    inputs: {
      userLevel: 'intermediate',
      matchType: 'Context Description → Correct Verb (Ser or Estar)',
      theme: 'Permanent vs temporary states',
      pairCount: 5,
      distractorCount: 2,
      userWordList: [
        'profesión',
        'ubicación',
        'emoción',
        'origen',
        'condición',
      ],
    },
  },
  {
    name: 'Intermediate - Preterite vs Imperfect',
    description: 'Match time expressions to appropriate past tense.',
    inputs: {
      userLevel: 'intermediate',
      matchType: 'Time Expression → Tense (Preterite or Imperfect)',
      theme: 'Past tense trigger phrases',
      pairCount: 5,
      distractorCount: 2,
      userWordList: ['ayer', 'siempre', 'de repente', 'cada día', 'una vez'],
    },
  },
  {
    name: 'Intermediate - False Cognates',
    description: 'Match Spanish false friends to actual meanings.',
    inputs: {
      userLevel: 'intermediate',
      matchType: 'Spanish Word → Actual English Meaning (NOT the cognate)',
      theme: 'Common false cognates',
      pairCount: 5,
      distractorCount: 3,
      userWordList: ['embarazada', 'actual', 'realizar', 'soportar', 'éxito'],
    },
  },

  // --------------------------------------------------------------------------
  // ADVANCED: Nuanced Distinctions
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - Subjunctive Triggers',
    description: 'Match phrases to mood they trigger.',
    inputs: {
      userLevel: 'advanced',
      matchType: 'Trigger Phrase → Mood Required (Indicative/Subjunctive)',
      theme: 'Mood selection after conjunctions and expressions',
      pairCount: 6,
      distractorCount: 2,
      userWordList: ['ojalá', 'dudo que', 'es obvio que', 'cuando', 'aunque'],
    },
  },
  {
    name: 'Advanced - Idiomatic Expressions',
    description: 'Match Spanish idioms to English equivalents.',
    inputs: {
      userLevel: 'advanced',
      matchType: 'Spanish Idiom → English Equivalent Meaning',
      theme: 'Common idiomatic expressions',
      pairCount: 5,
      distractorCount: 3,
      userWordList: [
        'tomar el pelo',
        'dar en el clavo',
        'meter la pata',
        'costar un ojo',
      ],
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const WMM_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.7,
  },
  // {
  //   provider: 'anthropic' as const,
  //   model: 'claude-sonnet-4-5',
  //   temperature: 0.7,
  // },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const WMM_TEST_CONFIG: PromptTestConfig<WMMInputs, unknown> = {
  featureName: 'Word Meaning Match',
  promptTemplate: WMM_PROMPT_TEMPLATE,
  outputSchema: WMMOutputSchema,
  testCases: WMM_TEST_CASES,
  models: WMM_MODELS,
};
