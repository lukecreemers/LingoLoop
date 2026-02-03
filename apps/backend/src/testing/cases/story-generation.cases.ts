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
  targetLanguage: string;
  nativeLanguage: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const SG_PROMPT_TEMPLATE = `
### TASK
Generate a {{textLength}} {{textType}} in {{targetLanguage}} for a {{userLevel}} student (native {{nativeLanguage}}).

{{userProfile}}

### CONTEXT & TOPIC
{{instructions}}

### LENGTH GUIDE
- **short:** 3-5 sentences (~50-80 words)
- **medium:** 6-10 sentences (~100-150 words)
- **long:** 11-15 sentences (~180-250 words)

### CONSTRAINTS (CRITICAL)
1. **Level-Appropriate:** Use vocabulary and structures that match the {{userLevel}} level.
2. **Natural & Authentic:** Write exactly how a native speaker would write a {{textType}}. Avoid "textbook" language.
3. **Tone Consistency:** Ensure the tone (formal vs. informal) matches the specific requirements of a {{textType}}.
4. **Personalize:** Where possible, tailor content to the learner's interests and goals.
5. **Output:** Provide ONLY the text in {{targetLanguage}}.
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
      'A robot attempting a human routine - fun and engaging for beginners.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      textType: 'first-person retelling',
      textLength: 'short',
      instructions:
        'A robot named "Bip" describes his first morning trying to act like a human. Focus on his funny mistakes with everyday activities like breakfast and getting dressed.',
    },
  },

  // --------------------------------------------------------------------------
  // INTERMEDIATE: Noir & Alchemical Formats (Spanish/Italian)
  // --------------------------------------------------------------------------
  {
    name: 'Intermediate - The Neon Detective',
    description: 'Noir mystery with descriptive atmosphere.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      textType: 'detective noir monologue',
      textLength: 'medium',
      instructions:
        'A detective in a rainy, neon-lit city finds a mysterious glowing letter in a quiet cafe. Use past tense descriptions and create an atmospheric mood.',
    },
  },
  {
    name: "Intermediate - The Alchemist's Recipe",
    description: 'Instructional text with a mystical twist.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Italian',
      nativeLanguage: 'English',
      textType: 'ancient recipe instructions',
      textLength: 'medium',
      instructions:
        'Instructions for brewing a "Liquid Starlight" soup that changes the color of the sky. Use command forms and include mystical ingredients.',
    },
  },

  // --------------------------------------------------------------------------
  // ADVANCED: Dystopian & Steampunk Reports (Spanish)
  // --------------------------------------------------------------------------
  {
    name: 'Advanced - The Memory Architect',
    description: 'Philosophical reflection with complex grammar structures.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      textType: 'philosophical journal entry',
      textLength: 'long',
      instructions:
        'A "Memory Architect" reflects on a core childhood memory they accidentally deleted from the system. Use conditional and subjunctive structures to express regret and hypotheticals.',
    },
  },
  {
    name: 'Advanced - Steampunk News Report',
    description: 'Formal reporting in a creative steampunk setting.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      textType: 'newspaper front-page article',
      textLength: 'long',
      instructions:
        'A formal report from the year 1890 about the sighting of a massive mechanical whale in the Atlantic. Use passive constructions and formal register appropriate for 19th century journalism.',
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
