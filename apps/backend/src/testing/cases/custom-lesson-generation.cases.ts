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

**1. story (SG Agent)**
Generates a cohesive, level-appropriate text. You must provide a clear "Scenario" and "Tone."
- instructions: Detailed plot, characters, or specific topics. Focus on narrative or informative context.
- textType: Specific format (e.g., "news article", "formal email", "blog post", "short story").
- length: "short" (3-5 sentences), "medium" (6-10 sentences), or "long" (11-15 sentences).
*Critical Goal: Ensure tone consistency (formal/informal) and authentic, non-textbook language.*

**2. conversation (CG Agent)**
Generates a script between two distinct characters. 
- instructions: A specific situation or conflict (e.g., "Arguing over a late train").
- conversationLength: "short" (4-6 turns), "medium" (8-12 turns), or "long" (14-20 turns).
*Critical Goal: The agent will create names, ages, and genders for characters. Instructions should hint at the dynamic between them.*

**3. fill in the blanks (FIB Agent)**
A deterministic grammar/vocabulary test with multiple-choice options.
- instructions: A STRICTURE grammar focus (e.g., "Preterite of irregular verbs" or "Direct object pronouns").
- blankAmount: Number of [ * ] blanks per sentence. 
- distractorInstructions: Logic for "near-miss" distractors (e.g., "use same verb in different person" or "use synonyms that don't fit the gender").
- distractorCount: Typically 2-4 distractors per blank.
*Critical Goal: Zero Ambiguity. Sentences must be written so that only the correct answer is logically possible.*

**4. translation (TG Agent)**
Generates a unified paragraph (not disconnected sentences) for the user to translate.
- instructions: A coherent theme or topic for the paragraph.
- sentenceCount: Typically 3-6 sentences.
- startingLanguage: The language the user reads.
- languageToTranslateTo: The language the user must type in.
*Critical Goal: The paragraph must read like native speech and maintain a unified thematic thread.*

**5. word meaning match (WMM Agent)**
A matching exercise for vocabulary or grammatical associations.
- matchType: The relationship (e.g., "Infinitive → English", "Noun → Correct Article", "Opposites").
- theme: Thematic grouping (e.g., "Kitchen vocabulary", "Emotions").
- pairCount: Number of correct matches (5-10).
- distractorCount: "Near-miss" items that fit the theme but have no match (2-4).
*Critical Goal: Column items must be balanced in complexity to prevent guessing by length.*

**6. write in the blanks (WIB Agent)**
High-stakes production where the user types the answer based on a clue.
- instructions: The specific word/grammar target (e.g., "Reflexive verbs in present tense").
- blankAmount: Number of [ * ] blanks.
*Critical Goal: Clue Integration. Every blank must have a root word/clue (e.g., an infinitive) provided in the instructions so the user knows what to transform.*
`.trim();

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const CLG_PROMPT_TEMPLATE = `
### ROLE
You are part of a pipeline creating a custom lesson plan for a {{targetLanguage}} student. You will be passed instructions on what the custom lesson needs to be about, and create a sequence of learning units along with their instructions that specialized sub-agents will execute.

### USER PROFILE
- **Level:** {{userLevel}}
- **Target Language:** {{targetLanguage}}
- **Native Language:** {{nativeLanguage}}

### LESSON REQUEST
{{instructions}}

${UNIT_EXPLANATIONS}

### YOUR TASK
Design a lesson plan by outputting an array of units. This array needs to be in a logical order that will help the user understand the concept as best as possible. Each unit should:
1. Be appropriate for the user's level ({{userLevel}})
2. Build logically on previous units (e.g., introduce vocabulary before testing it)
3. Include clear, specific instructions for the sub-agent
4. Use varied unit types to keep the lesson engaging

## CONSTRAINTS
Pedagogical Flow: Use a logical flow in terms of unit order to optimize user learning
Unit Understanding: The subagents only have the context that you feed it, thus you need to be extremely clear in your instructions.
Keep the units varied and engaging (you are welcome to be creative with prompts particularly for story and conversation generation, keeping in mind user level).
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

  // --------------------------------------------------------------------------
  // INTERMEDIATE: Logic & Mechanics
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - Past Tense Contrast',
    description: 'High-stakes grammar. Tests narrative sequencing.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on the contrast between the preterite and imperfect tenses, focusing on how to set a scene versus describing completed actions.',
    },
  },
  {
    name: 'Intermediate - Business Etiquette',
    description: 'Tests formality registers and professional vocabulary.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'French',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on professional email writing, focusing specifically on formal salutations, polite requests, and standard sign-off conventions.',
    },
  },

  // --------------------------------------------------------------------------
  // ADVANCED: Nuance & Depth
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - Subjunctive Mastery',
    description:
      'Complex logic. Tests if the model creates high-precision exercises.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on the subjunctive mood in relative clauses and hypothetical "Si" statements where the outcome is unlikely.',
    },
  },
  {
    name: 'Advanced - Sociopolitical Debate',
    description: 'Tests abstract vocabulary and formal discourse markers.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on discussing climate change and economic policy, focusing on sophisticated connectors for debating and expressing nuance.',
    },
  },

  // --------------------------------------------------------------------------
  // EDGE CASES: Stress Tests
  // --------------------------------------------------------------------------
  {
    name: 'Edge Case - The Irregular Triple-Threat',
    description:
      'Tests if the model can handle a very specific, high-density verb drill.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson on how to conjugate "hacer," "ir," and "ser" in both the imperfect and preterite tenses.',
    },
  },
  {
    name: 'Edge Case - Hyper-Niche Survival',
    description:
      'Tests if the model respects a very narrow scope without adding "fluff."',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Japanese',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson strictly on the vocabulary and phrases required to order ramen and beer in a social setting.',
    },
  },
  {
    name: 'Edge Case - Multimodal Weakness Remediation',
    description:
      'Tests if the model can pivot unit selection based on specific skill deficits.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Portuguese',
      nativeLanguage: 'English',
      instructions:
        'Create a custom lesson that remediates weak listening comprehension and speaking skills by leveraging the user’s strong reading ability.',
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
