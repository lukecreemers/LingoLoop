import { CGOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface CGInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const CG_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
Generate a conversation in {{targetLanguage}} for a {{userLevel}} student.
Create 2 relevant characters with names, ages, and genders.

{{userProfile}}

### INSTRUCTIONS (contains all specifications)
{{instructions}}

### LEVEL DEFAULTS (use if not specified in instructions)
- **Beginner:** Short (4-6 turns), simple vocabulary, present tense
- **Intermediate:** Medium (8-10 turns), mixed tenses, natural expressions
- **Advanced:** Long (12+ turns), complex structures, nuanced dialogue

### CONSTRAINTS (CRITICAL)
1. **Level-Appropriate:** Vocabulary and structures must match {{userLevel}}.
2. **Natural & Authentic:** Write exactly how native speakers actually talk. No "textbook" dialogue.
3. **Distinct Voices:** Each character should have a slightly different speech pattern.
4. **Engaging Context:** The situation should be interesting and realistic.
5. **Personalize:** Use scenarios relevant to the learner's goals and interests where possible.

### OUTPUT FORMAT
Return JSON with:
- characters: Array of { name, age, gender } for each character
- conversation: Full dialogue with format "**Name:** dialogue text" on each line
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const CG_TEST_CASES: TestCase<CGInputs>[] = [
  {
    name: 'Beginner - Cafe Order',
    description: 'Simple transactional dialogue.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      instructions:
        'Create a short conversation (4-6 turns) at a coffee shop. A customer orders breakfast and the barista asks about preferences. Use present tense, basic questions.',
    },
  },
  {
    name: 'Intermediate - Lost Tourist',
    description: 'Giving directions and advice.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      instructions:
        'Create a medium conversation (8-10 turns) where a tourist asks a local for directions to a museum. Include past tense ("I got lost"), future plans, and polite expressions.',
    },
  },
  {
    name: 'Advanced - Debate',
    description: 'Complex opinions and arguments.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      instructions:
        'Create a long conversation (12+ turns) between two colleagues debating remote work policies. Use subjunctive (opinions, doubts), conditional ("if we had..."), and formal register.',
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
