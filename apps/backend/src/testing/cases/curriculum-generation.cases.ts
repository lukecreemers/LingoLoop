import { z } from 'zod';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface CurriculumInputs extends Record<
  string,
  string | number | string[]
> {
  userGoal: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const CURRICULUM_PROMPT_TEMPLATE = `
You are going to be given a user goal, I want you to take this and give a week by week breakdown (do not combine multiple weeks into one) on how to get there.

Assume 4 weeks per month, include 5 lessons per week for the individual lessons that need to be covered. Typically include a review lesson as the last lesson of each week that combines all the learnings of that week. These lessons are supposed to be around 15-20 minutes long and are supposed to contain a mixture of introducing concept, testing it, combining with past things the user knows, etc. Thus each lesson must be an acceptable topic for a user to learn for this length of time. If lessons are to review content, be specific about what they are reviewing (do not simply say reviewing week or month, specify the concepts in detail).

# LIMITATIONS OF LESSONS #

Lessons are AI generated, and thus can only do so much. They can explain things, run activities which are mostly reading, flashcards, production (writing and translation exercises) and fill in the blank type exercises.

A lesson should cover specifically a new idea or concept and should allow for a combination of these things. Avoid lessons that involve listening or speaking. They should be grounded in a way that the user can actively learn and practice using the before mentioned activities.

Only include output specified below and do not include any trailing or leading information. Output in XML format.

Your output should be structured as follows:

<curriculum>

<Month name="THEME OF THIS MONTH" description="2-3 SENTENCE DESCRIPTION OF WHAT THIS MONTH IS ABOUT">

<Week name="THEME OF THIS WEEK" description="2-3 SENTENCE DESCRIPTION OF WHAT THIS WEEK IS ABOUT">

<Lesson name="NAME OF LESSON">
- Bullet point 1 discussing what the lesson covers
- Bullet point 2 discussing what the lesson covers
- Bullet point 3 discussing what the lesson covers
- Bullet point 4 discussing what the lesson covers
</Lesson>

</Week>

</Month>

</curriculum>

## USER GOAL

{{userGoal}}
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const CURRICULUM_TEST_CASES: TestCase<CurriculumInputs>[] = [
  {
    name: 'Complete Beginner Spanish - 1 months',
    description: 'Starting from zero to basic survival Spanish.',
    inputs: {
      userGoal: `I am a complete beginner in Spanish. I have 1 month before a trip to Mexico and want to be able to have basic conversations - ordering food, asking directions, introducing myself, and understanding simple responses. I have about 30 minutes per day to study.`,
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const CURRICULUM_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 1,
  },
];

// ============================================================================
// EXPORT CONFIG (uses raw text output for XML)
// ============================================================================

const RawXmlOutputSchema = z.string();

export const CURRICULUM_TEST_CONFIG: PromptTestConfig<
  CurriculumInputs,
  string
> = {
  featureName: 'Curriculum Generation (XML)',
  promptTemplate: CURRICULUM_PROMPT_TEMPLATE,
  outputSchema: RawXmlOutputSchema,
  testCases: CURRICULUM_TEST_CASES,
  models: CURRICULUM_MODELS,
  useRawTextOutput: true,
};
