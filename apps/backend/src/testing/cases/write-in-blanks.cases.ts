import { WIBOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Define what variables your prompt needs
// ============================================================================

export interface WIBInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  blankAmount: number;
  userWordList: string[];
  sentenceCount: number;
}

// ============================================================================
// PROMPT TEMPLATE - Easy to read and modify
// ============================================================================

export const WIB_PROMPT_TEMPLATE = `
Create {{sentenceCount}} "Write in the Blank" exercises for a {{userLevel}} Spanish student.

Topic: {{instructions}}
Blank word amount: {{blankAmount}}
The student also needs to review these words: {{userWordList}}. Try and naturally work some these words into a few of the sentences as non blank words if possible, but always prioritise the coherency of the sentence. The user is learning how to use these words properly and thus should only read them in contexts where they make complete sense.
Again, these words are not the priority of the learning, but if you can fit them in naturally, do so. Never

### CONSTRAINTS (CRITICAL)
1. **Target Word/Grammar:** {{instructions}}
2. **Blank Marker:** Use exactly {{blankAmount}} blanks per sentence, marked with [*].
3. **Clue Integration:** Every blank MUST have a corresponding clue (e.g., an infinitive verb like "(tener)" or a base noun) that provides the user with the root word to be conjugated or transformed.
4. **Vocabulary Injection:** Naturally incorporate 2-3 words from [{{userWordList}}] into the static text (non-blank parts) of the sentences.
5. **Deterministic Answers:** The sentence context must be so specific that only ONE correct form/word fits the blank. Avoid sentences where multiple tenses or synonyms could logically work.
6. **Natural Syntax:** The resulting full sentence must be conversational, high-quality Spanish.
`.trim();

// ============================================================================
// TEST CASES - Easy to add, remove, or modify
// ============================================================================

export const WIB_TEST_CASES: TestCase<WIBInputs>[] = [
  // --------------------------------------------------------------------------
  // BEGINNER: Production Fundamentals
  // --------------------------------------------------------------------------
  {
    name: 'Beginner - -AR Verb Production',
    description:
      'Target: Present tense -ar endings. Focus: Subject-verb agreement.',
    inputs: {
      userLevel: 'beginner',
      instructions:
        'Topic: Present Tense -AR Verbs. ' +
        'Verb Pool: [hablar, estudiar, trabajar, cocinar]. ' +
        'Requirement: Use different subject pronouns (yo, tú, nosotros) across the 3 exercises. ' +
        'Clue Format: Provide the infinitive in parentheses, e.g., "(hablar)".',
      blankAmount: 1,
      userWordList: [
        'casa',
        'escuela',
        'amigo',
        'día',
        'mañana',
        'mesa',
        'libro',
      ],
      sentenceCount: 3,
    },
  },
  {
    name: 'Beginner - Estar + Location/State',
    description:
      'Target: Estar for temporary states. Requirement: Correct accents.',
    inputs: {
      userLevel: 'beginner',
      instructions:
        'Topic: Estar (Present Tense). ' +
        'Context: Temporary emotional states or physical locations. ' +
        'Constraint: Do NOT use "Ser". The sentence must trigger "Estar" uniquely (e.g., using "ahora" or "en este momento"). ' +
        'Clue Format: "(estar)".',
      blankAmount: 1,
      userWordList: [
        'feliz',
        'cansado',
        'en casa',
        'mañana',
        'ventana',
        'día',
        'noche',
      ],
      sentenceCount: 3,
    },
  },

  // --------------------------------------------------------------------------
  // INTERMEDIATE: Grammatical Mechanics
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - Preterite Stem-Changers (-ir)',
    description: 'Target: 3rd person e->i / o->u changes.',
    inputs: {
      userLevel: 'intermediate',
      instructions:
        'Topic: Preterite Stem-Changing Verbs (-ir only). ' +
        'Verb Pool: [dormir, pedir, servir, repetir, sentir]. ' +
        'Constraint: Use ONLY 3rd person (él/ella/ellos) to trigger the stem change. ' +
        'Requirement: Ensure the clue is just the infinitive, e.g., "(pedir)".',
      blankAmount: 1,
      userWordList: [
        'ayer',
        'semana pasada',
        'de repente',
        'lograr',
        'aprovechar',
        'extraño',
      ],
      sentenceCount: 3,
    },
  },
  {
    name: 'Intermediate - Reflexive Pronoun Placement',
    description: 'Target: Pronoun + Verb production.',
    inputs: {
      userLevel: 'intermediate',
      instructions:
        'Topic: Reflexive Verbs (Present Tense). ' +
        'Verb Pool: [levantarse, ducharse, vestirse, acostarse]. ' +
        'Constraint: The blank [*] MUST be filled with both the reflexive pronoun AND the conjugated verb (e.g., "me levanto"). ' +
        'Clue Format: Use the infinitive with "se", e.g., "(ducharse)".',
      blankAmount: 1,
      userWordList: [
        'temprano',
        'rápidamente',
        'cotidiano',
        'desarrollar',
        'alrededor',
        'siempre',
      ],
      sentenceCount: 3,
    },
  },

  // --------------------------------------------------------------------------
  // ADVANCED: Syntactic Precision
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - Pure Imperfect Subjunctive',
    description: 'Target: Hypothetical "como si" constructions.',
    inputs: {
      userLevel: 'advanced',
      instructions:
        'Topic: Imperfect Subjunctive. ' +
        'Constraint: Trigger strictly using "como si" in professional or academic contexts. ' +
        'Requirement: Use both -ra and -se forms interchangeably in "acceptedAlternates" but use -ra as the primary correctAnswer.',
      blankAmount: 2,
      userWordList: [
        'ojalá',
        'tal vez',
        'dudo que',
        'clavo',
        'lengua',
        'rincón',
        'actual',
      ],
      sentenceCount: 3,
    },
  },
  {
    name: 'Advanced - Conditional Perfect',
    description: 'Target: habría + participle.',
    inputs: {
      userLevel: 'advanced',
      instructions:
        'Topic: Conditional Perfect (Compound Tense). ' +
        'Structure: "Si [Pluperfect Subjunctive], then [Conditional Perfect]". ' +
        'Blank Requirements: Blank 1 = "habría" (auxiliary). Blank 2 = past participle. ' +
        'Clue Format: Blank 1 clue is "(haber)", Blank 2 clue is the infinitive of the action.',
      blankAmount: 2,
      userWordList: [
        'si hubiera',
        'en tu lugar',
        'habría',
        'claro',
        'posible',
        'pelo',
        'lengua',
      ],
      sentenceCount: 3,
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
  // {
  //   provider: 'anthropic' as const,
  //   model: 'claude-sonnet-4-5',
  //   temperature: 0.7,
  // },
  // {
  //   provider: 'deepseek' as const,
  //   model: 'deepseek-chat',
  // },
];

// ============================================================================
// EXPORT COMPLETE CONFIG
// ============================================================================

export const WIB_TEST_CONFIG: PromptTestConfig<WIBInputs, unknown> = {
  featureName: 'Write in the Blanks',
  promptTemplate: WIB_PROMPT_TEMPLATE,
  outputSchema: WIBOutputSchema,
  testCases: WIB_TEST_CASES,
  models: WIB_MODELS,
};
