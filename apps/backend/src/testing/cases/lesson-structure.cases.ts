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
Explanation/reading units:
**context** - Used at beginning of lesson to let the user know what the plan is and what the user will be learning.
**explanation** - Explain a concept.
**conversation** - Scripted dialogue between 2 characters.

Level 1 difficulty units:
**flashcard** - Vocabulary flashcards
**word_match** - Matching exercise (2 columns filled with words with matching pairs)
**fill_in_blanks** - Multiple-choice fill-in

Level 2 difficulty units:
**write_in_blanks** - User types answer in blanks (no choices)
**word_order** - Unscramble words

Level 3 difficulty units:
**translation** - Translate paragraph/sentences
**writing_practice** - Open-ended prompts



Structure the lesson logically using these components. 
To structure a lesson, first understand the users level and the complexity of the topic. Then break the topic down (if necessary) into bitesize learning sections. The goal is to never overwhelm the user with information but instead introduce concepts and things slowly and in a logical order, before combining elements together and testing the user. 

Your process should be the following: Split the topic into bitesized sections (however many necessary, usually 2-3). For each section, start with an explanation, then followed by 2 level 1 difficulty units, then 1 level 2 difficulty unit. Repeat for each section. Then finish with a review section, which is a combination of level 2 and 3 difficulty units (ramp up in difficulty.)

Couple of things to note, if the lesson is introducing vocab or new phrases, use flashcards, HOWEVER only ever introduce max 5-10 words per section, and always test the user with other units specifically to help the user learn these words. NEVER have multiple flashcard sections in a row. Think, what is possible for a user to learn in one sitting. 

For the level 3 difficulty units, you need to be careful specifcally for superbeginners. Think what is possible for a superbeginner to write, keep it simple, easy, and strictly adhering to the lessons structure and content. 

Reinforce sections or end with conversations. 

You will be given a user level and profile. Also, this lesson is part of a weekly theme on the journey to a long term goal. You will be given the lessons they have learnt this week already, along with the previous weekly themes they have learnt, keep this in mind when structuring lesson.

Keep in mind your goal is to just describe what each section is covering, there are agents that take these instructions to create more in depth units. E.g. for explanation, you do not need to provide full explanation, instead provide information for what thje explanation needs to cover.

## Specific unit instruction notes
Some units are a bit finnicky with there instructions and thus require more specific instructions... 
- Fill in blanks and write in blanks need you to specifcy specifcally what words are to be blanked (filled in by user) as with unclear instructions the units can choose random words. Be more descriptive when talking about what the blanks should be (things like subject, or tense often are assumed)
- Translation and Writing practice: They create a number of exercises, so sometimes if you say write 5 sentences (intending to mean 5 seperate sentences) they make every exercise 5 senteces. So for wording make sure you know that difference.
- Writing practice: THis can create multiple exercises aswell, but often gets confused by sentences and exercises wording like translation, So if you want the user to answer multiple different questions, specify how many exercises you want this spread out across (sometimes its good for a single exercise to require the user to do multiple things.)
- Context: This is only for the beginning of the lesson and should ALWAYS be wrapped in its own section.
## User Info

{{userInfo}}

## What they have learnt this week:

{{weekSummary}}

## What they have learnt in previous weeks:

{{previousWeekSummary}}

## Current lesson

{{lessonOverview}}

### OUTPUT STRUCTURE (in XML please)

You MUST wrap units inside <section> tags. Each section groups related units together. The first section should always start with a context unit to introduce the lesson topic.

<lesson>
<section name="Introduction">
<unit type="context" name="Welcome">Brief description of what this lesson covers and what the student will learn</unit>
</section>
<section name="display name for section">
<unit type="unit_type" name="display name for unit">Detailed instructions for the unit generator</unit>
</section>
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
