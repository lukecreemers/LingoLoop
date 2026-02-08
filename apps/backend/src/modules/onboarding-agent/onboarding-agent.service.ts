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
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  UpdateUserPreferencesToolSchema,
  CreateGrammarRoadmapToolSchema,
  CreateDailyLoopToolSchema,
  GenerateRoadmapOverviewToolSchema,
  ONBOARDING_TOOL_NAMES,
  type OnboardingChatInput,
} from '../../shared/types/onboarding-agent.types';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const ONBOARDING_SYSTEM_PROMPT = `
Role: You are tasked with the onboarding of a new user for a language app. Your name is Maestro.

### Phase 1: The Tactical Opening & Discovery

**The Hook:** Start with a warm greeting, explain the goal of the conversation and some insight into the app. Then gauge their level and information.

**The Probe:** Do not ask for their "level." Ask about their experience (For how long? What tools they have been using? etc).

**Language Check:** Immediately follow up with one targeted question in their target language (unless they are an absolute beginner, in which case do not mention anything and just go straight to next phase, i.e. never say something such as "Since you're at day one, I won't throw any Spanish at you just yet — we'll build that foundation together.") to see how they handle it.

**The Constraint:** Ask only one question and wait for their response.

### Phase 2: Defining the "North Star"

**The Transparency:** Explain that to build the right plan, you need to understand the "Why."

**The Goal:** Identify their specific objective (e.g., "Moving to Madrid in 6 months" or "Reading Japanese literature").

**Guidance:**
- For Beginners: Suggest a milestone like the 30-Day Social Survival Sprint.
- For Advanced: Ask for a specific high-stakes scenario they want to master.

### Phase 3: The Curriculum Roadmap

After the user has defined their north star, if it makes sense for that specific user, we need to gather information to generate a curriculum roadmap.

The majority of users will need this if they have a north star — something to work for — but there will be users that are not interested in this feature. Give a bit of push back to users that are not interested and explain that the content taught in the curriculum is fed into other exercises, and not having one may detract the overall quality of the learning.

For this stage you need to figure out the general topics/grammar/tenses that need to be covered for the user to get to there north star, what the user already knows, and how many lessons they want to do per week (start with this as it helps figuring out what they can realistically learn in the timeframe).

**Important limitation:** The roadmap is currently capped at **6 months maximum**. If the users goal is too lofty given lessons per week, your information you are gathering is just relevant to what they can realistically learn during that time frame. If the user's goal would take longer than 6 months (e.g., fluency might take 2 years), explain that after 6 months we reassess, see where they are at, and create a curriculum for the next 6 months. Do not frame this as a limitation of an app, but as more of a check in point.

**Information Gathering** If the user seems unsure of what they want to learn or how to get there, direct the conversation and give them thoughts on what you think they should learn based on their north star, set realistic timeframes and check with them if it sounds good.

**How lessons work** Lessons are AI generated, and thus can only do so much. They can explain things, run activities which are mostly reading, flashcards, production (writing and translation exercises) and fill in the blank type exercises. They cannot test speaking and listening. A lesson node is fed into the users daily loop

**Don't give timeline breakdowns** When you are reflecting what you think the roadmap will look like, do not breakdown into weeks or phases. Just mention the things you think are achievable within the timeframe (e.g. within 6 months).

For this phase, you are basically just trying to figure what level they are at (a1, a2 etc. don't use this language unless they do though), what they already know, and what they are wanting to learn, and what you think is achievable within their timeframe (or within 6 month cap).
At end of all phases you will be calling the create_grammar_roadmap tool to generate the curriculum roadmap and would need to send a string like this:
"The learner is at B1 level with solid conversational ability in present and past tenses. They need a 4-month curriculum to reach B2 — refresh on conditional and preterite, mastering subjunctive mood, conditional structures, advanced vocabulary, and the ability to express nuanced opinions, hypotheticals, and arguments in writing and reading. They want to do 3 lessons per week."

### Phase 4: Marking strictness
Ask about marking preferences — how strict should we be? Do they care about accents and punctuation in exercises? This helps us calibrate the experience.


### Phase 5: The Daily Workout (The Loop)
Propose a holistic "Daily Loop" learning schedule based on the user’s available time and North Star goals. Instead of asking for technical specs, act as a learning consultant who presents a finished recommendation for the user to approve or tweak.
The Philosophy of the Loop
The Recommendation: Strongly advocate for a "complete diet" approach. Recommend that the user performs all available activities (Flashcards, Reading, Writing, Translation, and Custom Lessons).
The Value Prop: Briefly explain the synergy—how Flashcards fuel Reading, and Translation builds the bridge to Writing. Warn that skipping one creates a "blind spot" in their fluency.
The Missing Link (Speaking): Explicitly state that while the app doesn't currently support a speaking feature (it's in development!), it is vital. Recommend they shadow the audio in the Reading/Flashcard units and suggest external practice (e.g., recording themselves or using language partners).
The "Time-First" Logic
Inference over Interrogation: Do not ask for specific settings for every unit. Instead, identify the user's total daily/weekly time commitment.
Constraint-Based Planning: Use the user's time budget to calculate the "Loop."
Example: If a user has 30 minutes, suggest 10m Flashcards, 10m Reading/MCQ, and 10m alternating Writing/Translation.
Logical Defaults: Flashcards use a preset anki system, in it cards take roughly 10 seconds to review, and are doubled up (e.g. english to spanish, spanish to english), for each new card there will be around 7 review cards so keep this in mind when suggesting amount of new words per day and time it takes. Assume standard "best practices" for frequency (e.g., daily cards, alternating writing/translation) unless the user specifies otherwise.
Delivery Structure Present the proposal as a unified "Learning Blueprint" including:
The Weekly Rhythm: A high-level view of which activities happen on which days and their estimated frequencies.
The Daily Flow: A suggested sequence (Standard: Flashcards → Lesson → Reading → Translation → Writing).
Content Mix: For Reading/Writing, propose a "mix of topics" aligned with their North Star, but leave a placeholder (e.g., "We’ll start with a mix of News and Travel stories—let me know if you want to narrow this down").
Data Requirements for the Config Agent At the end of the conversation you will need to generate a tool call with the following technical configuration. Ensure your conversation naturally uncovers these without a checklist:
Flashcards: Daily volume, review caps (only if specifically requested by user), and frequency per week.
Reading: Content types (Story/News/etc.), duration, inclusion of MCQs, and frequency.
Writing/Translation: Time per session, translation direction (Native-to-Target/Target-to-Native), and frequency.
Custom Lesson: Placement within the loop relative to the Grammar Roadmap.

One note, for flashcards, give an estimation of how many words they will have learnt by end of there timeframe and comment on how much it aligns (e.g. maybe they need to increase their daily volume to reach their goal).
After presenting the recommended structure, ask the user: "Does this schedule feel sustainable for you, or should we adjust the intensity of any specific area?"

### Phase 6: Finalisation

Once the user has agreed to everything:
1. First call **update_user_preferences** to save their profile, level, preferences, and marking preferences.
2. Then call **create_grammar_roadmap** if they want a roadmap (most users will).
3. Then call **create_daily_loop** to set up their daily routine.

All three tool calls should happen at the end once you have all the information. Do not call them one at a time during the conversation.

### Style & Tone Guidelines

**Tone:** Professional, direct, super optimistic and friendly (not cringey, no slang, wholesome, humble). Be honest. 

**Direction:** Only ask one question at a time.

**Formatting:** Use ### for section headers and --- for transitions. **Bold** key terms.

**Pedagogy:** Briefly explain the "why" behind your recommendations (e.g., "We prioritize 'The Forge' because active production creates 4x more neural pathways than passive listening.")

**AI Speak:** Use the word "I" instead of "we" when speaking to the user, unless questioned directly, don't say things are AI generated, use phrasing like tailored to you, personalized, etc.


### App Context (mention when relevant):
- Activities in the loop can be repeated multiple times whenever
- User can also activate custom lessons and grammar lessons whenever they want
- Daily loop acts as the baseline but user is able to dive off and do many other different things if they want to learn more in a day
- There is a massive list of prebuilt grammar lessons that are also available outside of the daily loop
- User's vocabulary is stored, and spaced repetition is used for word learning
- At any point if the user is unhappy, their daily loop and end goal can be changed!
- User can always review old lessons, can generate custom lessons at any time, and can make any changes they want.

### Rules of Engagement

**User is Lead:** Offer recommendations, but always allow the user to modify the plan.

**No Walls of Text:** Keep explanations punchy and scannable.

**The Next Step:** Always end with a single, clear question or action to keep the onboarding moving.
`.trim();

// ============================================================================
// INTERNAL TOOL HELPERS
// ============================================================================

const INTERNAL_TOOL_SET = new Set<string>(ONBOARDING_TOOL_NAMES);

const INTERNAL_TOOL_STATUS: Record<string, string> = {
  update_user_preferences: 'Saving your preferences...',
  create_grammar_roadmap:
    'Building your grammar roadmap... this may take a moment.',
  create_daily_loop: 'Setting up your daily loop...',
  generate_roadmap_overview: 'Crafting your personalized roadmap overview...',
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class OnboardingAgentService {
  private readonly logger = new Logger(OnboardingAgentService.name);
  private llm: ChatAnthropic;

  /** Track state across tool calls within a single stream session */
  private sessionState: {
    userId?: string;
  } = {};

  constructor(private readonly prisma: PrismaService) {
    this.llm = new ChatAnthropic({
      model: 'claude-sonnet-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.7,
    });
  }

  // --------------------------------------------------------------------------
  // Tools
  // --------------------------------------------------------------------------

  private getTools() {
    const updateUserPreferences = tool(async (args) => JSON.stringify(args), {
      name: 'update_user_preferences',
      description:
        "Save the user's profile, assessed level, learning preferences, and marking preferences. Call this once you have gathered all the necessary information about the user. This creates or updates their User record and LanguageCourse.",
      schema: UpdateUserPreferencesToolSchema,
    });

    const createGrammarRoadmap = tool(async (args) => JSON.stringify(args), {
      name: 'create_grammar_roadmap',
      description:
        "Generate and save a grammar roadmap (curriculum) for the user. The roadmap is capped at 6 months. Call this after the user approves the roadmap overview. Include a detailed userGoal string that captures the user's objective, timeline, level, and any context.",
      schema: CreateGrammarRoadmapToolSchema,
    });

    const createDailyLoop = tool(async (args) => JSON.stringify(args), {
      name: 'create_daily_loop',
      description:
        "Set up the user's daily loop with the agreed-upon modules in order. Each module has a type, order, and config. Call this after the user approves their daily loop.",
      schema: CreateDailyLoopToolSchema,
    });

    return [updateUserPreferences, createGrammarRoadmap, createDailyLoop];
  }

  // --------------------------------------------------------------------------
  // Tool execution (test mode — just passes args through to frontend)
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Streaming chat
  // --------------------------------------------------------------------------

  private extractTextContent(aggregated: AIMessageChunk): string {
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
   * Stream the onboarding agent chat with an agentic loop.
   *
   * TEST MODE: Tool calls are NOT executed — instead their args are
   * emitted to the frontend as `tool_call` events so they can be reviewed.
   * A mock success is fed back to the LLM so it continues the conversation.
   *
   * Yields events:
   * - { type: 'content', content: string }
   * - { type: 'tool_call', toolName: string, args: Record<string, unknown> }
   * - { type: 'status', message: string }
   * - { type: 'done' }
   */
  async *streamChat(
    input: OnboardingChatInput,
  ): AsyncGenerator<
    | { type: 'content'; content: string }
    | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
    | { type: 'status'; message: string }
    | { type: 'done' }
  > {
    // Reset session state for this stream
    this.sessionState = { userId: input.userId };

    const currentMessages: BaseMessage[] = [
      new SystemMessage(ONBOARDING_SYSTEM_PROMPT),
      ...(input.chatHistory ?? [])
        .slice(-30)
        .map((msg) =>
          msg.role === 'user'
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content),
        ),
      new HumanMessage(input.userMessage),
    ];

    const tools = this.getTools();
    const llmWithTools = this.llm.bindTools(tools);

    // Agentic loop — keeps going for multiple tool calls
    const MAX_LOOPS = 6;

    for (let loop = 0; loop < MAX_LOOPS; loop++) {
      this.logger.debug(
        `Onboarding agent: streaming LLM (loop ${loop + 1})...`,
      );

      const stream = await llmWithTools.stream(currentMessages);
      let aggregated: AIMessageChunk | null = null;

      for await (const chunk of stream) {
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

      // Check for tool calls
      if (!aggregated?.tool_calls || aggregated.tool_calls.length === 0) {
        break; // No tool calls — done
      }

      // Process all tool calls — emit args to frontend, feed mock success back to LLM
      for (const toolCall of aggregated.tool_calls) {
        const toolName = toolCall.name;

        if (INTERNAL_TOOL_SET.has(toolName)) {
          // Log tool call args to console so they can be reviewed
          console.log('\n' + '='.repeat(80));
          console.log(`🔧 TOOL CALL: ${toolName}`);
          console.log('='.repeat(80));
          console.log(JSON.stringify(toolCall.args, null, 2));
          console.log('='.repeat(80) + '\n');

          // Emit tool args to frontend for review
          yield {
            type: 'tool_call',
            toolName,
            args: toolCall.args as Record<string, unknown>,
          };

          // Feed mock success back so the LLM can continue
          const mockResult = JSON.stringify({
            success: true,
            message: `[TEST MODE] ${toolName} received and displayed to user for review.`,
          });

          const aiMsg = new AIMessage({
            content: this.extractTextContent(aggregated),
            tool_calls: [
              {
                id: toolCall.id ?? '',
                name: toolCall.name,
                args: toolCall.args,
              },
            ],
          });

          const toolMsg = new ToolMessage({
            content: mockResult,
            tool_call_id: toolCall.id ?? '',
          });

          currentMessages.push(aiMsg, toolMsg);
        }
      }
    }

    yield { type: 'done' };
  }

  // --------------------------------------------------------------------------
  // Status check
  // --------------------------------------------------------------------------

  /**
   * Check if a user needs onboarding for any of their courses.
   * Returns the courseId that needs onboarding, or null.
   */
  async getOnboardingStatus(
    userId?: string,
  ): Promise<{ needsOnboarding: boolean; courseId?: string; userId?: string }> {
    if (!userId) {
      // No user yet — definitely needs onboarding
      return { needsOnboarding: true };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user || user.courses.length === 0) {
      return { needsOnboarding: true, userId };
    }

    const activeCourse = user.courses[0];
    if (!activeCourse.onboardingCompleted) {
      return {
        needsOnboarding: true,
        courseId: activeCourse.id,
        userId,
      };
    }

    return { needsOnboarding: false, courseId: activeCourse.id, userId };
  }
}
