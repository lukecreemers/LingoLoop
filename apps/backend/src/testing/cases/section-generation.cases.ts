import { SecGenOutputSchema } from '../../shared/types/section-generation.types';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface SecGenInputs extends Record<
  string,
  string | number | string[]
> {
  userLevel: string;
  sectionInstruction: string;
  targetLanguage: string;
  nativeLanguage: string;
}

// ============================================================================
// UNIT TYPE REQUIREMENTS (what to include in instructions for each type)
// ============================================================================

const UNIT_REQUIREMENTS = `
### UNIT TYPES (use these EXACT type names)

When generating units, the "instructions" field must contain ALL details the sub-agent needs.

---

**flashcard** - Vocabulary flashcards
Include: theme, card count (4-6 beginner, 6-10 other), whether to include examples
Example instructions: "Generate 5 flashcards for basic greeting vocabulary. Include example sentences."

**explanation** - Explain ONE concept
Include: exact topic, aspects to cover, depth appropriate to level
Example instructions: "Explain ser vs estar for beginners. Focus on: ser=permanent, estar=temporary."

**fill_in_blanks** - Multiple-choice fill-in
Include: grammar focus, sentence count (3-5), blanks per sentence (1-2), distractor type
Example instructions: "Create 4 fill-in-blank sentences testing ser vs estar. 1 blank each. Distractors: the other verb."

**word_match** - Matching exercise
Include: match type, theme, pair count (4-8), distractor count (2-3)
Example instructions: "Match Spanish infinitive → English meaning. Theme: -ar verbs. 6 pairs, 2 distractors."

**write_in_blanks** - User types answer (no choices)
Include: grammar target, sentence count (2-4), blanks per sentence (1-2), clue format
Example instructions: "Create 3 sentences for -ar verb conjugation. 1 blank each. Provide infinitive as clue."

**translation** - Translate paragraph/sentences
Include: theme, direction (Spanish→English or English→Spanish), sentence count (1-4)
Example instructions: "Generate 2 sentences about daily routines. Translate English to Spanish. Beginner vocabulary."

**conversation** - Scripted dialogue
Include: situation, turn count (4-6 short, 8-10 medium, 12+ long), vocab/grammar to use
Example instructions: "Create medium conversation (8 turns) at a coffee shop. Use greetings and 'querer'."

**writing_practice** - Open-ended prompts
Include: topic, prompt count (2-3), expected response length
Example instructions: "Generate 2 writing prompts about daily routines. Expect 2-3 sentence responses."

**word_order** - Unscramble words
Include: theme/grammar focus, sentence count (4-7), complexity hint
Example instructions: "Create 5 word-order sentences for question formation. 5-6 words each."

---
`.trim();

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const SECGEN_PROMPT_TEMPLATE = `
### ROLE
You are Stage 2 of a lesson generation system. You receive a section instruction from Stage 1 (Topic Breakdown) and must generate specific learning units for that section.

### USER PROFILE
- Level: {{userLevel}}
- Target: {{targetLanguage}} / Native: {{nativeLanguage}}

### SECTION INSTRUCTION
{{sectionInstruction}}

---
${UNIT_REQUIREMENTS}
---

### YOUR TASK

Generate a sequence of units for this section. Each unit needs:
1. **type**: One of the unit types above
2. **instructions**: A COMPLETE instruction string with ALL required details

Follow this learning flow:
1. **Introduce** (explanation or flashcard) - Set context, teach the rule/vocab
2. **Drill** (fill in blanks, word match, write in blanks, word order) - Practice with guardrails
3. **Produce** (translation, writing practice, conversation) - Use in context

### LEVEL-SPECIFIC DEFAULTS (use these unless section instruction specifies otherwise)

**Beginner:**
- Flashcard: 4-5 cards
- FIB/WIB: 3 sentences, 1 blank each
- Word match: 4-5 pairs, 2 distractors
- Translation: 1-2 short sentences
- Conversation: short (4-6 turns)
- Writing: 2 prompts, short responses
- Word order: 4-5 simple sentences

**Intermediate:**
- Flashcard: 6-8 cards
- FIB/WIB: 4 sentences, 1-2 blanks each
- Word match: 6-8 pairs, 2-3 distractors
- Translation: 2-3 sentences
- Conversation: medium (8-10 turns)
- Writing: 2-3 prompts, medium responses
- Word order: 5-6 sentences

**Advanced:**
- Flashcard: 8-10 cards
- FIB/WIB: 5 sentences, 2 blanks each
- Word match: 8-10 pairs, 3 distractors
- Translation: 3-4 sentences
- Conversation: long (12+ turns)
- Writing: 3 prompts, longer responses
- Word order: 6-8 complex sentences

### RULES
- Be SPECIFIC in your instructions - include ALL required details from the requirements above
- Each unit's instructions must be self-contained (sub-agent sees ONLY the instructions)
- Include the user's level context when relevant to the unit
- For bridging/final sections, include more production units (translation, writing, conversation)

### OUTPUT FORMAT
Return JSON with "units" array. Each unit has "type" and "instructions" fields only.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const SECGEN_TEST_CASES: TestCase<SecGenInputs>[] = [
  {
    name: 'Beginner - Ser Introduction Section',
    description:
      'First section of a Ser vs Estar lesson - introducing Ser only.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      sectionInstruction:
        'Section 1: You are the first section in a Ser vs Estar lesson. Introduce the verb Ser and explain its fundamental uses for a beginner.',
    },
  },
  {
    name: 'Beginner - Estar Introduction Section',
    description: 'Second section - introducing Estar after Ser.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      sectionInstruction:
        'Section 2: You are the second section in a Ser vs Estar lesson. The user has already learnt about Ser. Introduce the verb Estar and explain its fundamental uses.',
    },
  },
  {
    name: 'Beginner - Ser vs Estar Bridge Section',
    description: 'Final bridging section combining both verbs.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      sectionInstruction:
        'Section 3: You are the final section in a Ser vs Estar lesson. The user has learnt both verbs in isolation and now needs to practice using both of them and choosing between the correct verb.',
    },
  },
  {
    name: 'Intermediate - Por for Cause/Reason',
    description: 'One section from a Por vs Para breakdown.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      sectionInstruction:
        'Section focusing on Por for expressing cause, reason, and motivation. The user will later learn Para for purpose/goal, so focus only on Por here.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const SECGEN_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const SECGEN_TEST_CONFIG: PromptTestConfig<SecGenInputs, unknown> = {
  featureName: 'Section Generation',
  promptTemplate: SECGEN_PROMPT_TEMPLATE,
  outputSchema: SecGenOutputSchema,
  testCases: SECGEN_TEST_CASES,
  models: SECGEN_MODELS,
};
