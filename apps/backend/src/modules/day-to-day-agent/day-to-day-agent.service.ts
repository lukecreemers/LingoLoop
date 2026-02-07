import { Injectable, Logger } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';
import {
  HumanMessage,
  AIMessage,
  AIMessageChunk,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import {
  CreateCustomLessonToolSchema,
  CustomDrillSegmentToolSchema,
  CustomDrillSeriesToolSchema,
  RestructureRoadmapToolSchema,
  RestructureDailyLoopToolSchema,
  UserPreferencesToolSchema,
  GetUserRoadmapToolSchema,
  INTERNAL_TOOL_NAMES,
  type DayToDayChatInput,
  type DayToDayToolName,
} from '../../shared/types/day-to-day-agent.types';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const DAY_TO_DAY_SYSTEM_PROMPT = `
You are LingoLoop's friendly day-to-day language learning assistant. You chat with the user about their language learning journey and can take actions when they want to do specific things.

### YOUR PERSONALITY
- Warm, encouraging, conversational
- You're a supportive language tutor and learning companion
- You keep chat responses concise and helpful
- You use markdown formatting for clarity
- You can sprinkle in words from their target language when natural

### USER CONTEXT
- They are learning: {{targetLanguage}}
- Their native language: {{nativeLanguage}}
- Their level: {{userLevel}}

### YOUR TOOLS

#### Context tools (use freely — no confirmation needed):
- **get_user_roadmap** — Fetch the user's current learning roadmap. Call this whenever you need to know what they're learning, their progress, or when they mention anything about their roadmap, curriculum, or learning path. You do NOT need to ask permission for this tool — just call it.

#### Action tools (ALWAYS confirm with the user before calling):
1. **create_custom_lesson** — Create a full custom lesson when the user wants to learn something new that's too complex for a quick chat explanation. Use this for topics that need structured learning (vocabulary, grammar concepts, cultural topics, etc.)

2. **custom_drill_segment** — Generate a single practice exercise. Use this when the user wants quick, focused practice on one thing (e.g. "quiz me on verb conjugations", "give me some fill-in-the-blank practice").
   Available unit types: context, flashcard, explanation, fill_in_blanks, word_match, write_in_blanks, translation, conversation, writing_practice, word_order

3. **custom_drill_series** — Generate a series of varied exercises. Use this when the user wants a practice session with multiple exercise types but doesn't need a full lesson.
   Uses the same unit types as above.

4. **restructure_roadmap** — Restructure the user's learning roadmap. Use this when they're unhappy with their curriculum progression or content direction (e.g. "I want to focus more on conversational Spanish", "Speed up my learning path").

5. **restructure_daily_loop** — Restructure the user's daily activities. Use this when they want to change their daily practice routine (flash cards, reading, writing, etc.). Note: this is a future feature.

6. **user_preferences** — Update learning preferences. Use this when the user expresses ongoing dissatisfaction with how things work (marking strictness, AI tone, accent handling, etc.)

### IMPORTANT RULES
- For simple questions or explanations, just answer in chat. Don't create a lesson for every question.
- Always confirm before calling ACTION tools. Describe what you'll do and ask "Does that sound good?" or similar.
- Context tools (get_user_roadmap) can be called immediately without asking — they just give you information.
- If the user's request is ambiguous, ask clarifying questions before acting.
- Be specific in tool parameters — include all relevant details from the conversation.
- Only call ONE tool per response (after user confirmation).
- After answers to simple questions, ask if the user wants a more in depth lesson (custom lesson) or just to do some practice (custom drill segment or custom drill series)
`.trim();

// ============================================================================
// INTERNAL TOOL HELPERS
// ============================================================================

const INTERNAL_TOOL_SET = new Set<string>(INTERNAL_TOOL_NAMES);

/** Status messages shown in the UI while internal tools execute */
const INTERNAL_TOOL_STATUS: Record<string, string> = {
  get_user_roadmap: 'Fetching your roadmap...',
};

/** Default mock roadmap — replace with real data later */
function getMockRoadmap(): string {
  return JSON.stringify(
    {
      title: 'Beginner Spanish — 3 Month Plan',
      currentWeek: 3,
      totalWeeks: 12,
      phases: [
        {
          name: 'Foundation',
          weeks: '1–4',
          topics: [
            'Greetings & introductions',
            'Numbers & basic counting',
            'Common verbs (ser, estar, tener, hacer)',
            'Present tense conjugation',
            'Basic question words',
          ],
          status: 'in_progress',
        },
        {
          name: 'Building Blocks',
          weeks: '5–8',
          topics: [
            'Past tense (preterite)',
            'Food & restaurant vocabulary',
            'Directions & locations',
            'Family & descriptions',
            'Comparisons & adjectives',
          ],
          status: 'upcoming',
        },
        {
          name: 'Conversational',
          weeks: '9–12',
          topics: [
            'Future tense & plans',
            'Travel & transportation',
            'Shopping & transactions',
            'Health & emergencies',
            'Cultural topics & idioms',
          ],
          status: 'upcoming',
        },
      ],
      currentFocus: 'Common verbs and present tense conjugation',
      completedLessons: 8,
      totalLessons: 36,
      nextLesson: 'Irregular present tense verbs (ir, dar, saber)',
    },
    null,
    2,
  );
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class DayToDayAgentService {
  private readonly logger = new Logger(DayToDayAgentService.name);
  private llm: ChatAnthropic;

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.7,
    });
  }

  /**
   * Build all tools the agent can call (internal + external).
   */
  private getTools() {
    // Internal: auto-execute
    const getUserRoadmap = tool(
      async () => getMockRoadmap(),
      {
        name: 'get_user_roadmap',
        description:
          "Fetch the user's current learning roadmap including progress, phases, and upcoming lessons. Use this whenever you need context about what the user is learning or their progress. No permission needed.",
        schema: GetUserRoadmapToolSchema,
      },
    );

    // External: display-only (for now)
    const createCustomLesson = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'create_custom_lesson',
        description:
          'Create a full custom lesson for the user. Use when they want to learn something new that requires structured content with multiple exercise types.',
        schema: CreateCustomLessonToolSchema,
      },
    );

    const customDrillSegment = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'custom_drill_segment',
        description:
          'Generate a single practice exercise/drill. Use for quick focused practice on one specific thing.',
        schema: CustomDrillSegmentToolSchema,
      },
    );

    const customDrillSeries = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'custom_drill_series',
        description:
          'Generate a series of varied practice exercises. Use when the user wants a multi-exercise practice session.',
        schema: CustomDrillSeriesToolSchema,
      },
    );

    const restructureRoadmap = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'restructure_roadmap',
        description:
          "Restructure the user's learning roadmap/curriculum. Use when they're unhappy with their learning path or content direction.",
        schema: RestructureRoadmapToolSchema,
      },
    );

    const restructureDailyLoop = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'restructure_daily_loop',
        description:
          "Restructure the user's daily practice activities (flash cards, reading, writing, etc.). Future feature.",
        schema: RestructureDailyLoopToolSchema,
      },
    );

    const userPreferences = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'user_preferences',
        description:
          'Update learning preferences like marking strictness, AI tone, accent handling, punctuation sensitivity, etc.',
        schema: UserPreferencesToolSchema,
      },
    );

    return [
      getUserRoadmap,
      createCustomLesson,
      customDrillSegment,
      customDrillSeries,
      restructureRoadmap,
      restructureDailyLoop,
      userPreferences,
    ];
  }

  /**
   * Execute an internal tool and return its result string.
   */
  private async executeInternalTool(
    name: string,
    _args: Record<string, unknown>,
  ): Promise<string> {
    switch (name) {
      case 'get_user_roadmap':
        return getMockRoadmap();
      default:
        return JSON.stringify({ error: `Unknown internal tool: ${name}` });
    }
  }

  /**
   * Extract plain text content from an aggregated AIMessageChunk.
   */
  private extractTextContent(
    aggregated: AIMessageChunk,
  ): string {
    if (typeof aggregated.content === 'string') return aggregated.content;
    if (Array.isArray(aggregated.content)) {
      return aggregated.content
        .filter(
          (b): b is { type: 'text'; text: string } =>
            typeof b === 'object' &&
            b !== null &&
            'type' in b &&
            b.type === 'text' &&
            'text' in b &&
            typeof b.text === 'string',
        )
        .map((b) => b.text)
        .join('');
    }
    return '';
  }

  /**
   * Stream the day-to-day agent chat with an agentic loop.
   *
   * Internal tools (get_user_roadmap) auto-execute and feed the result
   * back to the LLM for a follow-up response — the user sees a status
   * message while this happens.
   *
   * External tools (create_custom_lesson, etc.) are yielded to the
   * frontend for display.
   *
   * Yields events:
   * - { type: 'content', content: string }
   * - { type: 'status', message: string }
   * - { type: 'tool_call', name: string, input: object }
   * - { type: 'done' }
   */
  async *streamChat(
    input: DayToDayChatInput,
  ): AsyncGenerator<
    | { type: 'content'; content: string }
    | { type: 'status'; message: string }
    | {
        type: 'tool_call';
        name: DayToDayToolName;
        input: Record<string, unknown>;
      }
    | { type: 'done' }
  > {
    const systemPrompt = DAY_TO_DAY_SYSTEM_PROMPT.replace(
      /\{\{targetLanguage\}\}/g,
      input.targetLanguage,
    )
      .replace(/\{\{nativeLanguage\}\}/g, input.nativeLanguage)
      .replace(/\{\{userLevel\}\}/g, input.userLevel);

    // Build message history (cap at last 20 messages)
    const recentHistory = (input.chatHistory ?? []).slice(-20);

    const currentMessages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...recentHistory.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
      new HumanMessage(input.userMessage),
    ];

    // Bind tools
    const tools = this.getTools();
    const llmWithTools = this.llm.bindTools(tools);

    // Agentic loop — keeps going if the LLM calls an internal tool
    const MAX_LOOPS = 3; // safety cap
    for (let loop = 0; loop < MAX_LOOPS; loop++) {
      this.logger.debug(
        `Day-to-day agent: streaming LLM (loop ${loop + 1})...`,
      );

      const stream = await llmWithTools.stream(currentMessages);
      let aggregated: AIMessageChunk | null = null;

      for await (const chunk of stream) {
        // Accumulate for tool call detection
        if (!aggregated) {
          aggregated = chunk;
        } else {
          aggregated = aggregated.concat(chunk);
        }

        // Stream text content token-by-token (same pattern as streamSectionChat)
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

      // Check for tool calls after stream completes
      if (
        !aggregated?.tool_calls ||
        aggregated.tool_calls.length === 0
      ) {
        break; // No tool calls — done
      }

      const toolCall = aggregated.tool_calls[0];
      const toolName = toolCall.name;

      if (INTERNAL_TOOL_SET.has(toolName)) {
        // ── Internal tool: auto-execute and loop ──
        this.logger.log(
          `Day-to-day agent: internal tool — ${toolName} (auto-executing)`,
        );

        yield {
          type: 'status',
          message:
            INTERNAL_TOOL_STATUS[toolName] ?? `Running ${toolName}...`,
        };

        const toolResult = await this.executeInternalTool(
          toolName,
          toolCall.args as Record<string, unknown>,
        );

        // Build the AI message that includes the tool call
        const aiMsg = new AIMessage({
          content: this.extractTextContent(aggregated),
          tool_calls: aggregated.tool_calls.map((tc) => ({
            id: tc.id ?? '',
            name: tc.name,
            args: tc.args,
          })),
        });

        const toolMsg = new ToolMessage({
          content: toolResult,
          tool_call_id: toolCall.id ?? '',
        });

        currentMessages.push(aiMsg, toolMsg);
        // Loop continues → LLM streams again with the tool result as context
      } else {
        // ── External tool: yield to frontend ──
        const name = toolName as DayToDayToolName;
        this.logger.log(
          `Day-to-day agent: external tool — ${name}: ${JSON.stringify(toolCall.args).slice(0, 200)}`,
        );
        yield {
          type: 'tool_call',
          name,
          input: toolCall.args as Record<string, unknown>,
        };
        break; // External tools end the loop
      }
    }

    yield { type: 'done' };
  }
}
