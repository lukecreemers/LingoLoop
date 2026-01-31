import { FIBOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Define what variables your prompt needs
// ============================================================================

export interface FIBInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  blankAmount: number;
  distractorInstructions: string;
  userWordList: string[];
  sentenceCount: number;
}

// ============================================================================
// PROMPT TEMPLATE - Easy to read and modify
// ============================================================================

export const FIB_PROMPT_TEMPLATE = `
Create {{sentenceCount}} "Fill in the Blank" exercises for a {{userLevel}} Spanish student.

Topic: {{instructions}}
Blank word amount: {{blankAmount}}
The student also needs to review these words: {{userWordList}}. Try and naturally work some these words into a few of the sentences as non blank words if possible, but always prioritise the coherency of the sentence. The user is learning how to use these words properly and thus should only read them in contexts where they make complete sense.
Again, these words are not the priority of the learning, but if you can fit them in naturally, do so.

### CONSTRAINTS (CRITICAL)
1. **Zero Ambiguity:** Distractors must be contextually and semantically **incorrect**. If a distractor makes sense in the sentence, it is a fail.
2. **Real Words Only:** All distractors must be valid, real Spanish words. Never hallucinate suffixes or forms.
3. **No Duplicate Answers:** Do not include any of the 'correctAnswer' strings inside the 'distractors' array.
4. **Natural Syntax:** Ensure the sequence of 'text' and 'blank' segments forms a perfectly fluid, natural sentence.
5. **Unique Answers:** In multi-blank sentences, each answer must logically fit only its designated slot. Ensure answers are not semantically interchangeable. 
6. **Distractor Logic:** {{distractorInstructions}}.
`.trim();

// ============================================================================
// TEST CASES - Easy to add, remove, or modify
// ============================================================================

export const FIB_TEST_CASES: TestCase<FIBInputs>[] = [
  {
    name: 'Beginner - Gender/Number Agreement',
    description:
      'Target: Plural feminine noun-adjective agreement. Environment: Household items.',
    inputs: {
      userLevel: 'beginner',
      instructions:
        'Construct a sentence using plural feminine nouns and matching adjectives.',
      blankAmount: 2,
      distractorInstructions:
        'Must use the same adjectives but with incorrect gender (o/a) and number (s) suffixes.',
      userWordList: [
        'mesas',
        'sillas',
        'rojas',
        'limpias',
        'familia',
        'libro',
        'verdes',
        'ventana',
        'amigo',
        'casa',
      ],
      sentenceCount: 3,
    },
  },
  {
    name: 'Intermediate - Semantic Distinction',
    description:
      'Target: Saber vs Conocer contrast. Environment: Urban navigation and facts.',
    inputs: {
      userLevel: 'intermediate',
      instructions:
        'Contrast the usage of "saber" for facts and "conocer" for familiarity with places.',
      blankAmount: 2,
      distractorInstructions:
        'Swap the verbs. If the answer is "conozco", the primary distractor must be "sé".',
      userWordList: [
        'desarrollar',
        'alrededor',
        'cotidiano',
        'lograr',
        'queja',
        'actual',
        'rincón',
        'soportar',
        'aprovechar',
        'extraño',
      ],
      sentenceCount: 3,
    },
  },
  {
    name: 'Advanced - Hypothetical Syntax',
    description:
      'Target: Imperfect Subjunctive. Trigger: "Como si". Environment: Professional feedback.',
    inputs: {
      userLevel: 'advanced',
      instructions:
        'Trigger the imperfect subjunctive using the phrase "como si" in a professional context.',
      blankAmount: 2,
      distractorInstructions:
        'Provide the correct verb in present indicative and present subjunctive to test tense-sequence knowledge.',
      userWordList: [
        'ojalá',
        'habría',
        'si hubiera',
        'tal vez',
        'dudo que',
        'es posible que',
        'clavo',
        'lengua',
        'pelo',
        'claro',
      ],
      sentenceCount: 3,
    },
  },
  {
    name: 'Spaced Repetition Injection',
    description:
      'Target: Vocabulary retention. Requirement: Inject specific unrelated words into a coherent sentence.',
    inputs: {
      userLevel: 'intermediate',
      instructions:
        'Create a conversational sentence. Requirement: Incorporate at least 3 words from the word list into the static text.',
      blankAmount: 1,
      distractorInstructions:
        'Distractors must match the part-of-speech of the blank word but be contextually incorrect.',
      userWordList: [
        'aunque',
        'sin embargo',
        'zanahoria',
        'biblioteca',
        'mientras',
        'correr',
        'pesado',
        'brillante',
        'lejos',
        'decidir',
      ],
      sentenceCount: 3,
    },
  },
];

// ============================================================================
// MODELS TO TEST - Easy to swap or add new models
// ============================================================================

export const FIB_MODELS: ModelConfig[] = [
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

  // Uncomment to test more models:
  // {
  //   provider: 'anthropic' as const,
  //   model: 'claude-3-5-sonnet-20241022',
  //   temperature: 0.7,
  // },
  // {
  //   provider: 'openai' as const,
  //   model: 'gpt-4o-mini',
  //   temperature: 0.7,
  // },
];

// ============================================================================
// EXPORT COMPLETE CONFIG
// ============================================================================

export const FIB_TEST_CONFIG: PromptTestConfig<FIBInputs, unknown> = {
  featureName: 'Fill in the Blanks',
  promptTemplate: FIB_PROMPT_TEMPLATE,
  outputSchema: FIBOutputSchema,
  testCases: FIB_TEST_CASES,
  models: FIB_MODELS,
};
