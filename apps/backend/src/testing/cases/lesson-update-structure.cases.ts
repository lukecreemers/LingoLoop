import { z } from 'zod';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface LessonUpdateStructureInputs extends Record<
  string,
  string | number | string[]
> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  lessonStructureSoFar: string;
  specificInstruction: string;
  conversationContext: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const LESSON_UPDATE_STRUCTURE_PROMPT_TEMPLATE = `
You're an agent in a pipeline that dynamically updates a language learning lesson. A student has been going through a lesson and has expressed confusion or wants extra practice on something. Your job is to generate a small set of additional units to help them.

You have the same components available as the original lesson structure:

Explanation/reading units:
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

## IMPORTANT CONSTRAINTS

This is NOT a full lesson. You are generating a **mini supplement** — a small addition to an existing lesson. Think of it as:
- A "mini cycle": explanation → 1-2 practice units, OR
- A few extra practice units targeting the specific confusion

**Rules:**
- Generate at MOST 1 section with 2-5 units. Keep it small and focused.
- If the confusion is about a concept: start with a brief explanation, then 1-2 practice units.
- If the student just wants more practice: generate 2-3 practice units only (no explanation needed).
- The section name should clearly describe what the extra units are for (e.g. "Extra Practice: Ser vs Estar", "Deep Dive: Verb Conjugation").
- Do NOT include a context unit — the student is already mid-lesson.
- NEVER repeat content from the existing lesson. Use the lesson structure below for context on what's already been covered.
- Match the difficulty to the student's level and the existing lesson's progression.

## Specific unit instruction notes
- Fill in blanks and write in blanks: Be specific about what words should be blanked. Don't leave it ambiguous.
- Translation and Writing practice: Specify exercise count clearly. "Write 3 sentences" means 3 separate exercises, each requiring one sentence.
- Writing practice: If you want multiple questions, specify how many exercises to spread them across.

## EXISTING LESSON STRUCTURE (what the student has done so far)

{{lessonStructureSoFar}}

## SPECIFIC INSTRUCTION (from the conversation analysis)

{{specificInstruction}}

## CONVERSATION CONTEXT (what the student said)

{{conversationContext}}

## STUDENT INFO
- Level: {{userLevel}}
- Learning: {{targetLanguage}}
- Native: {{nativeLanguage}}

### OUTPUT STRUCTURE (in XML please)

You MUST wrap units inside a single <section> tag. This section will be inserted into the existing lesson.

<lesson>
<section name="descriptive name for this extra section">
<unit type="unit_type" name="display name for unit">Detailed instructions for the unit generator</unit>
</section>
</lesson>
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const LESSON_UPDATE_STRUCTURE_TEST_CASES: TestCase<LessonUpdateStructureInputs>[] = [
  {
    name: 'Beginner - Confused about Ser conjugation',
    description: 'Student is confused about how to conjugate Ser in the present tense during a Ser vs Estar lesson.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      lessonStructureSoFar: `<lesson_plan>
  <section name="Introduction">
    <unit index="1" type="context" name="Welcome" status="completed">
      <instructions>Introduce the lesson on Ser vs Estar</instructions>
    </unit>
  </section>
  <section name="Understanding Ser">
    <unit index="2" type="explanation" name="What is Ser?" status="completed">
      <instructions>Explain the verb Ser and its uses for permanent traits</instructions>
    </unit>
    <unit index="3" type="flashcard" name="Ser Forms" status="completed">
      <instructions>Flashcards for Ser conjugations: yo soy, tú eres, él/ella es, nosotros somos, ellos son</instructions>
    </unit>
    <unit index="4" type="fill_in_blanks" name="Practice Ser" status="CURRENT">
      <instructions>Fill in blanks with correct Ser conjugation</instructions>
    </unit>
  </section>
</lesson_plan>`,
      specificInstruction: 'The student is struggling with remembering the Ser conjugation forms, particularly the irregular patterns. Generate extra practice specifically drilling Ser conjugations with simple sentences.',
      conversationContext: `User: I keep mixing up soy and es, when do I use which one?
Assistant: Great question! "Soy" is used for "yo" (I am), while "es" is for "él/ella/usted" (he/she/you formal). So "Yo soy estudiante" (I am a student) vs "Ella es doctora" (She is a doctor). Would you like some extra practice to drill these?
User: Yes please, I think I need more practice with all the forms
Assistant: [TOOL CALL]`,
    },
  },
  {
    name: 'Intermediate - Wants more Preterite vs Imperfect practice',
    description: 'Student understands the concept but wants extra exercises to cement it.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      lessonStructureSoFar: `<lesson_plan>
  <section name="Introduction">
    <unit index="1" type="context" name="Welcome" status="completed">
      <instructions>Introduce combining Preterite and Imperfect</instructions>
    </unit>
  </section>
  <section name="Background vs Action">
    <unit index="2" type="explanation" name="The Scene-Setting Model" status="completed">
      <instructions>Explain how imperfect sets the scene and preterite describes events</instructions>
    </unit>
    <unit index="3" type="fill_in_blanks" name="Choose the Tense" status="completed">
      <instructions>Fill in blanks choosing between preterite and imperfect forms</instructions>
    </unit>
    <unit index="4" type="write_in_blanks" name="Conjugate Correctly" status="CURRENT">
      <instructions>Write the correct verb form (preterite or imperfect) based on context</instructions>
    </unit>
  </section>
</lesson_plan>`,
      specificInstruction: 'The student wants more practice specifically with choosing between preterite and imperfect in storytelling contexts. Focus on practice units, no explanation needed.',
      conversationContext: `User: I get the concept but I feel like I need more practice before moving on
Assistant: That's totally fine! Practice makes perfect with this one. Would you like me to create some extra exercises focused on choosing between preterite and imperfect in story contexts?
User: Yeah that would be great
Assistant: [TOOL CALL]`,
    },
  },
  {
    name: 'Beginner - Confused about when to use Estar',
    description: 'Student needs a mini explanation cycle about Estar specifically.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      lessonStructureSoFar: `<lesson_plan>
  <section name="Introduction">
    <unit index="1" type="context" name="Welcome" status="completed">
      <instructions>Introduce the lesson on Ser vs Estar</instructions>
    </unit>
  </section>
  <section name="Understanding Ser">
    <unit index="2" type="explanation" name="What is Ser?" status="completed">
      <instructions>Explain the verb Ser and its uses</instructions>
    </unit>
    <unit index="3" type="flashcard" name="Ser Examples" status="completed">
      <instructions>Flashcards with Ser examples</instructions>
    </unit>
    <unit index="4" type="fill_in_blanks" name="Practice Ser" status="completed">
      <instructions>Fill in blanks with Ser</instructions>
    </unit>
  </section>
  <section name="Understanding Estar">
    <unit index="5" type="explanation" name="What is Estar?" status="CURRENT">
      <instructions>Explain the verb Estar and its uses for temporary states and locations</instructions>
    </unit>
  </section>
</lesson_plan>`,
      specificInstruction: 'The student is confused about why location uses Estar instead of Ser. They need a brief targeted explanation about Estar for location specifically, followed by practice with location-based sentences.',
      conversationContext: `User: Wait, why does location use estar? The library IS there permanently, so shouldn't it be ser?
Assistant: That's a really common question! In Spanish, location always uses estar regardless of whether the thing is permanent. Think of it this way: "ser" is about what something IS (identity), while "estar" is about WHERE something IS (position in space). Even a mountain uses estar for location! Would you like me to set up some extra practice specifically on estar with locations?
User: Oh okay that makes more sense. Yeah extra practice would help
Assistant: [TOOL CALL]`,
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const LESSON_UPDATE_STRUCTURE_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6,
  },
];

// ============================================================================
// EXPORT CONFIG (uses raw text output for XML)
// ============================================================================

const RawXmlOutputSchema = z.string();

export const LESSON_UPDATE_STRUCTURE_TEST_CONFIG: PromptTestConfig<
  LessonUpdateStructureInputs,
  string
> = {
  featureName: 'Lesson Update Structure (XML)',
  promptTemplate: LESSON_UPDATE_STRUCTURE_PROMPT_TEMPLATE,
  outputSchema: RawXmlOutputSchema,
  testCases: LESSON_UPDATE_STRUCTURE_TEST_CASES,
  models: LESSON_UPDATE_STRUCTURE_MODELS,
  useRawTextOutput: true,
};


