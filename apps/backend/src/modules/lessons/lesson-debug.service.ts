import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface DebugEntry {
  timestamp: string;
  stage: string;
  unitType?: string;
  sectionIndex?: number;
  unitIndex?: number;
  prompt?: string;
  rawResponse?: unknown;
  parsedOutput?: unknown;
  error?: string;
  errorStack?: string;
}

@Injectable()
export class LessonDebugService {
  private readonly logger = new Logger(LessonDebugService.name);
  private readonly outputDir: string;
  private currentSessionFile: string | null = null;
  private entries: DebugEntry[] = [];

  constructor() {
    this.outputDir = path.join(process.cwd(), 'src', 'testing', 'outputs');
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Start a new debug session for a lesson generation
   */
  startSession(instructions: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.currentSessionFile = path.join(
      this.outputDir,
      `lesson-debug_${timestamp}.txt`,
    );
    this.entries = [];

    this.addEntry({
      timestamp: new Date().toISOString(),
      stage: 'SESSION_START',
      prompt: `Instructions: ${instructions}`,
    });
  }

  /**
   * Log a stage 1 (topic breakdown) call
   */
  logTopicBreakdown(prompt: string, output?: unknown, error?: Error): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      stage: 'TOPIC_BREAKDOWN',
      prompt,
      parsedOutput: output,
      error: error?.message,
      errorStack: error?.stack,
    });
  }

  /**
   * Log a stage 2 (section generation) call
   */
  logSectionGeneration(
    sectionIndex: number,
    prompt: string,
    output?: unknown,
    error?: Error,
  ): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      stage: 'SECTION_GENERATION',
      sectionIndex,
      prompt,
      parsedOutput: output,
      error: error?.message,
      errorStack: error?.stack,
    });
  }

  /**
   * Log a stage 3 (unit execution) call
   */
  logUnitExecution(
    sectionIndex: number,
    unitIndex: number,
    unitType: string,
    prompt: string,
    rawResponse?: unknown,
    parsedOutput?: unknown,
    error?: Error,
  ): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      stage: 'UNIT_EXECUTION',
      sectionIndex,
      unitIndex,
      unitType,
      prompt,
      rawResponse,
      parsedOutput,
      error: error?.message,
      errorStack: error?.stack,
    });

    // Log errors immediately
    if (error) {
      this.logger.error(
        `Unit execution failed: Section ${sectionIndex}, Unit ${unitIndex} (${unitType})`,
      );
      this.logger.error(`Error: ${error.message}`);
    }
  }

  /**
   * End session and write to file
   */
  endSession(success: boolean): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      stage: success ? 'SESSION_SUCCESS' : 'SESSION_FAILED',
    });

    this.writeToFile();
  }

  private addEntry(entry: DebugEntry): void {
    this.entries.push(entry);
  }

  private writeToFile(): void {
    if (!this.currentSessionFile) return;

    const content = this.entries
      .map((entry) => {
        const lines: string[] = [
          `${'='.repeat(80)}`,
          `[${entry.timestamp}] ${entry.stage}`,
        ];

        if (entry.sectionIndex !== undefined) {
          lines.push(`Section: ${entry.sectionIndex}`);
        }
        if (entry.unitIndex !== undefined) {
          lines.push(`Unit: ${entry.unitIndex}`);
        }
        if (entry.unitType) {
          lines.push(`Type: ${entry.unitType}`);
        }

        if (entry.prompt) {
          lines.push('', '--- PROMPT ---', entry.prompt);
        }

        if (entry.rawResponse !== undefined) {
          lines.push(
            '',
            '--- RAW RESPONSE ---',
            JSON.stringify(entry.rawResponse, null, 2),
          );
        }

        if (entry.parsedOutput !== undefined) {
          lines.push(
            '',
            '--- PARSED OUTPUT ---',
            JSON.stringify(entry.parsedOutput, null, 2),
          );
        }

        if (entry.error) {
          lines.push('', '--- ERROR ---', entry.error);
          if (entry.errorStack) {
            lines.push('', '--- STACK ---', entry.errorStack);
          }
        }

        return lines.join('\n');
      })
      .join('\n\n');

    fs.writeFileSync(this.currentSessionFile, content, 'utf-8');
    this.logger.log(`Debug log written to: ${this.currentSessionFile}`);
  }
}

