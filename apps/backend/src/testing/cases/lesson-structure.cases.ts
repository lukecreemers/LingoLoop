import { z } from 'zod';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface LessonStructureInputs extends Record<
  string,
  string | number | string[]
> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  userInfo: string;
  weekSummary: string;
  previousWeekSummary: string;
  lessonOverview: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const LESSON_STRUCTURE_PROMPT_TEMPLATE = `
You're an agent in a pipeline creating a custom language learning lesson. You will be given a lesson instruction (what the lesson is about), then you are to decide how to structure the lesson into logical components.

The components you have available are as follows:

**flashcard** - Vocabulary flashcards

**explanation** - Explain a concept

**fill_in_blanks** - Multiple-choice fill-in

**word_match** - Matching exercise (2 columns)

**write_in_blanks** - User types answer (no choices)

**translation** - Translate paragraph/sentences

**conversation** - Scripted dialogue between 2 characters.

**writing_practice** - Open-ended prompts

**word_order** - Unscramble words

Structure the lesson logically using these components. You can use components multiple times, and get a good mix of them all. You do not need to use every unit, and should tailor them to user level, e.g. writing and translation practice should really only be for upper beginner and above users. Tailor easier units to beginner users.
For beginner users, anytime you want them to do production priotise word order, write in blanks and super basic translation exercises.
Notes: If you provide an explanation, the next unit should always be testing this.

If you need to introduce vocabulary for a lesson or section of lesson that aren't related to the lesson focus and will probably naturally appear throughout lesson (e.g. if the lesson focus is on how to ask questions to order food, start with a flashcard section with a bunch of food names), do this before section or lesson with a flashcard exercise. This is particularly important for beginners.

If you need to introduce multiple concepts, its good to split things up into sections (explanation -> practice -> repeat)

You will also be given a user level. Also, this lesson is part of a weekly theme on the journey to a long term goal. You will be given the lessons they have learnt this week already, along with the previous weekly themes they have learnt, keep this in mind when structuring lesson.

## User Info

{{userInfo}}

## What they have learnt this week:

{{weekSummary}}

## What they have learnt in previous weeks:

{{previousWeekSummary}}

## Current lesson

{{lessonOverview}}

### OUTPUT STRUCTURE (in XML please)

<lesson>

<unit type="unit_type" name="display name for unit">Detailed instructions for the unit generator</unit>

</lesson>
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const LESSON_STRUCTURE_TEST_CASES: TestCase<LessonStructureInputs>[] = [
  {
    name: 'Beginner - AR Verb Introduction',
    description: 'First lesson on AR verbs for a beginner.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      userInfo: `Level: beginner
Target Language: Spanish
Native Language: English
Learning Goal: Learn conversational Spanish for travel`,
      weekSummary:
        'This is the first lesson of the week. No previous lessons yet.',
      previousWeekSummary: `Week 1: Foundation & Essentials - Learned basic greetings, introductions, numbers 1-20, and survival phrases.`,
      lessonOverview: `Lesson Title: AR Verb Basics
Description: Introduce the -AR verb conjugation pattern. Focus on the 6 forms (yo, tú, él/ella, nosotros, vosotros, ellos). Start with high-frequency verbs: hablar, cantar, bailar, trabajar.`,
    },
  },
  {
    name: 'Beginner - Ser vs Estar First Lesson',
    description: 'Introduction to the concept of two "to be" verbs.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      userInfo: `Level: beginner
Target Language: Spanish
Native Language: English
Learning Goal: Learn conversational Spanish for travel`,
      weekSummary:
        'This is the first lesson of the week. No previous lessons yet.',
      previousWeekSummary: `Week 1: Foundation & Essentials - Learned basic greetings, introductions, numbers 1-20.
Week 2: Present Tense Mastery - Mastered regular -AR, -ER, -IR verb conjugations.`,
      lessonOverview: `Lesson Title: Introduction to Ser & Estar
Description: Introduce the concept that Spanish has two "to be" verbs. Explain when to use each at a high level (permanent vs temporary, identity vs state). Focus on conjugations of both verbs.`,
    },
  },
  {
    name: 'Intermediate - Preterite vs Imperfect',
    description: 'Complex grammar topic for intermediate learner.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      userInfo: `Level: intermediate
Target Language: Spanish
Native Language: English
Learning Goal: Become conversationally fluent, able to discuss past events and tell stories`,
      weekSummary: `Lesson 1: Preterite Basics - Reviewed preterite conjugations and uses for completed actions.
Lesson 2: Imperfect Basics - Reviewed imperfect conjugations and uses for ongoing/habitual past.`,
      previousWeekSummary: `Week 1: Past Tense Foundations - Learned preterite conjugations for regular verbs.
Week 2: Irregular Preterites - Mastered common irregular verbs (ir, ser, hacer, tener).`,
      lessonOverview: `Lesson Title: Combining Preterite & Imperfect
Description: Learn to use preterite and imperfect together in storytelling. Understand the "background vs action" model where imperfect sets the scene and preterite describes events.`,
    },
  },
  {
    name: 'Advanced - Subjunctive Triggers',
    description: 'Advanced grammar with nuance.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      userInfo: `Level: advanced
Target Language: Spanish
Native Language: English
Learning Goal: Master complex grammar and sound natural in conversations`,
      weekSummary: `Lesson 1: Subjunctive Forms - Reviewed present subjunctive conjugations.
Lesson 2: WEIRDO Overview - Learned the WEIRDO acronym for subjunctive triggers.`,
      previousWeekSummary: `Previous weeks covered all indicative tenses, conditional, and introduced subjunctive concept.`,
      lessonOverview: `Lesson Title: Wishes & Emotions Triggers
Description: Deep dive into subjunctive triggers related to Wishes (querer que, esperar que, desear que) and Emotions (alegrarse de que, tener miedo de que, sorprender que). Practice recognizing and using these patterns.`,
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const LESSON_STRUCTURE_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6,
  },
];

// ============================================================================
// EXPORT CONFIG (uses raw text output for XML)
// ============================================================================

// Dummy schema since we use raw text output
const RawXmlOutputSchema = z.string();

export const LESSON_STRUCTURE_TEST_CONFIG: PromptTestConfig<
  LessonStructureInputs,
  string
> = {
  featureName: 'Lesson Structure (XML)',
  promptTemplate: LESSON_STRUCTURE_PROMPT_TEMPLATE,
  outputSchema: RawXmlOutputSchema,
  testCases: LESSON_STRUCTURE_TEST_CASES,
  models: LESSON_STRUCTURE_MODELS,
  useRawTextOutput: true, // Important: XML output, not JSON
};
