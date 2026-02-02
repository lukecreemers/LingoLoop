import { CLGOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface CLGInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  targetLanguage: string;
  nativeLanguage: string;
}

// ============================================================================
// UNIT TYPE EXPLANATIONS (INJECTED INTO PROMPT)
// ============================================================================

const UNIT_EXPLANATIONS = `
### AVAILABLE UNIT TYPES (use these EXACT type names)

**flashcard** - Vocabulary flashcards for introducing words/phrases.
Include in instructions: theme, card count (5-10 beginner, up to 15 advanced)

**explanation** - Clear explanation of ONE linguistic concept.
Include in instructions: the specific topic/rule to explain

**fill_in_blanks** - Multiple-choice grammar/vocab test.
Include in instructions: grammar focus, blank count, distractor type, distractor count

**word_match** - Matching exercise for vocab/grammar associations.
Include in instructions: match type, theme, pair count (5-10), distractor count (2-4)

**write_in_blanks** - User types answer based on a clue (no choices).
Include in instructions: grammar target, blank count, clue format

**translation** - Translate a coherent paragraph.
Include in instructions: theme, sentence count, starting language, target language

**conversation** - Dialogue between characters.
Include in instructions: situation, length (short/medium/long)

**writing_practice** - Open-ended writing with AI feedback.
Include in instructions: topic/theme, prompt count (2-4)

**word_order** - Unscramble words into correct order.
Include in instructions: theme/grammar focus, sentence count (5-8)
`.trim();

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const CLG_PROMPT_TEMPLATE = `
### ROLE
You are a Senior Pedagogical Director specializing in Micro-Learning. Your task is to break down complex linguistic requests into a series of "Atomic Learning Loops."

### USER PROFILE
- Level: {{userLevel}}
- Target: {{targetLanguage}} / Native: {{nativeLanguage}}

### PEDAGOGICAL STRATEGY (The "Micro-Loop")
If the concept is complex relative to the users level, do NOT explain everything at once. Instead, break the {{instructions}} into 2-3 granular sub-concepts. For each sub-concept, generate a "Loop":

1.  **ATOMIC EXPLANATION:** An 'explanation' unit limited to ONE specific rule or use case. (e.g., "Ser for Professions" only) typically start with this.
2.  **VOCABULARY PRIMING (Optional):** If new vocabulary is being taught, after the explantion have a 'flashcard' unit to introduce the key words. This is especially important for beginners or when introducing a new topic with unfamiliar terms.
3.  **TARGETED DRILL:** atleast 2 low-stakes units (combination of FIB, WMM or WIB) that test ONLY the rule just explained.
4.  **PRODUCTION:** Either a very relevant writing_practice answering a prompt or translation unit that forces the user to use the rule in context.


At the end of all loops do an **INTEGRATION (The Bridge):** After 2-3 loops, provide atleast 2 "Production" units (WIB, TG, or CG) that forces the user to use all sub-concepts together in context.

### ATOMIC BREAKDOWN RULES
- **Concept Isolation:** Never introduce two different grammar rules in the same 'explanation' unit.
- **Immediate Validation:** Every 'explanation' MUST be immediately followed by a 'fill_in_blanks' or 'word_match' with very explicit instructions on what to focus on.
- **Complexity Cap:** For beginner students, ensure the vocabulary in early loops is extremely simple so they can focus 100% on the grammar mechanic.

### LEVEL-SPECIFIC CONSTRAINTS
- **Beginner:** Focus on 2 loops max. Conversation MUST be "short". For production units, avoid translation and conversation and priotise just exremely short and targeted write_in_blanks units and writing_practice units (only 1 blank).
- **Intermediate:** Focus on 2-3 loops. Mixed production is key, include higher amounts of writing_practice units and translation units.
- **Advanced:** 6-8 units. Loops should cover subtle nuances or regionalisms.

### LESSON REQUEST
{{instructions}}

---
### TOOLKIT: AVAILABLE UNIT TYPES
${UNIT_EXPLANATIONS}
---

### YOUR TASK
1.  **Deconstruct:** If needed break the lesson request into 2-3 atomic sub-concepts.
2.  **Sequence:** Build the lesson using the "Loop" structure: [Exp 1 -> Drill 1 -> Exp 2 -> Drill 2 -> Integration].
3.  **Precision:** Ensure the 'instructions' for the drills specify exactly which sub-concept to focus on and are very specific.
4.  **REUSE:** You are encouraged to use the same unit type (like FIB) multiple times if it serves different loops.

### OUTPUT FORMAT
Return a JSON array of unit objects.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const CLG_TEST_CASES: TestCase<CLGInputs>[] = [
  // --------------------------------------------------------------------------
  // BEGINNER: Core Foundations
  // --------------------------------------------------------------------------
  {
    name: 'Beginner - Basic Introductions',
    description: 'Tests baseline unit selection for essential social skills.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on common introductions, greeting people in different social settings, and asking/answering basic personal questions.',
    },
  },
  {
    name: 'Beginner - Numbers & Time',
    description:
      'Tests if model handles high-density concrete vocabulary without getting abstract.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on cardinal numbers 1-20 and the fundamental phrasing for telling time and identifying the time of day.',
    },
  },
  {
    name: 'Beginner - Ser vs Estar',
    description:
      'Classic beginner hurdle. Tests if the model can explain and drill the conceptual difference.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on the differences between "ser" and "estar," focusing on permanent vs. temporary states.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const CLG_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6, // Slightly lower for structured planning
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const CLG_TEST_CONFIG: PromptTestConfig<CLGInputs, unknown> = {
  featureName: 'Custom Lesson Generation',
  promptTemplate: CLG_PROMPT_TEMPLATE,
  outputSchema: CLGOutputSchema,
  testCases: CLG_TEST_CASES,
  models: CLG_MODELS,
};
