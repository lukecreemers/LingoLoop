import type { PromptTestConfig, ModelConfig, TestCase } from '../prompt-tester';
import { WPMarkingOutputSchema } from '../../shared/types/writing-practice.types';

// ============================================================================
// WRITING PRACTICE MARKING PROMPT
// ============================================================================

export const WP_MARKING_PROMPT_TEMPLATE = `### TASK

Reconstruct the Student's Response exactly as written.
Wrap any mistakes in an <err> tag with a severity level.

### CONTEXT
- User Level: {{userLevel}}
- Target Language: {{targetLanguage}}
- Native Language: {{nativeLanguage}}

### ORIGINAL PROMPT
"{{prompt}}"

### STUDENT'S RESPONSE
"{{userResponse}}"

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

### SCORING RUBRIC
- 90-100: Perfect or near-native quality, natural phrasing
- 75-89: Fully understandable, only minor slips (accents, punctuation). Minor errors alone should NOT drop below 75.
- 50-74: Grammatical errors that do not hide the meaning
- 30-49: Errors that make parts difficult to understand
- 0-29: Major issues that make it hard to follow

Adjust expectations based on user level - be encouraging for beginners!
Be lenient with minor errors — they should have minimal impact on the score.

### OUTPUT FORMAT

Return JSON with:
1. markedText: The student's response with inline <err> tags
   Format: <err severity="major|minor" fix="Correct Version" why="Reason">Student's Wrong Word</err>
2. overallScore: Number 0-100
3. feedback: Encouraging but constructive feedback (2-3 sentences)
4. modelAnswer: Student's response with all mistakes fixed (preserve their ideas/voice!)
5. strengths: Array of 2-3 things they did well

### EXAMPLE

Prompt: "¿Qué haces por la mañana?"
Response: "Yo despierto a las siete. Yo como el desayuno."

Output:
{
  "markedText": "<err severity=\\"major\\" fix=\\"Me despierto\\" why=\\"Reflexive verb: despertarse requires 'me'\\">Yo despierto</err> a las siete. Yo como <err severity=\\"minor\\" fix=\\"\\" why=\\"Omit article: 'como desayuno' is more natural than 'como el desayuno'\\">el</err> desayuno.",
  "overallScore": 65,
  "feedback": "Good effort! You communicated your morning routine clearly. Focus on reflexive verbs and when to use articles with meals.",
  "modelAnswer": "Me despierto a las siete. Desayuno por la mañana.",
  "strengths": ["Clear sentence structure", "Correct use of time expressions"]
}`;

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface WPMarkingInputs
  extends Record<string, string | number | string[]> {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  prompt: string;
  userResponse: string;
}

// ============================================================================
// TEST CASES
// ============================================================================

export const WP_MARKING_TEST_CASES: TestCase<WPMarkingInputs>[] = [
  {
    name: 'beginner_with_errors',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      prompt: '¿Qué haces por la mañana?',
      userResponse:
        'Yo despierto a las siete. Yo como el desayuno y yo voy a trabajo.',
    },
  },
  {
    name: 'intermediate_mostly_correct',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      prompt: '¿Cuáles son las ventajas y desventajas de las redes sociales?',
      userResponse:
        'Las redes sociales tiene muchas ventajas. Podemos conectar con amigos y aprender cosas nuevas. Pero también hay desventajas como la adicción y las noticias falsas.',
    },
  },
];

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const WP_MARKING_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic',
    model: 'claude-haiku-4-5',
  },
];

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export const WP_MARKING_TEST_CONFIG: PromptTestConfig<WPMarkingInputs, unknown> =
  {
    featureName: 'Writing Practice Marking',
    promptTemplate: WP_MARKING_PROMPT_TEMPLATE,
    testCases: WP_MARKING_TEST_CASES,
    models: WP_MARKING_MODELS,
    outputSchema: WPMarkingOutputSchema,
  };

