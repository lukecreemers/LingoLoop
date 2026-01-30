import { z } from "zod";

export const CreateFIBQuestionSchema = z.object({
  questionCount: z.number().int().positive().min(1).max(10),
  instructions: z.string().min(1),
});
