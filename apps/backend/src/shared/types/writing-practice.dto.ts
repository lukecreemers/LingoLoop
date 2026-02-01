// DTO class for NestJS controller @Body() decorator

export class MarkWritingPracticeDto {
  prompt!: string;
  userResponse!: string;
  targetLanguage!: string;
  nativeLanguage!: string;
  userLevel!: string;
}
