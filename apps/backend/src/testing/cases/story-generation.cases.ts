import { SGOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface SGInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  textType: string; // 'story' | 'news article' | 'email' | 'retelling' | 'blog post'
  textLength: 'short' | 'medium' | 'long';
  userWordList: string[];
  userGrammarList: string[];
  targetLanguage: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const SG_PROMPT_TEMPLATE = `
### TASK
Generate a {{textLength}} {{textType}} in {{targetLanguage}} for a {{userLevel}} student.

### CONTEXT & TOPIC
{{instructions}}

### LENGTH GUIDE
- **short:** 3-5 sentences (~50-80 words)
- **medium:** 6-10 sentences (~100-150 words)
- **long:** 11-15 sentences (~180-250 words)

### VOCABULARY INTEGRATION (OPTIONAL)
If any of these words fit naturally into the context of a {{textType}}, include them: [{{userWordList}}]
Do NOT force them. Text coherence and natural flow are the absolute priorities.

### GRAMMAR REINFORCEMENT
The student is practicing these grammar points. Weave them in if they fit the {{textType}} naturally: [{{userGrammarList}}]. If they conflict with the tone or requirements, ignore them.

### CONSTRAINTS (CRITICAL)
1. **Level-Appropriate:** Use vocabulary and structures that match the {{userLevel}} level.
2. **Natural & Authentic:** Write exactly how a native speaker would write a {{textType}}. Avoid "textbook" language.
3. **Tone Consistency:** Ensure the tone (formal vs. informal) matches the specific requirements of a {{textType}}.
4. **Output:** Provide ONLY the text in {{targetLanguage}}.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const SG_TEST_CASES: TestCase<SGInputs>[] = [
  // --------------------------------------------------------------------------
  // BEGINNER: Character Retelling (Spanish)
  // --------------------------------------------------------------------------
  {
    name: 'Beginner - Clumsy Robot Morning',
    description:
      'A robot attempting a human routine. AI must filter tech jargon vs. morning verbs.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      textType: 'first-person retelling',
      textLength: 'short',
      instructions:
        'A robot named "Bip" describes his first morning trying to act like a human. Focus on his funny mistakes.',
      userWordList: [
        'aceite',
        'servidor',
        'desayuno',
        'componente',
        'café',
        'mañana',
        'código',
        'desarrollar',
        'feliz',
        'ventana',
      ],
      userGrammarList: [
        'present tense regular verbs',
        'future tense with will', // Should be ignored for a present retelling
        'definite articles (el, la)',
        'basic adjective agreement',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // INTERMEDIATE: Noir & Alchemical Formats (Spanish/Italian)
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - The Neon Detective',
    description:
      'Noir mystery. AI must handle descriptive "noir" tone while filtering business noise.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      textType: 'detective noir monologue',
      textLength: 'medium',
      instructions:
        'A detective in a rainy, neon-lit city finds a mysterious glowing letter in a quiet cafe.',
      userWordList: [
        'lluvia',
        'reunión',
        'misterio',
        'presupuesto',
        'buscar',
        'rincón',
        'actual',
        'brillar',
        'lograr',
        'de repente',
      ],
      userGrammarList: [
        'imperfect for descriptions',
        'preterite for completed actions',
        'present subjunctive triggers',
        'mientras + imperfect',
      ],
    },
  },
  {
    name: 'Intermediate - The Alchemist’s Recipe',
    description:
      'Instructional text. AI must filter science jargon into a mystical recipe.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Italian',
      textType: 'ancient recipe instructions',
      textLength: 'medium',
      instructions:
        'Instructions for brewing a "Liquid Starlight" soup that changes the color of the sky.',
      userWordList: [
        'zuppa',
        'solfato',
        'pacchetto',
        'zinco',
        'aggiungere',
        'uva',
        'mostrare',
        'pozione',
        'ringraziare',
        'generoso',
      ],
      userGrammarList: [
        'direct object pronouns',
        'passive voice with "essere"',
        'indirect object pronouns',
        'imperative mood (commands)',
      ],
    },
  },

  // --------------------------------------------------------------------------
  // ADVANCED: Dystopian & Steampunk Reports (Spanish)
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - The Memory Architect',
    description:
      'Philosophical reflection. AI must integrate UI terms into a dystopian narrative.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      textType: 'philosophical journal entry',
      textLength: 'long',
      instructions:
        'A "Memory Architect" reflects on a core childhood memory they accidentally deleted from the system.',
      userWordList: [
        'hubiera',
        'botón',
        'habría',
        'cursor',
        'arrepentirse',
        'página',
        'imaginar',
        'tal vez',
        'en cambio',
        'clavo',
      ],
      userGrammarList: [
        'si + imperfect subjunctive + conditional',
        'si + pluperfect subjunctive + conditional perfect',
        'conditional tense formation',
        'relative pronouns',
      ],
    },
  },
  {
    name: 'Advanced - Steampunk News Report',
    description:
      'Formal reporting. AI must maintain a "Newspaper" register despite idiomatic noise.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      textType: 'newspaper front-page article',
      textLength: 'long',
      instructions:
        'A formal report from the year 1890 about the sighting of a massive mechanical whale in the Atlantic.',
      userWordList: [
        'descubrimiento',
        'pelo',
        'ballena',
        'lengua',
        'vapor',
        'claro',
        'mecanismo',
        'meter la pata',
        'según',
        'afirmar',
      ],
      userGrammarList: [
        'passive voice with ser',
        'present progressive',
        'passive se construction',
        'reported speech',
      ],
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const SG_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.8, // Slightly higher for creative writing
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const SG_TEST_CONFIG: PromptTestConfig<SGInputs, unknown> = {
  featureName: 'Story Generation',
  promptTemplate: SG_PROMPT_TEMPLATE,
  outputSchema: SGOutputSchema,
  testCases: SG_TEST_CASES,
  models: SG_MODELS,
};
