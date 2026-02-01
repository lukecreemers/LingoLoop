import { z } from 'zod';

export const MarkTranslationDtoSchema = z.object({
  referenceText: z.string().min(1).describe('The ideal/reference translation'),
  userTranslation: z.string().min(1).describe("The user's attempted translation"),
});

export class MarkTranslationDto {
  referenceText!: string;
  userTranslation!: string;
}

