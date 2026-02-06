import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';
import { EXOutput, EXOutputSchema } from '../../shared/types/explanation.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface CTXInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  instructions: string;
}

// ============================================================================
// PROMPT TEMPLATE
// Context unit: Introduces the topic to the user at the start of a lesson.
// Gives them a heads-up about what they'll learn and what to expect.
// ============================================================================

export const CTX_PROMPT_TEMPLATE = `
{{lessonPlanContext}}
### TASK
You are introducing a language lesson to a {{userLevel}} level student learning {{targetLanguage}}.

Write a short, welcoming introduction that tells the student:
1. What this lesson is about (the topic)
2. What they will learn / practice
3. What to expect in terms of activities (briefly)

This is NOT an explanation of grammar or vocabulary — it's a friendly overview/preview of the lesson ahead. Think of it like a teacher saying "Today we're going to..." at the start of class.

{{userProfile}}

### INSTRUCTIONS
{{instructions}}

### GUIDELINES
- Keep it short and motivating (3-6 sentences max)
- Use a warm, encouraging tone
- Be specific about what topics/skills will be covered
- Do NOT teach any content yet — just preview it
- Write in the student's native language (English by default)
- Use Markdown formatting (bold key topics)

Write the context introduction directly in Markdown format.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const CTX_TEST_CASES: TestCase<CTXInputs>[] = [
  {
    name: 'Beginner - Greetings Intro',
    description: 'Introduction to a beginner lesson on greetings.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      instructions:
        'Introduce a lesson about basic Spanish greetings and introductions. The lesson will cover phrases like Hola, Buenos días, Me llamo, and Mucho gusto. Activities include flashcards, fill-in-the-blanks, and a practice conversation.',
    },
  },
  {
    name: 'Intermediate - Past Tense',
    description: 'Introduction to preterite vs imperfect lesson.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      instructions:
        'Introduce a lesson about using preterite and imperfect tenses together in storytelling. The lesson will cover when to use each tense, practice with fill-in exercises, and end with a translation challenge.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const CTX_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.3,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const CTX_TEST_CONFIG: PromptTestConfig<CTXInputs, EXOutput> = {
  featureName: 'Context Generation',
  promptTemplate: CTX_PROMPT_TEMPLATE,
  outputSchema: EXOutputSchema,
  testCases: CTX_TEST_CASES,
  models: CTX_MODELS,
  useRawTextOutput: true,
};

