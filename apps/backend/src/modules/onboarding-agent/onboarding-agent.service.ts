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
import { CurriculumService } from '../timeline/curriculum.service';
import {
  UpdateUserPreferencesToolSchema,
  CreateGrammarRoadmapToolSchema,
  CreateDailyLoopToolSchema,
  GenerateRoadmapOverviewToolSchema,
  ONBOARDING_TOOL_NAMES,
  type OnboardingChatInput,
  type UpdateUserPreferencesTool,
  type CreateGrammarRoadmapTool,
  type CreateDailyLoopTool,
  type GenerateRoadmapOverviewTool,
  type RoadmapOverview,
} from '../../shared/types/onboarding-agent.types';
import type { DailyModuleType, UserLevel } from '@prisma/client';

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const ONBOARDING_SYSTEM_PROMPT = `
Role: You are tasked with the onboarding of a new user for a language app. Your name is Maestro.

### Phase 1: The Tactical Opening & Discovery

**The Hook:** Start with a warm greeting, explain the goal of the conversation and some insight into the app. Then gauge their level and information.

**The Probe:** Do not ask for their "level." Ask about their experience (For how long? What tools they have been using? etc).

**Language Check:** Immediately follow up with one targeted question in their target language (unless they are an absolute beginner) to see how they handle it.

**The Constraint:** Ask only one question and wait for their response.

### Phase 2: Defining the "North Star"

**The Transparency:** Explain that to build the right plan, you need to understand the "Why."

**The Goal:** Identify their specific objective (e.g., "Moving to Madrid in 6 months" or "Reading Japanese literature").

**Guidance:**
- For Beginners: Suggest a milestone like the 30-Day Social Survival Sprint.
- For Advanced: Ask for a specific high-stakes scenario they want to master.

### Phase 3: The Curriculum Roadmap

After the user has defined their north star, if it makes sense for that specific user, generate a Master Curriculum Roadmap broken into phases (e.g., Week 1: Alphabet, Pronunciation, and Basic Greetings, Week 2: Food Vocabulary and Ordering Conversations).

The majority of users will need this if they have a north star — something to work for — but there will be users that are not interested in this feature. Give a bit of push back to users that are not interested and explain that the content taught in the curriculum is fed into other exercises, and not having one may detract the overall quality of the learning, but if the user is specific that they only want to practice say reading or writing etc. then that is fine.

For this stage you need to figure out the general topics that need to be covered and the user's dedication level (how many lessons per week they plan to do).

**Important limitation:** The roadmap is currently capped at **6 months maximum**. Let the user know that this is the initial roadmap and that it can be extended or restructured at any time as they progress. If the user's goal would take longer than 6 months (e.g., fluency might take 2 years), explain that this overview covers the first 6 months of their journey.

**Roadmap Overview:** Once you have enough context about the user's goal and level, call the **generate_roadmap_overview** tool. This generates a beautiful visual card showing where the user is now, the topics and concepts they will learn, and what they will know by the end. Present this to the user and check that they are happy with the general direction. If they want to add, remove, or reorder topics, discuss changes and call the tool again with updated context.

**The Detailed Roadmap:** Once the user approves the overview, call the create_grammar_roadmap tool, only feed in instructions on what the curriculum can cover up to that 6 month max. If you think that they can only learn so much, those are the instructions you feed in.

**Logic:** Explain that each phase in this roadmap will feed one "Custom Lesson" into their Daily Loop every day. Also explain that there will be daily review lessons to reinforce learning from other days.

**Information Gathering** If the user seems unsure of what they want to learn or how to get there, direct the conversation and give them thoughts on what you think they should learn and check if it sounds good.

**How lessons work** The curriculum develops an amount of lessons per week, each lesson is 15-20 minutes long, and there will also be review lessons. Review lessons are essential and regardless of the user speed of learning are required. This means for dedicated users they will have higher amounts of weekly review lessons, whereas a more lowkey user will have less weekly lessons and less review lessons.

**Limitations with app** Lessons are part of a daily loop, so depends on the daily loop and dedication of user.

**Don't give timeline breakdowns** When you are reflecting what you think the roadmap will look like, do not breakdown into weeks or phases. Just mention the things you think are achievable within the timeframe (e.g. within 6 months). There is a future agent that will breakdown the user goal into actual individual lessons and timeframes that is much more capable than you. Also don't repeat information, you have a roadmap overview generator, when calling this tool, it will display the information of the timeline overview, do not regurtate that information.

### Phase 4: Marking strictness
Ask about marking preferences — how strict should we be? Do they care about accents and punctuation in exercises? This helps us calibrate the experience.


### Phase 5: The Daily Workout (The Loop)

After the user has defined their north star and grammar roadmap, propose a Daily Loop. This will depend on the user but here are the things you have access to:

- **Flashcards** (pulls in an amount of words and review words)
- **Reading** (either stories or conversations around a certain theme or topic)
- **Writing practice** (gives a custom prompt the user will answer and get marked on for use of grammar etc.)
- **Translation practice** (gives the user something in English or vice versa to translate)
- **Custom lesson node** (lesson from their overall grammar master roadmap, only availlable if they have a grammar roadmap).

Think about the user's needs and structure this in the way that will optimise their learning.

In general, the flow of a daily loop should be as follows: "Flashcards" -> "Custom lesson" -> "Reading" -> "Translation practice" -> "Writing practice"
Reccomend that the user should do all of these, be very clear about the benefits of all of them and what the user will be missing out on if they don't do them.
And also mention that at the moment we don't have a speaking feature, talk about the importance of this, reccomend the user speaks while reading or
other tips you have for them, but make it clear they should be trying to do this outside of the app (give some reccomendations), also mention this is a 
planned future feature for the app.


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

### App Context (mention when relevant):
- Activities in the loop can be repeated multiple times whenever
- User can also activate custom lessons and grammar lessons whenever they want
- Daily loop acts as the baseline but user is able to dive off and do many other different things if they want to learn more in a day
- There is a massive list of prebuilt grammar lessons that are also available outside of the daily loop
- User's vocabulary is stored, and spaced repetition is used for word learning
- At any point if the user is unhappy, their daily loop and end goal can be changed!

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
  create_grammar_roadmap: 'Building your grammar roadmap... this may take a moment.',
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
    courseId?: string;
  } = {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculumService: CurriculumService,
  ) {
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
    const updateUserPreferences = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'update_user_preferences',
        description:
          "Save the user's profile, assessed level, learning preferences, and marking preferences. Call this once you have gathered all the necessary information about the user. This creates or updates their User record and LanguageCourse.",
        schema: UpdateUserPreferencesToolSchema,
      },
    );

    const createGrammarRoadmap = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'create_grammar_roadmap',
        description:
          "Generate and save a grammar roadmap (curriculum) for the user. The roadmap is capped at 6 months. Call this after the user approves the roadmap overview. Include a detailed userGoal string that captures the user's objective, timeline, level, and any context.",
        schema: CreateGrammarRoadmapToolSchema,
      },
    );

    const createDailyLoop = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'create_daily_loop',
        description:
          "Set up the user's daily loop with the agreed-upon modules in order. Each module has a type, order, and config. Call this after the user approves their daily loop.",
        schema: CreateDailyLoopToolSchema,
      },
    );

    const generateRoadmapOverview = tool(
      async (args) => JSON.stringify(args),
      {
        name: 'generate_roadmap_overview',
        description:
          "Generate a high-level overview of topics and concepts the user will learn. This does NOT include timeframes — a future agent handles that. It shows: where the user is now, what they will learn (topic areas with concepts), and what they will know by the end. Call this in Phase 3 once you understand the user's goal and current level. The overview is displayed as a beautiful visual card in the chat. After showing it, ask the user if they want to adjust anything before proceeding.",
        schema: GenerateRoadmapOverviewToolSchema,
      },
    );

    return [updateUserPreferences, createGrammarRoadmap, createDailyLoop, generateRoadmapOverview];
  }

  // --------------------------------------------------------------------------
  // Tool execution
  // --------------------------------------------------------------------------

  private async executeUpdateUserPreferences(
    args: UpdateUserPreferencesTool,
  ): Promise<string> {
    // User is already authenticated — just look them up and update name if provided
    if (!this.sessionState.userId) {
      return JSON.stringify({ error: 'No authenticated user in session.' });
    }

    let user = await this.prisma.user.findUnique({
      where: { id: this.sessionState.userId },
    });

    if (!user) {
      return JSON.stringify({ error: 'Authenticated user not found in database.' });
    }

    if (args.userName) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name: args.userName },
      });
    }

    // Upsert LanguageCourse
    const course = await this.prisma.languageCourse.upsert({
      where: {
        userId_targetLanguage: {
          userId: user.id,
          targetLanguage: args.targetLanguage,
        },
      },
      update: {
        level: args.level as UserLevel,
        preferences: args.preferences,
        markingPreferences: args.markingPreferences,
        nativeLanguage: args.nativeLanguage,
      },
      create: {
        userId: user.id,
        targetLanguage: args.targetLanguage,
        nativeLanguage: args.nativeLanguage,
        level: args.level as UserLevel,
        preferences: args.preferences,
        markingPreferences: args.markingPreferences,
        isActive: true,
        onboardingCompleted: false,
      },
    });

    this.sessionState.courseId = course.id;

    this.logger.log(
      `Saved user preferences: userId=${user.id}, courseId=${course.id}, level=${args.level}`,
    );

    return JSON.stringify({
      success: true,
      userId: user.id,
      courseId: course.id,
      message: `User preferences saved. Level: ${args.level}, Language: ${args.targetLanguage}.`,
    });
  }

  private async executeCreateGrammarRoadmap(
    args: CreateGrammarRoadmapTool,
  ): Promise<string> {
    if (!this.sessionState.courseId) {
      return JSON.stringify({
        error: 'No course found. Call update_user_preferences first.',
      });
    }

    try {
      // Generate curriculum using the existing service (capped at 6 months in the prompt)
      const goalWithCap = `${args.userGoal}\n\nIMPORTANT: Limit the roadmap to a maximum of 6 months (24 weeks). If the goal requires more time, focus on the most critical foundations and progression for the first 6 months.`;

      const curriculum = await this.curriculumService.generateCurriculum({
        userGoal: goalWithCap,
      });

      // Persist to database
      const roadmap = await this.prisma.roadmap.create({
        data: {
          courseId: this.sessionState.courseId,
          weeks: {
            create: curriculum.months.flatMap((month) =>
              month.weeks.map((week) => ({
                weekNumber: week.globalWeekIndex + 1,
                title: `${month.name} — ${week.name}`,
                description: week.description,
                lessons: {
                  create: week.lessons.map((lesson) => ({
                    title: lesson.name,
                    description: lesson.description,
                    isUserMade: false,
                    completed: false,
                  })),
                },
              })),
            ),
          },
        },
        include: {
          weeks: {
            include: { lessons: true },
            orderBy: { weekNumber: 'asc' },
          },
        },
      });

      this.logger.log(
        `Created roadmap: ${roadmap.id} with ${roadmap.weeks.length} weeks, ${curriculum.totalLessons} lessons`,
      );

      return JSON.stringify({
        success: true,
        roadmapId: roadmap.id,
        totalMonths: curriculum.totalMonths,
        totalWeeks: curriculum.totalWeeks,
        totalLessons: curriculum.totalLessons,
        message: `Grammar roadmap created: ${curriculum.totalMonths} months, ${curriculum.totalWeeks} weeks, ${curriculum.totalLessons} lessons.`,
      });
    } catch (error) {
      this.logger.error(`Failed to create roadmap: ${error}`);
      return JSON.stringify({
        error: `Failed to create roadmap: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private async executeCreateDailyLoop(
    args: CreateDailyLoopTool,
  ): Promise<string> {
    if (!this.sessionState.courseId) {
      return JSON.stringify({
        error: 'No course found. Call update_user_preferences first.',
      });
    }

    try {
      const dailyLoop = await this.prisma.dailyLoop.create({
        data: {
          courseId: this.sessionState.courseId,
          modules: {
            create: args.modules.map((mod) => ({
              type: mod.type as DailyModuleType,
              order: mod.order,
              config: mod.config as object,
            })),
          },
        },
        include: {
          modules: { orderBy: { order: 'asc' } },
        },
      });

      // Mark onboarding as complete
      await this.prisma.languageCourse.update({
        where: { id: this.sessionState.courseId },
        data: { onboardingCompleted: true },
      });

      this.logger.log(
        `Created daily loop: ${dailyLoop.id} with ${dailyLoop.modules.length} modules. Onboarding marked complete.`,
      );

      return JSON.stringify({
        success: true,
        dailyLoopId: dailyLoop.id,
        moduleCount: dailyLoop.modules.length,
        modules: dailyLoop.modules.map((m) => ({
          type: m.type,
          order: m.order,
        })),
        message: `Daily loop created with ${dailyLoop.modules.length} modules. Onboarding complete!`,
      });
    } catch (error) {
      this.logger.error(`Failed to create daily loop: ${error}`);
      return JSON.stringify({
        error: `Failed to create daily loop: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private async executeGenerateRoadmapOverview(
    args: GenerateRoadmapOverviewTool,
  ): Promise<{ result: string; overview?: RoadmapOverview }> {
    try {
      const opusLlm = new ChatAnthropic({
        model: 'claude-sonnet-4-20250514',
        apiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.5,
      });

      const overviewPrompt = `You are a language learning curriculum designer. Generate a high-level overview of WHAT the user needs to learn — the topics and concepts — without any timeframes or scheduling. A separate system will later break these into phases and individual lessons.

## Student Profile
- **Target Language:** ${args.targetLanguage}
- **Native Language:** ${args.nativeLanguage}
- **Current Level:** ${args.currentLevel}
- **Goal:** ${args.userGoal}
${args.additionalContext ? `- **Additional Context:** ${args.additionalContext}` : ''}

## What to generate
1. **currentSnapshot** — A short paragraph describing where the user is RIGHT NOW (what they already know or can do based on their level).
2. **endGoalSnapshot** — A short paragraph describing what the user will know/be able to do by the end of this curriculum (capped at 6 months of learning).
3. **topicAreas** — The major topic areas the curriculum will cover, ordered from foundational to advanced. Each topic area has a title, a short description of why it matters, and a list of specific concepts/skills covered.
4. **note** — (optional) Any important note, e.g. if the goal extends beyond 6 months and this only covers the first stretch.

## Output Format
Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "currentSnapshot": "Where the user is now...",
  "endGoalSnapshot": "What they'll be able to do by the end...",
  "topicAreas": [
    {
      "title": "Topic area name",
      "description": "Why this matters and what it covers in 1-2 sentences",
      "concepts": ["Specific concept 1", "Specific concept 2", "Specific concept 3"]
    }
  ],
  "note": "Optional note"
}

Generate 4-8 topic areas that logically progress from foundational to more complex skills. Be specific with concepts — not vague categories. Tailor everything to the user's specific goal. If the user's goal would realistically take longer than 6 months, scope this to what can be covered in 6 months and mention this in the note.`;

      const response = await opusLlm.invoke([
        new HumanMessage(overviewPrompt),
      ]);

      const responseText = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content
              .filter(
                (b): b is { type: 'text'; text: string } =>
                  typeof b === 'object' && b !== null && 'type' in b && b.type === 'text',
              )
              .map((b) => b.text)
              .join('')
          : '';

      // Parse the JSON response
      const cleanedJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      const overview: RoadmapOverview = JSON.parse(cleanedJson);

      this.logger.log(
        `Generated roadmap overview: ${overview.topicAreas.length} topic areas`,
      );

      return {
        result: JSON.stringify({
          success: true,
          overview,
          message: `Roadmap overview generated with ${overview.topicAreas.length} topic areas. The user can now review and request changes.`,
        }),
        overview,
      };
    } catch (error) {
      this.logger.error(`Failed to generate roadmap overview: ${error}`);
      return {
        result: JSON.stringify({
          error: `Failed to generate roadmap overview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }),
      };
    }
  }

  private async executeInternalTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    switch (name) {
      case 'update_user_preferences':
        return this.executeUpdateUserPreferences(
          args as unknown as UpdateUserPreferencesTool,
        );
      case 'create_grammar_roadmap':
        return this.executeCreateGrammarRoadmap(
          args as unknown as CreateGrammarRoadmapTool,
        );
      case 'create_daily_loop':
        return this.executeCreateDailyLoop(
          args as unknown as CreateDailyLoopTool,
        );
      // generate_roadmap_overview is handled separately in streamChat
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  }

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
   * All tools are internal — they auto-execute on the backend and
   * feed the result back to the LLM.
   *
   * Yields events:
   * - { type: 'content', content: string }
   * - { type: 'status', message: string }
   * - { type: 'onboarding_complete', courseId: string, userId: string }
   * - { type: 'done' }
   */
  async *streamChat(
    input: OnboardingChatInput,
  ): AsyncGenerator<
    | { type: 'content'; content: string }
    | { type: 'status'; message: string }
    | { type: 'roadmap_overview'; overview: RoadmapOverview }
    | { type: 'onboarding_complete'; courseId: string; userId: string }
    | { type: 'done' }
  > {
    // Reset session state for this stream
    this.sessionState = { userId: input.userId };

    const currentMessages: BaseMessage[] = [
      new SystemMessage(ONBOARDING_SYSTEM_PROMPT),
      ...(input.chatHistory ?? []).slice(-30).map((msg) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content),
      ),
      new HumanMessage(input.userMessage),
    ];

    const tools = this.getTools();
    const llmWithTools = this.llm.bindTools(tools);

    // Agentic loop — keeps going for multiple internal tool calls
    const MAX_LOOPS = 6; // up to 3 tools + follow-up responses
    let onboardingCompleted = false;

    for (let loop = 0; loop < MAX_LOOPS; loop++) {
      this.logger.debug(`Onboarding agent: streaming LLM (loop ${loop + 1})...`);

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

      // Process all tool calls in sequence (agent may call all 3 at once)
      for (const toolCall of aggregated.tool_calls) {
        const toolName = toolCall.name;

        if (INTERNAL_TOOL_SET.has(toolName)) {
          this.logger.log(
            `Onboarding agent: executing tool — ${toolName}`,
          );

          yield {
            type: 'status',
            message: INTERNAL_TOOL_STATUS[toolName] ?? `Running ${toolName}...`,
          };

          let toolResult: string;

          // Special handling for roadmap overview — emits a custom event
          if (toolName === 'generate_roadmap_overview') {
            const { result, overview } = await this.executeGenerateRoadmapOverview(
              toolCall.args as unknown as GenerateRoadmapOverviewTool,
            );
            toolResult = result;

            if (overview) {
              yield { type: 'roadmap_overview', overview };
            }
          } else {
            toolResult = await this.executeInternalTool(
              toolName,
              toolCall.args as Record<string, unknown>,
            );
          }

          // Check if this was the daily loop (last step = onboarding complete)
          if (toolName === 'create_daily_loop') {
            try {
              const result = JSON.parse(toolResult);
              if (result.success) {
                onboardingCompleted = true;
              }
            } catch {
              // ignore parse error
            }
          }

          // Build messages for the LLM to continue
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
            content: toolResult,
            tool_call_id: toolCall.id ?? '',
          });

          currentMessages.push(aiMsg, toolMsg);
        }
      }

      // If onboarding is complete, emit the event
      if (onboardingCompleted && this.sessionState.courseId && this.sessionState.userId) {
        yield {
          type: 'onboarding_complete',
          courseId: this.sessionState.courseId,
          userId: this.sessionState.userId,
        };
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



