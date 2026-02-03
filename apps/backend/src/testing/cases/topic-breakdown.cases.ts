import { TBOutputSchema } from '../../shared/types/topic-breakdown.types';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface TBInputs extends Record<string, string | number | string[]> {
  userLevel: string;
  instructions: string;
  targetLanguage: string;
  nativeLanguage: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const TB_PROMPT_TEMPLATE = `
### ROLE
You are the first stage of a custom lesson generation system. You will be given a topic or question and then need to break it down into a logical sequence of sections.
There are future stages to this system that will break down your outputs and generate activities, detailed explanations, and other resources for the lesson. 
Your only task is to just break down the topic create logical sections with extremely brief instructions that a future model would be able to use to generate the lesson.


### USER PROFILE
- Level: {{userLevel}}
- Target: {{targetLanguage}} / Native: {{nativeLanguage}}

### THE TOPIC
{{instructions}}

### DECONSTRUCTION STRATEGY
Break this topic down into however many sections are necessary to cover the topic for the user of the given level. If you generate multiple sections,
make sure to include a bridge section that combines everything taught in the previous sections.
If the topic is super simple, just have one section.

To understand how your output will be used, here is a breakdown of the future stages:
Stage 1: Each section instruction will be passed to an activity selection agent: This agent has access to activites like explanation, fill in the blanks, writing practice, mock conversations etc.
It will use your overview to specifcy instructions for these activities. It does not have reference to your other section instructions or the original instruction you passed.
Stage 2: Individual activites: Will take the instructions from the activity selection stage and generate the activity itself.

Based on this, for your instructions, make sure you provide detail about the context of the section (what the user has learnt so far and what they will learn next), e.g. don't assume the next agent knows about the other stages so include a little bit of information about where it fits into the lesson.
However, trust that the agent will be able to understand context, fill in heaps of gaps and generate relevant content, explanations and details.
You are basically trying to prompt the next agent to generate relevant content, explanations and details that fit into the overall lesson with as little information as possible.

Thus, all you have to do is just break down the topic into however many sections you feel necessary for there level provide enough detail that the future stages can generate relevant content, explanations and details.

IMPORTANT: 
The future ai uses the same model as you, you do not need to explain what things like the core purposes of Por is, or the core purposes of Ser, or the different conjugations or words to use
IT knows this already, be extremely concise and to the point.
The aim is to use as few tokens as possible.


NEVER: 
Waste tokens talking about tone, explaining concepts to the future agent, or providing unnessary details or information.


Example GOOD output with concise and contextually relevant instructions (Ser vs Estar for a beginner.):
OUTPUT:
{
  "sections": [
  "Section 1:  You are the first section in a Ser vs Estar lesson. Introduce the concept briefly, there will be future sections breaking down each verb in isolation and a bridging section testing the user on both.",
    "Section 2: You are the first section in a Ser vs Estar lesson. Introduce the verb Ser and explain its fundamental uses for a beginner.",
    "Section 3: You are the second section in a Ser vs Estar lesson. The user has already learnt about Ser, Introduce the verb Estar and explain its fundamental uses.",
    "Section 4: You are the final section in a Ser vs Estar lesson. The user has learnt both verbs in isolation and now needs to practice using both of them and choosing between the correct verb."
  ]
}



### LEVEL CONSTRAINTS
- **Beginner:** Max 2 sectios + (optional)1 Bridge. Keep vocabulary simple.
- **Intermediate:** 2-3 Loops + 1 Bridge. Introduce common exceptions.
- **Advanced:** 3-4 Loops + 1 Bridge. Focus on nuances, regionalisms, and complex synthesis.

`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const TB_TEST_CASES: TestCase<TBInputs>[] = [
  {
    name: 'Beginner - Ser vs Estar',
    description:
      'Classic beginner challenge. Should break into: Ser intro, Estar intro, Contrast.',
    inputs: {
      userLevel: 'beginner',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Introduce basic Spanish greetings and farewells: Hola, Buenos días, Buenas tardes, Buenas noches, and Adiós. Teach pronunciation with emphasis on natural intonation patterns. Include listening exercises to distinguish between formal and informal delivery. Create a reference chart with phonetic guides.',
    },
  },
  {
    name: 'Intermediate - Por vs Para',
    description: 'More nuanced preposition contrast.',
    inputs: {
      userLevel: 'intermediate',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'Understanding when to use "por" versus "para" - all major use cases.',
    },
  },
  {
    name: 'Advanced - Subjunctive Triggers',
    description: 'Complex grammar requiring multiple sections.',
    inputs: {
      userLevel: 'advanced',
      targetLanguage: 'Spanish',
      nativeLanguage: 'English',
      instructions:
        'When to use the subjunctive mood - identifying triggers and understanding the logic.',
    },
  },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const TB_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 0.6,
  },
];

// ============================================================================
// EXPORT CONFIG
// ============================================================================

export const TB_TEST_CONFIG: PromptTestConfig<TBInputs, unknown> = {
  featureName: 'Topic Breakdown',
  promptTemplate: TB_PROMPT_TEMPLATE,
  outputSchema: TBOutputSchema,
  testCases: TB_TEST_CASES,
  models: TB_MODELS,
};
