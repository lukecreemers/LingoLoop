import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import type { ReadingPassage, DailyVocab } from '../../shared/types/daily-loop.types';

// ============================================================================
// SCHEMAS — structured output for the LLM
// ============================================================================

const ReadingPassageSchema = z.object({
  title: z.string().describe('Title in the target language'),
  titleTranslation: z
    .string()
    .describe('Title translated to native language'),
  content: z
    .string()
    .describe(
      'The reading passage in the target language. Use markdown: **bold** for key vocab, *italic* for emphasis, --- for section breaks. Multiple paragraphs separated by blank lines.',
    ),
  targetVocab: z
    .array(
      z.object({
        word: z.string().describe('The vocabulary word/phrase'),
        definition: z.string().describe('Brief definition in native language'),
      }),
    )
    .describe('6-10 key vocabulary words from the passage'),
  comprehensionQuestions: z
    .array(
      z.object({
        question: z.string().describe('Question in the target language'),
        questionTranslation: z.string().describe('Question translated'),
        options: z
          .array(z.string())
          .describe('4 answer options in the target language'),
        correctIndex: z
          .number()
          .describe('0-based index of the correct option'),
      }),
    )
    .describe('4-5 comprehension questions about the passage'),
  translatePhrases: z
    .array(
      z.object({
        phrase: z.string().describe('A phrase from the passage to translate'),
        translation: z
          .string()
          .describe('Correct translation in native language'),
        context: z
          .string()
          .describe('The surrounding sentence for context'),
      }),
    )
    .describe('4-6 phrases from the passage for translation practice'),
});

const ReadingExtensionSchema = z.object({
  content: z
    .string()
    .describe(
      'One or two additional paragraphs continuing the story/article. Use markdown. Continue naturally from where the text left off.',
    ),
});

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

function buildGeneratePrompt(opts: {
  contentType: string;
  length: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: string;
  dailyVocab?: DailyVocab;
  customRequest?: string;
}): string {
  const vocabSection = opts.dailyVocab
    ? `
### Vocabulary to incorporate naturally
New words (the student is learning these today — use **bold** when they first appear):
${opts.dailyVocab.newWords.map((w) => `- ${w.word} (${w.definition})`).join('\n')}

Review words (the student already knows these — use them naturally):
${opts.dailyVocab.reviewWords.map((w) => `- ${w.word} (${w.definition})`).join('\n')}

Grammar concepts to reinforce:
${opts.dailyVocab.grammarConcepts.map((c) => `- ${c}`).join('\n')}
`
    : '';

  const customSection = opts.customRequest
    ? `\n### User's special request\n${opts.customRequest}\n`
    : '';

  const lengthGuide = {
    short: '150-250 words',
    medium: '250-400 words',
    long: '400-600 words',
  }[opts.length] || '250-400 words';

  return `You are a language learning content creator. Generate a reading passage for a ${opts.level} ${opts.targetLanguage} student whose native language is ${opts.nativeLanguage}.

### Content type
${opts.contentType} (${lengthGuide})

### Formatting rules
- Write the passage entirely in ${opts.targetLanguage}
- Use **bold** to highlight key vocabulary words when they first appear
- Use *italic* for restaurant/place names or emphasis
- Use --- for section breaks if the story has natural divisions
- Separate paragraphs with blank lines
- Keep sentences appropriate for a ${opts.level} student
- Make the content engaging, realistic, and culturally relevant
${vocabSection}${customSection}
### Important
- The comprehension questions should test understanding, not just word lookup
- Translation phrases should be complete meaningful phrases (not single words)
- All questions and translations must be answerable from the passage
- The targetVocab should include words that appear in the passage that the student might not know`;
}

function buildExtendPrompt(opts: {
  existingContent: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: string;
  dailyVocab?: DailyVocab;
}): string {
  const vocabHint = opts.dailyVocab
    ? `\nTry to naturally incorporate some of these vocabulary words if they haven't been used yet: ${opts.dailyVocab.newWords.map((w) => w.word).join(', ')}`
    : '';

  return `You are continuing a ${opts.targetLanguage} reading passage for a ${opts.level} student (native: ${opts.nativeLanguage}).

### Existing text so far
${opts.existingContent}

### Task
Write 1-2 more paragraphs that naturally continue this text. Keep the same tone, style, and difficulty level. Use **bold** for any important vocabulary words.${vocabHint}

Write ONLY the new paragraph(s), not the existing text.`;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class ReadingGenerationService {
  private readonly logger = new Logger(ReadingGenerationService.name);
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.8,
    });
  }

  /**
   * Generate a complete reading passage with vocab, questions, and phrases.
   */
  async generateReading(opts: {
    contentType: string;
    length: string;
    targetLanguage?: string;
    nativeLanguage?: string;
    level?: string;
    dailyVocab?: DailyVocab;
    customRequest?: string;
  }): Promise<ReadingPassage> {
    this.logger.log(
      `Generating reading: ${opts.contentType}, ${opts.length}${opts.customRequest ? `, custom: "${opts.customRequest.slice(0, 40)}..."` : ''}`,
    );

    const prompt = buildGeneratePrompt({
      contentType: opts.contentType,
      length: opts.length,
      targetLanguage: opts.targetLanguage || 'Spanish',
      nativeLanguage: opts.nativeLanguage || 'English',
      level: opts.level || 'beginner',
      dailyVocab: opts.dailyVocab,
      customRequest: opts.customRequest,
    });

    const structuredLlm = this.llm.withStructuredOutput(ReadingPassageSchema);
    const result = await structuredLlm.invoke(prompt);

    // Add the passage type
    return {
      ...result,
      type: opts.contentType as ReadingPassage['type'],
    };
  }

  /**
   * Generate 1-2 additional paragraphs to extend an existing reading.
   */
  async extendReading(opts: {
    existingContent: string;
    targetLanguage?: string;
    nativeLanguage?: string;
    level?: string;
    dailyVocab?: DailyVocab;
  }): Promise<string> {
    this.logger.log('Extending reading passage...');

    const prompt = buildExtendPrompt({
      existingContent: opts.existingContent,
      targetLanguage: opts.targetLanguage || 'Spanish',
      nativeLanguage: opts.nativeLanguage || 'English',
      level: opts.level || 'beginner',
      dailyVocab: opts.dailyVocab,
    });

    const structuredLlm = this.llm.withStructuredOutput(ReadingExtensionSchema);
    const result = await structuredLlm.invoke(prompt);

    return result.content;
  }
}

