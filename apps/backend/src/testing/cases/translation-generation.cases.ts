import { TGOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface TGInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  sentenceCount: number;
  userWordList: string[];
  startingLanguage: string;
  languageToTranslateTo: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const TG_PROMPT_TEMPLATE = `
### TASK
Generate a {{sentenceCount}}-sentence paragraph in {{startingLanguage}} for a {{userLevel}} student to translate into {{languageToTranslateTo}}. You will also need to provide an ideal translation for the student to model there answer off of aswell

### TOPIC/CONTEXT
{{instructions}}

### VOCABULARY (OPTIONAL)
If any of these words fit naturally, include them: [{{userWordList}}]
Do NOT force them. Natural paragraphs are the priority.

### CONSTRAINTS
1. **Level-Appropriate:** Complexity must match {{userLevel}}.
2. **Natural Flow:** The paragraph should read like native speech, not a list of disconnected sentences.
3. **Coherent Theme:** All sentences should connect to form a unified paragraph.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TG_TEST_CASES: TestCase<TGInputs>[] = [
  // --------------------------------------------------------------------------
  // ENGLISH → SPANISH: Production Focus
  // --------------------------------------------------------------------------
  {
    name: 'EN→ES Beginner - Routine + Static Objects',
    description:
      'Forces integration of 10 household and descriptive words into a routine.',
    inputs: {
      userLevel: 'beginner',
      startingLanguage: 'English',
      languageToTranslateTo: 'Spanish',
      instructions: 'A person describing their typical morning routine.',
      sentenceCount: 3,
      userWordList: [
        'mesa',
        'silla',
        'ventana',
        'libro',
        'verde',
        'casa',
        'amigo',
        'mañana',
        'noche',
        'feliz',
      ],
    },
  },
  {
    name: 'EN→ES Intermediate - Travel + Abstract Concepts',
    description:
      'Requires narrative tenses mixed with 10 unrelated intermediate terms.',
    inputs: {
      userLevel: 'intermediate',
      startingLanguage: 'English',
      languageToTranslateTo: 'Spanish',
      instructions: 'Someone recounting a memorable vacation experience.',
      sentenceCount: 4,
      userWordList: [
        'lograr',
        'aprovechar',
        'extraño',
        'rincón',
        'queja',
        'soportar',
        'de repente',
        'ayer',
        'actual',
        'desarrollar',
      ],
    },
  },
  {
    name: 'EN→ES Advanced - Opinion + Idiomatic Hooks',
    description:
      'Advanced syntax with 10 highly unrelated or idiomatic review words.',
    inputs: {
      userLevel: 'advanced',
      startingLanguage: 'English',
      languageToTranslateTo: 'Spanish',
      instructions: 'Opinion on remote work and its impact on productivity.',
      sentenceCount: 4,
      userWordList: [
        'clavo',
        'lengua',
        'pelo',
        'claro',
        'actual',
        'ojalá',
        'habría',
        'si hubiera',
        'posible',
        'tal vez',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // SPANISH/ITALIAN → ENGLISH: Comprehension Focus
  // --------------------------------------------------------------------------
  {
    name: 'ES→EN Beginner - Family + Environment',
    description:
      'Introductory paragraph with 10 sparse environmental/time nouns.',
    inputs: {
      userLevel: 'beginner',
      startingLanguage: 'Spanish',
      languageToTranslateTo: 'English',
      instructions: 'A person introducing their family members.',
      sentenceCount: 3,
      userWordList: [
        'mañana',
        'noche',
        'escuela',
        'amigo',
        'día',
        'familia',
        'libro',
        'mesa',
        'ventana',
        'casa',
      ],
    },
  },
  {
    name: 'IT→EN Intermediate - Daily Life (Italian focus)',
    description:
      'Testing Italian grammar structures with 10 sparse review words.',
    inputs: {
      userLevel: 'intermediate',
      startingLanguage: 'Italian',
      languageToTranslateTo: 'English',
      instructions: 'Describing a visit to a local market or cafe.',
      sentenceCount: 4,
      userWordList: [
        'angolo',
        'lamentela',
        'sviluppare',
        'raggiungere',
        'attuale',
        'ieri',
        'improvviso',
        'riuscire',
        'sopportare',
        'strano',
      ],
    },
  },
  {
    name: 'ES→EN Advanced - Professional Feedback',
    description:
      'Formal register using hypothetical clauses and 10 advanced words.',
    inputs: {
      userLevel: 'advanced',
      startingLanguage: 'Spanish',
      languageToTranslateTo: 'English',
      instructions: 'A professional feedback email regarding a project delay.',
      sentenceCount: 4,
      userWordList: [
        'si hubiera',
        'en tu lugar',
        'habría',
        'posible',
        'tal vez',
        'dudo que',
        'claro',
        'clavo',
        'lengua',
        'pelo',
      ],
    },
  },
];
// ============================================================================
// MODELS TO TEST
// ============================================================================

export const TG_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.7,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const TG_TEST_CONFIG: PromptTestConfig<TGInputs, unknown> = {
  featureName: 'Translation Generation',
  promptTemplate: TG_PROMPT_TEMPLATE,
  outputSchema: TGOutputSchema,
  testCases: TG_TEST_CASES,
  models: TG_MODELS,
};
