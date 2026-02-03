/**
 * Full Timeline Pipeline Test
 *
 * Generates a complete learning timeline from user goals:
 * Initial Input → Months → Weeks (→ Lessons in future)
 *
 * Usage: npx ts-node src/testing/run-timeline-pipeline.ts
 */

import 'dotenv/config';
import { ChatAnthropic } from '@langchain/anthropic';
import * as fs from 'fs';
import * as path from 'path';
import {
  InitialToMonthsOutputSchema,
  MonthToWeeksOutputSchema,
  type TimelineUserInput,
  type TimelineFullOutput,
  type MonthNode,
  type WeekNode,
  type MonthBreakdownItem,
  type WeekBreakdownItem,
} from '../shared/types/timeline.types';
import { TL_INITIAL_TO_MONTHS_PROMPT_TEMPLATE } from './cases/timeline-initial-to-months.cases';
import { TL_MONTH_PROMPT_TEMPLATE } from './cases/timeline-month-breakdown.cases';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_INPUT: TimelineUserInput = {
  learningGoal:
    'I want to learn conversational Spanish so I can travel to Spain and have basic conversations with locals. I want to be able to order food, ask for directions, and have simple conversations about myself and my interests.',
  targetLanguage: 'Spanish',
  nativeLanguage: 'English',
  userLevel: 'beginner',
  totalMonths: 5,
  lessonsPerWeek: 5,
  additionalContext:
    'I have about 30 minutes per day to study. I learn best through practical examples rather than pure grammar drills.',
};

// ============================================================================
// PIPELINE
// ============================================================================

class TimelinePipeline {
  private llm: ChatAnthropic;
  private logs: string[] = [];

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.6,
    });
  }

  private log(message: string) {
    console.log(message);
    this.logs.push(message);
  }

  private buildPrompt(
    template: string,
    values: Record<string, string | number>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return String(values[key] ?? '');
    });
  }

  /**
   * STAGE 0: Generate months from initial user input
   */
  async generateMonthsFromInput(
    input: TimelineUserInput,
  ): Promise<MonthBreakdownItem[]> {
    const prompt = this.buildPrompt(TL_INITIAL_TO_MONTHS_PROMPT_TEMPLATE, {
      learningGoal: input.learningGoal,
      targetLanguage: input.targetLanguage,
      nativeLanguage: input.nativeLanguage,
      userLevel: input.userLevel,
      totalMonths: input.totalMonths,
      additionalContext:
        input.additionalContext || 'No additional context provided.',
    });

    const structuredLlm = this.llm.withStructuredOutput(
      InitialToMonthsOutputSchema,
    );
    const result = await structuredLlm.invoke(prompt);
    return result.months;
  }

  /**
   * Build a summary of all months for context
   */
  private buildAllMonthsSummary(
    months: MonthBreakdownItem[],
    currentMonthIndex: number,
  ): string {
    return months
      .map((month, idx) => {
        const marker = idx + 1 === currentMonthIndex ? ' (current month)' : '';
        return `Month ${idx + 1}: ${month.title}${marker}\n  → ${month.description}`;
      })
      .join('\n\n');
  }

  /**
   * STAGE 1: Break a month into 4 weeks (with context of all months)
   */
  async breakMonthIntoWeeks(
    months: MonthBreakdownItem[],
    monthIndex: number,
    input: TimelineUserInput,
  ): Promise<WeekBreakdownItem[]> {
    const currentMonth = months[monthIndex];
    const allMonthsSummary = this.buildAllMonthsSummary(months, monthIndex + 1);

    const prompt = this.buildPrompt(TL_MONTH_PROMPT_TEMPLATE, {
      learningGoal: input.learningGoal,
      userLevel: input.userLevel,
      targetLanguage: input.targetLanguage,
      nativeLanguage: input.nativeLanguage,
      additionalContext:
        input.additionalContext || 'No additional context provided.',
      currentMonthIndex: monthIndex + 1,
      currentMonthTitle: currentMonth.title,
      currentMonthDescription: currentMonth.description,
      totalMonths: input.totalMonths,
      allMonthsSummary,
    });

    const structuredLlm = this.llm.withStructuredOutput(
      MonthToWeeksOutputSchema,
    );
    const result = await structuredLlm.invoke(prompt);
    return result.weeks;
  }

  /**
   * Run the pipeline up to weeks (no lessons yet)
   */
  async run(input: TimelineUserInput): Promise<TimelineFullOutput> {
    this.log('═'.repeat(80));
    this.log('TIMELINE PIPELINE - FULL RUN');
    this.log('═'.repeat(80));
    this.log(`\nUser Goal: ${input.learningGoal.slice(0, 80)}...`);
    this.log(`Language: ${input.targetLanguage} | Level: ${input.userLevel}`);
    this.log(
      `Duration: ${input.totalMonths} months | ${input.lessonsPerWeek} lessons/week\n`,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 0: Generate Months from User Input
    // ─────────────────────────────────────────────────────────────────────────
    this.log('─'.repeat(80));
    this.log('STAGE 0: Generating Months from User Goals');
    this.log('─'.repeat(80));

    const monthItems = await this.generateMonthsFromInput(input);

    this.log(`\n✅ Generated ${monthItems.length} months:\n`);
    monthItems.forEach((month, idx) => {
      this.log(`📅 Month ${idx + 1}: ${month.title}`);
      this.log(`   ${month.description.slice(0, 100)}...`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 1: Break Months into Weeks (PARALLEL)
    // ─────────────────────────────────────────────────────────────────────────
    this.log('\n' + '─'.repeat(80));
    this.log('STAGE 1: Breaking Months → Weeks (PARALLEL)');
    this.log('─'.repeat(80));
    this.log(`\n⚡ Processing ${monthItems.length} months in parallel...`);

    // Process all months in parallel
    const monthResults = await Promise.all(
      monthItems.map(async (_, monthIdx) => {
        const weekItems = await this.breakMonthIntoWeeks(
          monthItems,
          monthIdx,
          input,
        );
        return { monthIdx, weekItems };
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Build Output Structure
    // ─────────────────────────────────────────────────────────────────────────
    let globalWeekIndex = 0;
    const months: MonthNode[] = monthResults
      .sort((a, b) => a.monthIdx - b.monthIdx)
      .map(({ monthIdx, weekItems }) => {
        const monthData = monthItems[monthIdx];

        this.log(`\n📅 Month ${monthIdx + 1}: ${monthData.title}`);

        const weeks: WeekNode[] = weekItems.map((weekItem, weekIdx) => {
          this.log(`   └─ Week ${weekIdx + 1}: ${weekItem.title}`);
          this.log(`      ${weekItem.description.slice(0, 60)}...`);

          const week: WeekNode = {
            weekIndex: weekIdx,
            globalWeekIndex: globalWeekIndex++,
            title: weekItem.title,
            description: weekItem.description,
            lessons: [], // Will be populated in future stage
          };
          return week;
        });

        const monthNode: MonthNode = {
          monthIndex: monthIdx,
          title: monthData.title,
          description: monthData.description,
          weeks,
        };
        return monthNode;
      });

    const output: TimelineFullOutput = {
      input,
      totalMonths: months.length,
      totalWeeks: globalWeekIndex,
      totalLessons: 0, // Will be populated when lessons are generated
      months,
    };

    this.log('\n' + '═'.repeat(80));
    this.log('PIPELINE COMPLETE (UP TO WEEKS)');
    this.log('═'.repeat(80));
    this.log(
      `\n✅ Generated ${output.totalMonths} months with ${output.totalWeeks} total weeks`,
    );
    this.log(`📝 Lessons not yet generated (next stage)\n`);

    return output;
  }

  getLogs(): string {
    return this.logs.join('\n');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();
  const pipeline = new TimelinePipeline();

  try {
    const result = await pipeline.run(TEST_INPUT);

    // Save output to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save full JSON output
    const jsonPath = path.join(outputDir, `timeline-full_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

    // Save human-readable summary
    const summaryPath = path.join(outputDir, `timeline-full_${timestamp}.txt`);
    let summary = pipeline.getLogs();
    summary += '\n\n' + '═'.repeat(80);
    summary += '\nFULL OUTPUT (JSON)\n';
    summary += '═'.repeat(80) + '\n\n';
    summary += JSON.stringify(result, null, 2);
    fs.writeFileSync(summaryPath, summary);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n📁 Output saved to:`);
    console.log(`   • ${jsonPath}`);
    console.log(`   • ${summaryPath}`);
    console.log(`\n⏱️  Total time: ${duration}s`);
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    process.exit(1);
  }
}

main();
