import { TMOutputSchema } from '../../shared';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface TMInputs extends Record<string, string | number | string[]> {
  referenceText: string; // The "Golden" version (the goal)
  userTranslation: string; // What the user actually typed
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const TM_PROMPT_TEMPLATE = `
### TASK

Reconstruct the User's Translation exactly as written.
Wrap any mistakes in an <err> tag with a severity level.

### THE ANSWER KEY

"{{referenceText}}"

### THE USER'S ATTEMPT

"{{userTranslation}}"

### ERROR SEVERITY LEVELS

**minor** — Cosmetic or stylistic issues that don't affect meaning:
- Missing or wrong accent marks (e.g. "esta" vs "está")
- Missing or wrong punctuation (e.g. missing ¿ or ¡)
- Capitalization errors
- Minor spelling typos that don't change the word

**major** — Errors that affect grammar, meaning, or comprehension:
- Wrong gender/number agreement
- Wrong verb conjugation or tense
- Missing or wrong words that change meaning
- Word order errors
- Wrong prepositions

### SCORING RUBRIC (AI GUIDELINE)
- 10: Perfect or natural/native equivalent.
- 8-9: Fully understandable, only minor slips (accents, punctuation). Minor errors alone should NOT drop below 8.
- 5-7: Grammatical errors (gender, number, basic tense) that do not hide the meaning.
- 1-4: Major tense confusion or word-order issues that make it hard to follow.

## Important Details
1. The answer key is only a reference. If the user's translation uses wording or phrases that convey the same message and meaning, do not mark the user down for that.
2. The user's translation should be reconstructed exactly as written (with included error tags). Do not add or remove any words or phrases.
3. Be lenient with minor errors — they should have minimal impact on the score.

### OUTPUT FORMAT

Return ONLY the reconstructed string with inline tags.
Format: <err severity="major|minor" fix="Correct Version" why="Reason">User's Wrong Word or Phrase</err>

### EXAMPLE

Answer Key: "Las sillas rojas están en la sala."
User Attempt: "Las sillas rojos estan en el sala."
Output: Las sillas <err severity="major" fix="rojas" why="Gender agreement: sillas is feminine">rojos</err> <err severity="minor" fix="están" why="Missing accent mark on á">estan</err> en <err severity="major" fix="la" why="Article agreement: sala is feminine">el</err> sala.
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TM_TEST_CASES: TestCase<TMInputs>[] = [
  {
    name: 'Beginner/Intermediate - Narrative Routine (Dense Mistakes)',
    description:
      'A paragraph with frequent fundamental errors in reflexive verbs, articles, and "gustar" constructions.',
    inputs: {
      userLevel: 'beginner',
      referenceText:
        'Normalmente me levanto a las siete de la mañana. Después me ducho, desayuno y voy a la oficina en autobús. Me gusta mucho mi trabajo porque mis compañeros son simpáticos y siempre aprendo algo nuevo. Por la tarde, vuelvo a casa y preparo la cena para mi familia.',
      userTranslation:
        'Normalmente yo levanto a las siete de la mañana. Después yo ducho, desayuno y voy al oficina en el autobús. Yo gusta mucho mi trabajo porque mis compañeros son simpáticos y siempre aprendo algo nuevo. Por el tarde, vuelvo a casa y preparo el cena para mi familia.',
    },
  },
  {
    name: 'Intermediate/Advanced - Travel Story (Mixed Tense Errors)',
    description:
      'A longer narrative testing Preterite vs. Imperfect and specific vocabulary usage.',
    inputs: {
      userLevel: 'intermediate',
      referenceText:
        'El verano pasado fui a España con mi familia. Mientras caminábamos por el centro de Madrid, de repente vimos un desfile increíble. Fue una experiencia que nunca olvidaré porque la comida era deliciosa y la gente era muy acogedora. Ojalá pueda volver el año que viene para visitar Barcelona.',
      userTranslation:
        'El verano pasado iba a España con mi familia. Mientras caminamos por el centro de Madrid, de repente vimos un desfile increíble. Era una experiencia que nunca olvidaré porque la comida fue deliciosa y la gente fue muy acogedora. Ojalá puedo volver el año que viene para visitar Barcelona.',
    },
  },
  {
    name: 'Advanced - Formal Correspondence (Subtle Register Errors)',
    description:
      'A professional email that is technically correct but fails to maintain the formal "Usted" register.',
    inputs: {
      userLevel: 'advanced',
      referenceText:
        'Estimado señor Martínez: Le escribo para expresarle mi interés en la vacante de ingeniero en su empresa. Adjunto mi currículum y espero que podamos programar una entrevista pronto. Si tuviera alguna duda sobre mi experiencia, no dude en contactarme. Quedo a su entera disposición.',
      userTranslation:
        'Estimado señor Martínez: Te escribo para expresarte mi interés en la vacante de ingeniero en tu empresa. Adjunto mi currículum y espero que podamos programar una entrevista pronto. Si tienes alguna duda sobre mi experiencia, no dudes en contactarme. Quedo a tu entera disposición.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const TM_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.5,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const TM_TEST_CONFIG: PromptTestConfig<TMInputs, unknown> = {
  featureName: 'Translation Marking',
  promptTemplate: TM_PROMPT_TEMPLATE,
  outputSchema: TMOutputSchema,
  testCases: TM_TEST_CASES,
  models: TM_MODELS,
};
