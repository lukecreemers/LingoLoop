import { Injectable } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';
import {
  ExplainWrongInput,
  ExplainWrongOutput,
  ExplainWrongOutputSchema,
  TranslateSelectionInput,
  TranslateSelectionOutput,
  TranslateSelectionOutputSchema,
} from '../../shared/types/ai-assist.types';
import {
  WPMarkingInput,
  WPMarkingOutput,
  WPMarkingOutputSchema,
} from '../../shared/types/writing-practice.types';
import { WP_MARKING_PROMPT_TEMPLATE } from '../../testing/cases/writing-practice-marking.cases';

const EXPLAIN_WRONG_PROMPT = `
You are a friendly language tutor helping a student understand their mistake.

### EXERCISE TYPE
{{unitType}}

### CONTEXT
{{context}}

### USER'S ANSWER
{{userAnswer}}

### CORRECT ANSWER
{{correctAnswer}}

### TARGET LANGUAGE
{{targetLanguage}}

### YOUR TASK
1. Briefly explain WHY the user's answer was incorrect (1-2 sentences).
2. Explain the rule or pattern that applies here.
3. Provide a short, memorable tip to help them remember.

### TONE
- Encouraging and supportive (never condescending)
- Focus on the learning opportunity
- Keep explanations concise and clear
`.trim();

const TRANSLATE_SELECTION_PROMPT = `
You are a language learning assistant providing translations.

### TEXT TO TRANSLATE
{{text}}

### SOURCE LANGUAGE
{{sourceLanguage}}

### TARGET LANGUAGE
{{targetLanguage}}

### YOUR TASK
1. Provide an accurate, natural translation.
2. If the text is short (1-5 words), also provide a word-by-word breakdown with any relevant grammatical notes.
3. If longer, skip the breakdown and just provide the translation.

### GUIDELINES
- Translations should sound natural in the target language
- For breakdowns, highlight any interesting grammar points briefly
`.trim();

@Injectable()
export class AiAssistService {
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.5,
    });
  }

  async explainWrong(input: ExplainWrongInput): Promise<ExplainWrongOutput> {
    const prompt = EXPLAIN_WRONG_PROMPT.replace('{{unitType}}', input.unitType)
      .replace('{{context}}', input.context)
      .replace('{{userAnswer}}', input.userAnswer)
      .replace('{{correctAnswer}}', input.correctAnswer)
      .replace('{{targetLanguage}}', input.targetLanguage);

    const structuredLlm = this.llm.withStructuredOutput(ExplainWrongOutputSchema);
    return structuredLlm.invoke(prompt);
  }

  async translateSelection(
    input: TranslateSelectionInput,
  ): Promise<TranslateSelectionOutput> {
    const prompt = TRANSLATE_SELECTION_PROMPT.replace('{{text}}', input.text)
      .replace('{{sourceLanguage}}', input.sourceLanguage)
      .replace('{{targetLanguage}}', input.targetLanguage);

    const structuredLlm = this.llm.withStructuredOutput(
      TranslateSelectionOutputSchema,
    );
    return structuredLlm.invoke(prompt);
  }

  async markWritingPractice(input: WPMarkingInput): Promise<WPMarkingOutput> {
    const prompt = WP_MARKING_PROMPT_TEMPLATE.replace(
      '{{userLevel}}',
      input.userLevel,
    )
      .replace('{{targetLanguage}}', input.targetLanguage)
      .replace('{{nativeLanguage}}', input.nativeLanguage)
      .replace('{{prompt}}', input.prompt)
      .replace('{{userResponse}}', input.userResponse);

    const structuredLlm = this.llm.withStructuredOutput(WPMarkingOutputSchema);
    return structuredLlm.invoke(prompt);
  }
}

