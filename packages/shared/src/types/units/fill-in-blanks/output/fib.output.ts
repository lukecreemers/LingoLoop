import { z } from "zod";

export const FIBOutputSchema = z.object({
  // The exercise title or instruction (e.g., "Translate this sentence")
  instruction: z.string().describe("Clear instructions for the user."),

  // Breaking the sentence into 'text' and 'blank' pieces for easy rendering
  segments: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("text"),
          content: z
            .string()
            .describe("Static text that the user cannot move."),
        }),
        z.object({
          type: z.literal("blank"),
          id: z.string().describe("Unique ID for this specific blank."),
          correctAnswer: z
            .string()
            .describe("The exact word that belongs here."),
        }),
      ])
    )
    .describe(
      "The sentence split into text segments and blanks in chronological order."
    ),

  // Extra words that don't fit anywhere (the decoys)
  distractors: z
    .array(z.string())
    .describe(
      "Extra words to show in the word bank that are incorrect (the decoys)."
    ),

  // Helpful metadata
  hint: z
    .string()
    .optional()
    .describe("A helpful hint if the user gets stuck."),
});

export type FIBOutput = z.infer<typeof FIBOutputSchema>;
