import { Injectable, Logger } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';
import {
  HumanMessage,
  AIMessage,
  AIMessageChunk,
  SystemMessage,
} from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
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
import type { ExplanationChatInput } from '../../shared/types/explanation-chat.dto';
import type { SectionChatInput } from '../../shared/types/section-chat.dto';

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

Keep in mind that you are marking a users answer for an ai generated lesson. So there is a possibility that the user is actually correct.
IN such instances be clear about this, and mention why this happens.

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

const EXPLANATION_CHAT_SYSTEM = `
You are a friendly, knowledgeable language tutor helping a student understand a concept they just learned.
You have access to the original explanation they read, and they're asking follow-up questions.

### YOUR APPROACH
- Be conversational and encouraging
- Give clear, concise answers (don't over-explain)
- Use examples in {{targetLanguage}} when helpful
- If they ask something unrelated to the topic, try and answer it in a way that is helpful and relevant to the topic. But always allow the user to stare the conversation where they want.
- Use markdown formatting for clarity (bold key terms, code blocks for examples)

### THE EXPLANATION THEY READ
{{explanationContext}}

### LANGUAGE CONTEXT
- They are learning: {{targetLanguage}}
- Their native language: {{nativeLanguage}}

Answer their question helpfully. Keep responses focused and not too long.
`.trim();

// ============================================================================
// SECTION CHAT SYSTEM PROMPT
// This is the chat that appears at the end of sections where users can ask
// questions or request extra practice. It has a tool call for generating
// extra units when the user needs more help.
// ============================================================================

const SECTION_CHAT_SYSTEM = `
You are a friendly, supportive language tutor checking in with a student during a lesson. They've just completed a section and you're asking if everything makes sense.

### YOUR ROLE
- Be warm, encouraging, and conversational
- Help answer questions about the concepts covered in the lesson
- If the student is confused about something that can be clarified with a short explanation, just explain it in chat
- Use examples in {{targetLanguage}} when helpful
- Use markdown formatting for clarity

### WHEN TO USE THE TOOL
You have access to a tool called "generate_extra_practice" that creates extra units in the lesson.

**USE the tool when:**
- The student explicitly asks for more practice or exercises
- The student is confused about a concept that would benefit from hands-on practice (not just a chat explanation)
- The student wants to drill something specific before moving on
- You've explained something in chat but the student still seems unsure and would benefit from interactive exercises

**DO NOT use the tool when:**
- The student says they're good / understand / ready to move on
- The student asks a quick clarifying question you can answer in chat
- The student asks something completely unrelated to the lesson — politely tell them that's outside the scope of this lesson for now
- The student's question can be fully resolved with a brief chat explanation

When you DO use the tool, first send a brief message to the student letting them know you're setting up some extra practice, THEN call the tool.

### CURRENT LESSON CONTEXT

The student is learning: {{targetLanguage}}
Their native language: {{nativeLanguage}}
Their level: {{userLevel}}

#### What they've been learning in this lesson:
{{lessonPlanContext}}

#### The section they just completed:
{{sectionContext}}

### GUIDELINES
- Keep chat responses concise (don't over-explain in chat)
- Be specific in the tool's "instruction" parameter — describe exactly what the student needs
- The tool instruction should reference the student's specific confusion or request
- Only call the tool ONCE per response (the system will handle creating the units)
`.trim();

@Injectable()
export class AiAssistService {
  private readonly logger = new Logger(AiAssistService.name);
  private llm: ChatAnthropic;
  private markingLlm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.5,
    });
    this.markingLlm = new ChatAnthropic({
      model: 'claude-sonnet-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.3,
    });
  }

  async explainWrong(input: ExplainWrongInput): Promise<ExplainWrongOutput> {
    const prompt = EXPLAIN_WRONG_PROMPT.replace('{{unitType}}', input.unitType)
      .replace('{{context}}', input.context)
      .replace('{{userAnswer}}', input.userAnswer)
      .replace('{{correctAnswer}}', input.correctAnswer)
      .replace('{{targetLanguage}}', input.targetLanguage);

    const structuredLlm = this.llm.withStructuredOutput(
      ExplainWrongOutputSchema,
    );
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

    const structuredLlm =
      this.markingLlm.withStructuredOutput(WPMarkingOutputSchema);
    return structuredLlm.invoke(prompt);
  }

  /**
   * Stream a chat response for explanation follow-up questions
   */
  async *streamExplanationChat(
    input: ExplanationChatInput,
  ): AsyncGenerator<string> {
    const systemPrompt = EXPLANATION_CHAT_SYSTEM.replace(
      /\{\{targetLanguage\}\}/g,
      input.targetLanguage,
    )
      .replace('{{nativeLanguage}}', input.nativeLanguage)
      .replace('{{explanationContext}}', input.explanationContext);

    // Build message history
    const messages = [
      new SystemMessage(systemPrompt),
      ...input.chatHistory.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
      new HumanMessage(input.userQuestion),
    ];

    // Stream the response
    const stream = await this.llm.stream(messages);

    for await (const chunk of stream) {
      const content = chunk.content;
      if (typeof content === 'string' && content.length > 0) {
        yield content;
      }
    }
  }

  // ============================================================================
  // SECTION CHAT (with tool calling for lesson update structure)
  // ============================================================================

  /**
   * Define the tool that the section chat LLM can call to trigger extra unit generation.
   */
  private getExtraPracticeTool() {
    return tool(
      async ({ instruction }) => {
        // The tool handler just returns the instruction — the controller will
        // intercept the tool call and route it to the lesson update pipeline.
        return instruction;
      },
      {
        name: 'generate_extra_practice',
        description:
          'Generate extra practice units for the student. Call this when the student needs more exercises or a mini-explanation cycle to practice something specific. Provide a clear, detailed instruction about what the extra units should cover.',
        schema: z.object({
          instruction: z
            .string()
            .describe(
              'Specific instruction for what extra units to generate. Be detailed: describe what concept to focus on, what type of practice would help, and reference the student\'s specific confusion or request.',
            ),
        }),
      },
    );
  }

  /**
   * Stream section chat responses. This chat supports tool calling —
   * when the LLM decides extra practice is needed, it calls generate_extra_practice
   * and we emit a special SSE event with the tool call instruction.
   *
   * Yields events:
   * - { type: 'content', content: string } — streamed text
   * - { type: 'tool_call', instruction: string } — the LLM wants to generate extra units
   * - { type: 'done' }
   */
  async *streamSectionChat(
    input: SectionChatInput,
  ): AsyncGenerator<
    | { type: 'content'; content: string }
    | { type: 'tool_call'; instruction: string }
    | { type: 'done' }
  > {
    const systemPrompt = SECTION_CHAT_SYSTEM.replace(
      /\{\{targetLanguage\}\}/g,
      input.targetLanguage,
    )
      .replace(/\{\{nativeLanguage\}\}/g, input.nativeLanguage)
      .replace(/\{\{userLevel\}\}/g, input.userLevel)
      .replace('{{lessonPlanContext}}', input.lessonPlanContext)
      .replace('{{sectionContext}}', input.sectionContext);

    // Build message history (cap at last 10 messages)
    const recentHistory = input.chatHistory.slice(-10);

    const messages = [
      new SystemMessage(systemPrompt),
      ...recentHistory.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
      new HumanMessage(input.userMessage),
    ];

    // Bind tools to the LLM
    const extraPracticeTool = this.getExtraPracticeTool();
    const llmWithTools = this.llm.bindTools([extraPracticeTool]);

    this.logger.debug('Section chat: streaming LLM with tools...');

    // Stream the response — accumulate an aggregate to inspect tool calls afterwards
    const stream = await llmWithTools.stream(messages);

    let aggregated: AIMessageChunk | null = null;

    for await (const chunk of stream) {
      // Accumulate for tool call detection after stream ends
      if (!aggregated) {
        aggregated = chunk;
      } else {
        aggregated = aggregated.concat(chunk);
      }

      // Stream text content token-by-token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chunkContent = chunk.content as any;
      if (typeof chunkContent === 'string' && chunkContent.length > 0) {
        yield { type: 'content', content: chunkContent };
      } else if (Array.isArray(chunkContent)) {
        for (const block of chunkContent) {
          if (typeof block === 'string' && block.length > 0) {
            yield { type: 'content', content: block };
          } else if (
            typeof block === 'object' &&
            block !== null &&
            block.type === 'text' &&
            typeof block.text === 'string' &&
            block.text.length > 0
          ) {
            yield { type: 'content', content: block.text };
          }
        }
      }
    }

    // After stream completes, check the aggregated message for tool calls
    if (aggregated?.tool_calls && aggregated.tool_calls.length > 0) {
      const toolCall = aggregated.tool_calls[0];
      if (toolCall.name === 'generate_extra_practice') {
        const instruction = toolCall.args?.instruction as string;
        this.logger.log(
          `Section chat: tool call detected — generate_extra_practice: "${instruction?.slice(0, 100)}..."`,
        );
        yield { type: 'tool_call', instruction };
      }
    }

    yield { type: 'done' };
  }
}
