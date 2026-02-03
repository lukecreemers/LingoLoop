import { WMMOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE - Simplified to just instructions + context
// ============================================================================

export interface WMMInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE - All details come from instructions
// ============================================================================

export const WMM_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
Create a "Match the Columns" exercise for a {{userLevel}} {{targetLanguage}} student.

{{userProfile}}

### INSTRUCTIONS (contains all exercise specifications)
{{instructions}}

### LEVEL DEFAULTS (use if not specified in instructions)
- **Beginner:** 4-5 pairs, 2 distractors
- **Intermediate:** 6-8 pairs, 2-3 distractors
- **Advanced:** 8-10 pairs, 3 distractors

### CONSTRAINTS (CRITICAL)
1. **Column Labels:** Provide clear labels for Column A and Column B describing what each contains.
2. **Unique Matches:** Each Column A item has exactly ONE correct match in Column B. No ambiguity.
3. **Distractors:** Extra items in Column B that fit the theme but don't match any Column A item.
4. **Difficulty:** Distractors should be "near-misses" that test understanding, not random words.
5. **Balanced Length:** Items in each column should be roughly similar in length/complexity.
6. **Clear Instruction:** Provide a concise instruction explaining the matching task.
7. **Personalize:** Use vocabulary relevant to the learner's interests and goals where possible.

### OUTPUT FORMAT
Return JSON with "exercises" array. Each exercise has:
- columnLabels: { a: "Label A", b: "Label B" }
- pairs: Array of [columnA, columnB] tuples (correct matches)
- distractors: Array of extra Column B items with no match
- instruction: Brief instruction for the user
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const WMM_TEST_CASES: TestCase<WMMInputs>[] = [
  {
    name: 'Beginner - Verb to Translation',
    description: 'Match Spanish infinitives to English meanings.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      instructions:
        'Create a matching exercise: Spanish infinitive → English translation. Theme: common -ar verbs (hablar, trabajar, estudiar, caminar, cocinar). 5 pairs with 2 distractors (other English verbs that could confuse).',
    },
  },
  {
    name: 'Intermediate - Ser vs Estar Contexts',
    description: 'Match context descriptions to correct verb.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      instructions:
        'Create a matching exercise: Context/Situation → Correct verb (Ser or Estar). 6 pairs. Contexts should clearly trigger one verb (profession, origin for Ser; location, emotion, temporary state for Estar). 2 distractors (ambiguous contexts).',
    },
  },
  {
    name: 'Advanced - Subjunctive Triggers',
    description: 'Match trigger phrases to required mood.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      instructions:
        'Create a matching exercise: Trigger phrase → Mood required (Indicative/Subjunctive). Include phrases like "ojalá", "dudo que", "es obvio que", "cuando" (future), "aunque" (concessive). 8 pairs with 3 distractors.',
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
