// DTO classes for NestJS controller @Body() decorators

export class ExplainWrongDto {
  unitType!: string;
  context!: string;
  userAnswer!: string;
  correctAnswer!: string;
  targetLanguage!: string;
}

export class TranslateSelectionDto {
  text!: string;
  sourceLanguage!: string;
  targetLanguage!: string;
}

