import { CGOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface CGInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  conversationLength: string; // 'short' | 'medium' | 'long'
  userWordList: string[];
  userGrammarList: string[];
  targetLanguage: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const CG_PROMPT_TEMPLATE = `
### TASK
Generate a {{conversationLength}} conversation in {{targetLanguage}} for a {{userLevel}} student.
Create 2 relevant characters for the conversation and specify their names, age, and gender.

### CONTEXT & TOPIC
{{instructions}}

### LENGTH GUIDE
- **short:** 4-6 turns of dialogue
- **medium:** 8-12 turns of dialogue
- **long:** 14-20 turns of dialogue

### VOCABULARY INTEGRATION (OPTIONAL)
If any of these words fit naturally into the conversation, include them: [{{userWordList}}]
Do NOT force them. Natural dialogue flow is the absolute priority.

### GRAMMAR REINFORCEMENT
The student is practicing these grammar points. Weave them in if they fit naturally: [{{userGrammarList}}]. If they conflict with the conversational tone, ignore them.

### CONSTRAINTS (CRITICAL)
1. **Level-Appropriate:** Use vocabulary and structures that match the {{userLevel}} level.
2. **Natural & Authentic:** Write exactly how native speakers would actually talk. Avoid "textbook" dialogue.
3. **Distinct Voices:** Each character should have a slightly different speech pattern.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const CG_TEST_CASES: TestCase<CGInputs>[] = [
  // --------------------------------------------------------------------------
  // NORMAL / TRANSACTIONAL
  // --------------------------------------------------------------------------
  {
    name: 'Beginner - The Coffee Shop Order',
    description: 'A standard polite exchange in a cafe.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      conversationLength: 'short',
      instructions:
        'A customer is ordering breakfast at a local cafe. The barista is asking about milk preferences and where they want to sit.',
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
      userGrammarList: [
        'present tense regular verbs',
        'question formation',
        'definite articles',
        'adjective agreement',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // WEIRD / FUN - THE ACCIDENTAL TIME TRAVELER
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - The Victorian Time Traveler',
    description:
      'A person from 1890 arrives in a modern park and is confused by a smartphone.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      conversationLength: 'medium',
      instructions:
        'A person from the year 1890 suddenly appears in a park. They ask a modern jogger why they are carrying a "glowing black mirror" (a smartphone).',
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
      userGrammarList: [
        'preterite vs imperfect',
        'direct object pronouns',
        'mientras + imperfect',
        'expressing surprise',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // NORMAL / SOCIAL
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - Finding the Museum',
    description: 'A polite social interaction involving directions in Italy.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Italian',
      conversationLength: 'medium',
      instructions:
        'A tourist is lost in Rome and asks a local for directions to a hidden museum. The local gives advice on the best route to avoid crowds.',
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
      userGrammarList: [
        'imperative mood',
        'indirect object pronouns',
        'passato prossimo',
        'conditional for politeness',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // SUPER WEIRD - INTERVIEW WITH A PHILOSOPHICAL CAT
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - Interview with a Philosophical Cat',
    description:
      'A journalist interviews a cat that has gained the ability to speak and hates human logic.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      conversationLength: 'long',
      instructions:
        'A journalist is interviewing a house cat that suddenly started talking. The cat is very judgmental about human life choices and the concept of "work."',
      userWordList: [
        'hubiera',
        'habría',
        'si hubiera',
        'arrepentirse',
        'clavo',
        'pelo',
        'lengua',
        'claro',
        'tal vez',
        'en cambio',
      ],
      userGrammarList: [
        'si + imperfect subjunctive',
        'formal register (Usted)',
        'subjunctive for doubt/opinion',
        'complex relative pronouns',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // NORMAL / PROFESSIONAL
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - Urban Planning Debate',
    description: 'A high-level professional discussion about city policy.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      conversationLength: 'long',
      instructions:
        'Two urban planners are debating a new law that would ban all cars from the city center. They discuss logistics, pollution, and public reaction.',
      userWordList: [
        'desarrollar',
        'lograr',
        'actual',
        'rincón',
        'queja',
        'soportar',
        'habría',
        'si hubiera',
        'claro',
        'tal vez',
      ],
      userGrammarList: [
        'passive se constructions',
        'conditional perfect',
        'subjunctive in adjective clauses',
        'formal business connectors',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // WEIRD / FUN - THE CLUMSY SUPERHERO
  // --------------------------------------------------------------------------
  {
    name: 'Beginner - The Clumsy Superhero',
    description:
      'A superhero trying to buy a normal suit because they ripped their costume.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      conversationLength: 'short',
      instructions:
        'A superhero enters a clothing store. They are embarrassed because their cape got stuck in a door and they need a normal shirt immediately.',
      userWordList: [
        'verde',
        'casa',
        'amigo',
        'mañana',
        'noche',
        'feliz',
        'mesa',
        'silla',
        'ventana',
        'libro',
      ],
      userGrammarList: [
        'present tense',
        'expressing needs (necesitar/querer)',
        'colors and clothing vocabulary',
        'basic questions',
      ],
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const CG_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.8,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const CG_TEST_CONFIG: PromptTestConfig<CGInputs, unknown> = {
  featureName: 'Conversation Generation',
  promptTemplate: CG_PROMPT_TEMPLATE,
  outputSchema: CGOutputSchema,
  testCases: CG_TEST_CASES,
  models: CG_MODELS,
};
