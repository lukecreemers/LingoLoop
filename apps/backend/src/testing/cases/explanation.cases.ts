import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';
import { EXOutput, EXOutputSchema } from '../../shared/types/explanation.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface EXInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const EX_PROMPT_TEMPLATE = `
### TASK
Generate a clear, pedagogical explanation in English about {{targetLanguage}} for a {{userLevel}} student.
The goal is to explain a specific linguistic concept so the student can apply it in upcoming exercises.

### INSTRUCTIONS (contains the topic and specifications)
{{instructions}}

### LEVEL-APPROPRIATE GUIDELINES
- **Beginner:** Use simple English. Avoid heavy jargon. Provide 2-3 very clear examples.
- **Intermediate:** Can use standard terms (subjunctive, direct object). Contrast with English. Provide 3-5 examples.
- **Advanced:** Deep dive into nuance, regional variations, formal vs informal. High-level comparisons.

### CONSTRAINTS
1. **Format:** Use clean Markdown. Bold key terms. Use code blocks for examples.
2. **Clarity:** Start with a high-level summary, then specific rules/examples.
3. **Tone:** Encouraging, expert, and concise. No fluff.
4. **Length:** Appropriate to the complexity - beginners get shorter explanations.

Write the explanation directly in Markdown format.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const EX_TEST_CASES: TestCase<EXInputs>[] = [
  {
    name: 'Beginner - Ser vs Estar',
    description: 'A simplified breakdown of the most common verb hurdle.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      instructions:
        'Explain the fundamental difference between Ser and Estar for beginners. Focus on the basic rules: ser for permanent traits (identity, origin, profession), estar for temporary states (location, emotions, conditions). Use simple examples.',
    },
  },
  {
    name: 'Intermediate - Preterite vs Imperfect',
    description: 'Past tense contrast.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      instructions:
        'Explain when to use Preterite vs Imperfect. Cover: completed actions (preterite) vs ongoing/habitual past (imperfect). Include time expression triggers and 3-5 contrastive examples.',
    },
  },
  {
    name: 'Advanced - Subjunctive in Relative Clauses',
    description: 'High-level nuance regarding existence and doubt.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      instructions:
        'Explain using the subjunctive in relative clauses when the antecedent is unknown or non-existent. Cover the contrast between indicative (known referent) and subjunctive (hypothetical referent). Include nuanced examples.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const EX_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.3,
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
  useRawTextOutput: true, // Don't use structured output - just get raw markdown
};
