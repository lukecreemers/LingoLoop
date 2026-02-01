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
### AVAILABLE UNIT TYPES AND SUB-AGENT REQUIREMENTS

**1. flashcard (FC Agent)**
Generates vocabulary flashcards for introducing and memorizing new words or phrases.
- instructions: The vocabulary theme or specific words/phrases to teach (e.g., "Basic greetings", "Food vocabulary", "Numbers 1-20").
- cardCount: Number of cards (typically 5-10 for beginners, up to 15 for advanced).
*Critical Goal: VOCABULARY INTRODUCTION. Use this early in lessons to introduce new words BEFORE exercises that use them. Cards include term, definition, and optional example sentences. This is purely for learning/memorization, not testing.*

**2. explanation (EX Agent)**
Generates a clear, pedagogical explanation in English about a specific linguistic concept.
- instructions: The topic or concept to explain (e.g., "The difference between Por and Para", "When to use the subjunctive in relative clauses").
*Critical Goal: Level-appropriate clarity. Beginners get simple language with 2-3 examples; Advanced gets nuance, regional variations, and linguistic comparisons. Use this BEFORE drilling exercises to set context.*

**3. fill in the blanks (FIB Agent)**
A deterministic grammar/vocabulary test with multiple-choice options.
- instructions: A STRICT grammar focus (e.g., "Preterite of irregular verbs" or "Direct object pronouns").
- blankAmount: Number of [ * ] blanks per sentence. 
- distractorInstructions: Logic for "near-miss" distractors (e.g., "use same verb in different person" or "use synonyms that don't fit the gender").
- distractorCount: Typically 2-4 distractors per blank.
*Critical Goal: Zero Ambiguity. Sentences must be written so that only the correct answer is logically possible.*

**4. word meaning match (WMM Agent)**
A matching exercise for vocabulary or grammatical associations.
- matchType: The relationship (e.g., "Infinitive → English", "Noun → Correct Article", "Opposites").
- theme: Thematic grouping (e.g., "Kitchen vocabulary", "Emotions").
- pairCount: Number of correct matches (5-10).
- distractorCount: "Near-miss" items that fit the theme but have no match (2-4).
*Critical Goal: Column items must be balanced in complexity to prevent guessing by length.*

**5. write in the blanks (WIB Agent)**
High-stakes production where the user types the answer based on a clue.
- instructions: The specific word/grammar target (e.g., "Reflexive verbs in present tense").
- blankAmount: Number of [ * ] blanks.
*Critical Goal: Clue Integration. Every blank must have a root word/clue (e.g., an infinitive) provided in the instructions so the user knows what to transform.*

**6. translation (TG Agent)**
Generates a unified paragraph (not disconnected sentences) for the user to translate.
- instructions: A coherent theme or topic for the paragraph.
- sentenceCount: Typically 1-2 sentences but longer if requested.
- startingLanguage: The language the user reads.
- languageToTranslateTo: The language the user must type in.
*Critical Goal: The paragraph must read like native speech and maintain a unified thematic thread.*

**7. conversation (CG Agent)**
Generates a script between two distinct characters. 
- instructions: A specific situation or conflict (e.g., "Arguing over a late train").
- conversationLength: "short" (4-6 turns), "medium" (8-12 turns), or "long" (14-20 turns).
*Critical Goal: The agent will create names, ages, and genders for characters. Instructions should hint at the dynamic between them.*

**8. writing practice (WP Agent)**
Open-ended writing exercise where the user responds to prompts in the target language, then receives AI-powered feedback.
- instructions: The topic or theme for writing prompts (e.g., "Daily routines", "Opinion on technology", "Describe a memorable experience").
- promptCount: Number of writing prompts to generate (typically 2-4).
*Critical Goal: FREE-FORM PRODUCTION. This is the highest level of language production - users write complete responses that get marked for grammar, vocabulary, and communication. Use at the END of a lesson to consolidate learning. For beginners, keep prompts simple (describe, list). For advanced, include opinion and hypothetical prompts.*
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

1.  **ATOMIC EXPLANATION:** An 'explanation' unit limited to ONE specific rule or use case. (e.g., "Ser for Professions" only).
2.  **VOCABULARY PRIMING (Optional):** If new vocabulary is being taught, start with a 'flashcard' unit to introduce the key words. This is especially important for beginners or when introducing a new topic with unfamiliar terms.
3.  **TARGETED DRILL:** atleast 2 low-stakes units (FIB or WMM) that test ONLY the rule just explained.
4.  **PRODUCTION:** Either a WIB or TG unit that forces the user to use the rule in context.

At the end of all loops do an **INTEGRATION (The Bridge):** After 2-3 loops, provide atleast 2 "Production" units (WIB, TG, or CG) that forces the user to use all sub-concepts together in context.

### ATOMIC BREAKDOWN RULES
- **Concept Isolation:** Never introduce two different grammar rules in the same 'explanation' unit.
- **Immediate Validation:** Every 'explanation' MUST be immediately followed by a 'fill in the blanks' or 'word meaning match' with very explicit instructions on what to focus on.
- **Complexity Cap:** For beginner students, ensure the vocabulary in early loops is extremely simple so they can focus 100% on the grammar mechanic.

### LEVEL-SPECIFIC CONSTRAINTS
- **Beginner:** Focus on 2 loops max. Conversation MUST be "short". For production units, avoid TG and CG and priotise just exremely short and targeted WIB units (only 1 blank).
- **Intermediate:** Focus on 2-3 loops. Mixed production is key, keep.
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
