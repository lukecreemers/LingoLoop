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
  // BEGINNER: Sparse Filtering
  // --------------------------------------------------------------------------
  {
    name: 'Beginner - Verb Infinitive to English',
    description:
      'AI must filter verbs from a list containing nouns and adjectives.',
    inputs: {
      userLevel: 'beginner',
      matchType: 'Spanish Infinitive → English Translation',
      theme: 'Common -ar verbs',
      pairCount: 5,
      distractorCount: 2,
      // Sparse: Mix of verbs, nouns, and adjectives. AI must pick only the verbs.
      userWordList: [
        'hablar',
        'casa',
        'trabajar',
        'azul',
        'estudiar',
        'libro',
        'caminar',
        'perro',
        'cocinar',
        'feliz',
      ],
    },
  },
  {
    name: 'Beginner - Noun to Article',
    description: 'AI must identify nouns and their genders from a sparse list.',
    inputs: {
      userLevel: 'beginner',
      matchType: 'Spanish Noun → Correct Article (el/la)',
      theme: 'Household objects and their gender',
      pairCount: 5,
      distractorCount: 2,
      // Sparse: AI needs to ignore the verbs 'comer' and 'leer' to focus on nouns.
      userWordList: [
        'mesa',
        'comer',
        'libro',
        'silla',
        'leer',
        'ventana',
        'verde',
        'teléfono',
        'casa',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // INTERMEDIATE: Categorical Selection
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - Ser vs Estar Context',
    description: 'AI must match specific concepts to the correct verb logic.',
    inputs: {
      userLevel: 'intermediate',
      matchType: 'Context Description → Correct Verb (Ser or Estar)',
      theme: 'Permanent vs temporary states',
      pairCount: 5,
      distractorCount: 2,
      // Sparse: Mix of categories. AI must derive "profesión" or "ubicación" from these.
      userWordList: [
        'médico',
        'estoy',
        'madrid',
        'inteligente',
        'cansado',
        'triste',
        'español',
        'actual',
      ],
    },
  },
  {
    name: 'Intermediate - Preterite vs Imperfect',
    description: 'AI filters time expressions from general vocabulary.',
    inputs: {
      userLevel: 'intermediate',
      matchType: 'Time Expression → Tense (Preterite or Imperfect)',
      theme: 'Past tense trigger phrases',
      pairCount: 5,
      distractorCount: 2,
      // Sparse: Only half the list are actually time triggers.
      userWordList: [
        'ayer',
        'ventana',
        'siempre',
        'lograr',
        'de repente',
        'rincón',
        'cada día',
        'extraño',
        'una vez',
      ],
    },
  },
  {
    name: 'Intermediate - False Cognates',
    description:
      'AI must pick actual false cognates out of a list of regular words.',
    inputs: {
      userLevel: 'intermediate',
      matchType: 'Spanish Word → Actual English Meaning (NOT the cognate)',
      theme: 'Common false cognates',
      pairCount: 5,
      distractorCount: 3,
      // Sparse: Includes real cognates like 'doctor' to see if AI gets confused.
      userWordList: [
        'embarazada',
        'doctor',
        'actual',
        'hospital',
        'realizar',
        'soportar',
        'fruta',
        'éxito',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // ADVANCED: Conceptual Nuance
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - Subjunctive Triggers',
    description: 'AI selects triggers and ignores general advanced vocabulary.',
    inputs: {
      userLevel: 'advanced',
      matchType: 'Trigger Phrase → Mood Required (Indicative/Subjunctive)',
      theme: 'Mood selection after conjunctions and expressions',
      pairCount: 6,
      distractorCount: 2,
      // Sparse: AI must identify the "Triggers" specifically.
      userWordList: [
        'ojalá',
        'clavo',
        'dudo que',
        'lengua',
        'es obvio que',
        'pelo',
        'cuando',
        'aunque',
        'claro',
      ],
    },
  },
  {
    name: 'Advanced - Idiomatic Expressions',
    description: 'AI must identify idioms from a list of literal words.',
    inputs: {
      userLevel: 'advanced',
      matchType: 'Spanish Idiom → English Equivalent Meaning',
      theme: 'Common idiomatic expressions',
      pairCount: 5,
      distractorCount: 3,
      // Sparse: AI must distinguish between idioms and their component words.
      userWordList: [
        'pelo',
        'tomar el pelo',
        'clavo',
        'dar en el clavo',
        'pata',
        'meter la pata',
        'ojo',
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
