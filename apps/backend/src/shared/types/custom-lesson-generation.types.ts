import { z } from 'zod';

const SGInstructionsSchema = z.object({
  type: z.literal('story'),
  instructions: z
    .string()
    .describe('The instructions for the text to be generated.'),
  textType: z
    .string()
    .describe(
      'The type of text to be generated (e.g. "story", "news article", "email", "retelling", "blog post").',
    ),
  length: z
    .enum(['short', 'medium', 'long'])
    .describe('The length of the lesson.'),
});

const CGInstructionsSchema = z.object({
  type: z.literal('conversation'),
  instructions: z
    .string()
    .describe('The instructions for the conversation to be generated.'),
  conversationLength: z
    .enum(['short', 'medium', 'long'])
    .describe('The length of the conversation.'),
});

const FIBInstructionsSchema = z.object({
  type: z.literal('fill in the blanks'),
  instructions: z
    .string()
    .describe(
      'The instructions for the fill in the blanks exercise to be generated.',
    ),
  blankAmount: z.number().describe('The number of blanks in each sentence.'),
  distractorInstructions: z
    .string()
    .describe('The instructions for the distractors to be generated.'),
  distractorCount: z
    .number()
    .describe('The number of distractors to be generated for each sentence.'),
});

const TGInstructionsSchema = z.object({
  type: z.literal('translation'),
  instructions: z
    .string()
    .describe(
      'The instructions for the translation exercise to be generated. ',
    ),
  sentenceCount: z
    .number()
    .describe('The number of sentences to be generated.'),
  startingLanguage: z
    .string()
    .describe('The starting language of the exercise.'),
  languageToTranslateTo: z
    .string()
    .describe('The language the user will be translating into.'),
});

const WMMInstructionsSchema = z.object({
  type: z.literal('word meaning match'),
  matchType: z
    .string()
    .describe(
      'The type of match to be generated. (e.g. "Spanish Infinitive → English Translation", "Spanish Noun → Correct Article (el/la)").',
    ),
  theme: z
    .string()
    .describe(
      'The theme of the exercise. (e.g. "Common -ar verbs", "Household objects and their gender").',
    ),
  pairCount: z.number().describe('The number of pairs to be generated.'),
  distractorCount: z
    .number()
    .describe('The number of distractors to be generated.'),
});

const WIBInstructionsSchema = z.object({
  type: z.literal('write in the blanks'),
  instructions: z
    .string()
    .describe(
      'The instructions for the write in the blanks exercise to be generated.',
    ),
  blankAmount: z.number().describe('The number of blanks in each sentence.'),
});

export const CLGOutputSchema = z.object({
  units: z
    .array(
      z.discriminatedUnion('type', [
        SGInstructionsSchema,
        CGInstructionsSchema,
        FIBInstructionsSchema,
        TGInstructionsSchema,
        WMMInstructionsSchema,
        WIBInstructionsSchema,
      ]),
    )
    .describe(
      'A sequence of learning units tailored to the user’s request and level. Each unit has a specific type and set of instructions for a sub-agent to execute.',
    ),
});

export type CLGOutput = z.infer<typeof CLGOutputSchema>;
