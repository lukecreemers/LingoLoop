import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';
import { EXOutput, EXOutputSchema } from '../../shared/types/explanation.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface EXInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string; // e.g., "The difference between Por and Para"
  userWordList: string[];
  userGrammarList: string[];
  targetLanguage: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const EX_PROMPT_TEMPLATE = `
### TASK
Generate a clear, pedagogical explanation in English about {{targetLanguage}} for a {{userLevel}} student.
The goal is to explain a specific linguistic concept so the student can apply it in upcoming exercises.

### TOPIC TO EXPLAIN
{{instructions}}

### LEVEL-APPROPRIATE GUIDELINES
- **Beginner:** Use simple English. Avoid heavy linguistic jargon (e.g., say "verb changes" instead of "morphological inflections"). Provide 2-3 very clear examples.
- **Intermediate:** Can use standard terms (e.g., "subjunctive," "direct object"). Contrast the concept with English where helpful. Provide 3-5 examples.
- **Advanced:** Deep dive into nuance, regional variations, or formal vs. informal usage. Use high-level linguistic comparisons.

### VOCABULARY & GRAMMAR INTEGRATION
If relevant, use these items in your examples:
- Words: [{{userWordList}}]
- Grammar: [{{userGrammarList}}]
Filter these strictly; only include them if they help clarify the TOPIC or can be worked in naturally.

### CONSTRAINTS
1. **Format:** Use clean Markdown. Use bolding for emphasis and code blocks for examples.
2. **Clarity:** Start with a high-level summary, then move to specific rules/examples.
3. **Tone:** Encouraging, expert, and concise. No fluff.
4. **LaTeX:** Use LaTeX for any formal linguistic formulas if necessary (e.g., $$Subject + Verb + Object$$).
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const EX_TEST_CASES: TestCase<EXInputs>[] = [
  {
    name: 'Beginner - Ser vs Estar Basics',
    description: 'A simplified breakdown of the most common verb hurdle.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      instructions:
        'The fundamental difference between Ser and Estar (Permanent vs. Temporary).',
      userWordList: ['feliz', 'triste', 'alto', 'mexicano', 'en casa'],
      userGrammarList: ['present tense', 'adjective agreement'],
    },
  },
  {
    name: 'Intermediate - Passato Prossimo vs Imperfetto',
    description: 'Explaining the past tense contrast in Italian.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Italian',
      instructions:
        'When to use Passato Prossimo for completed actions versus Imperfetto for descriptions.',
      userWordList: ['mangiare', 'andare', 'scrivere', 'ieri', 'mentre'],
      userGrammarList: ['auxiliary verbs essere/avere', 'past participles'],
    },
  },
  {
    name: 'Advanced - Subjunctive in Relative Clauses',
    description: 'High-level nuance regarding existence and doubt.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      instructions:
        'Using the subjunctive in relative clauses when the antecedent is unknown or non-existent.',
      userWordList: ['buscar', 'encontrar', 'alguien', 'ningún', 'quizás'],
      userGrammarList: ['present subjunctive', 'relative pronouns'],
    },
  },
];

export const EX_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.3, // Lower temperature for factual, pedagogical consistency
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const EX_TEST_CONFIG: PromptTestConfig<EXInputs, EXOutput> = {
  featureName: 'Explanation Generation',
  promptTemplate: EX_PROMPT_TEMPLATE,
  outputSchema: EXOutputSchema,
  testCases: EX_TEST_CASES,
  models: EX_MODELS,
};
