/**
 * Curriculum Generation Pipeline
 *
 * Single-step generation of an entire curriculum from user goal.
 * Outputs XML which is then parsed into structured JSON.
 *
 * Usage: npx ts-node src/testing/run-curriculum-pipeline.ts
 */

import 'dotenv/config';
import { ChatAnthropic } from '@langchain/anthropic';
import * as fs from 'fs';
import * as path from 'path';
import { CURRICULUM_PROMPT_TEMPLATE } from './cases/curriculum-generation.cases';
import {
  parseCurriculumXml,
  extractCurriculumXml,
} from '../modules/timeline/curriculum-parser.util';
import type { Curriculum } from '../shared/types/curriculum.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// const TEST_USER_GOAL = `I am currently B1 and want to get to B2 Spanish in around 3 months. I want it to be fun and interesting. I am using this with the goal to move to Spain and be able to talk to people. I know a few of the tenses but regularly make mistakes and stuff.`;
const TEST_USER_GOAL = `I am a complete beginner in Spanish. I have 1 month before a trip to Mexico and want to be able to have basic conversations - ordering food, asking directions, introducing myself, and understanding simple responses. I have about 30 minutes per day to study.`;
// ============================================================================
// PIPELINE
// ============================================================================

class CurriculumPipeline {
  private llm: ChatAnthropic;
  private logs: string[] = [];

  constructor() {
    this.llm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 1,
      maxTokens: 40000,
    });
  }

  private log(message: string) {
    console.log(message);
    this.logs.push(message);
  }

  private buildPrompt(userGoal: string): string {
    return CURRICULUM_PROMPT_TEMPLATE.replace('{{userGoal}}', userGoal);
  }

  async run(userGoal: string): Promise<Curriculum> {
    this.log('═'.repeat(80));
    this.log('CURRICULUM GENERATION - SINGLE STEP');
    this.log('═'.repeat(80));
    this.log(`\nUser Goal: ${userGoal.slice(0, 100)}...\n`);

    // Step 1: Generate curriculum XML
    this.log('─'.repeat(80));
    this.log('Generating curriculum XML...');
    this.log('─'.repeat(80));

    const prompt = this.buildPrompt(userGoal);

    // Use streaming for long requests
    let rawResponse = '';
    const stream = await this.llm.stream(prompt);
    for await (const chunk of stream) {
      const content =
        typeof chunk.content === 'string'
          ? chunk.content
          : chunk.content.map((c) => ('text' in c ? c.text : '')).join('');
      rawResponse += content;
      process.stdout.write('.'); // Progress indicator
    }
    console.log(''); // New line after dots

    this.log('\n✅ Received XML response\n');

    // Save raw response before parsing
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const rawPath = path.join(outputDir, `curriculum_raw_${timestamp}.xml`);
    fs.writeFileSync(rawPath, rawResponse);
    this.log(`📄 Raw XML saved to: ${rawPath}\n`);

    // Step 2: Parse XML
    this.log('─'.repeat(80));
    this.log('Parsing XML...');
    this.log('─'.repeat(80));

    const xml = extractCurriculumXml(rawResponse);
    const curriculum = parseCurriculumXml(xml, userGoal);

    this.log(`\n✅ Parsed curriculum:`);
    this.log(`   • ${curriculum.totalMonths} months`);
    this.log(`   • ${curriculum.totalWeeks} weeks`);
    this.log(`   • ${curriculum.totalLessons} lessons\n`);

    // Log structure
    for (const month of curriculum.months) {
      this.log(`\n📅 Month ${month.monthIndex + 1}: ${month.name}`);
      this.log(`   ${month.description.slice(0, 80)}...`);

      for (const week of month.weeks) {
        this.log(`   └─ Week ${week.weekIndex + 1}: ${week.name}`);
        this.log(`      ${week.description.slice(0, 60)}...`);

        for (const lesson of week.lessons) {
          this.log(`      └─ Lesson ${lesson.lessonIndex + 1}: ${lesson.name}`);
        }
      }
    }

    this.log('\n' + '═'.repeat(80));
    this.log('PIPELINE COMPLETE');
    this.log('═'.repeat(80));

    return curriculum;
  }

  getLogs(): string {
    return this.logs.join('\n');
  }

  getRawXml(): string {
    return this.logs.join('\n');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();
  const pipeline = new CurriculumPipeline();

  try {
    const result = await pipeline.run(TEST_USER_GOAL);

    // Save output to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save full JSON output
    const jsonPath = path.join(outputDir, `curriculum_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

    // Save human-readable summary
    const summaryPath = path.join(outputDir, `curriculum_${timestamp}.txt`);
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
