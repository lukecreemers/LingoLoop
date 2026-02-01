import * as fs from 'fs';
import * as path from 'path';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { ZodSchema } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export type ModelProvider = 'anthropic' | 'openai' | 'deepseek' | 'google';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  temperature?: number;
}

export interface TestCase<TInput> {
  name: string;
  description?: string;
  inputs: TInput;
}

export interface PromptTestConfig<
  TInput extends Record<string, string | number | string[]>,
  TOutput,
> {
  featureName: string;
  promptTemplate: string;
  outputSchema: ZodSchema<TOutput>;
  testCases: TestCase<TInput>[];
  models: ModelConfig[];
}

export interface TestResult<TOutput> {
  testName: string;
  model: string;
  success: boolean;
  output?: TOutput;
  error?: string;
  durationMs: number;
  prompt: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface TestSuiteResult<TOutput> {
  featureName: string;
  timestamp: string;
  results: TestResult<TOutput>[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    totalTimeMs: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
}

// ============================================================================
// PROMPT TESTER
// ============================================================================

export class PromptTester<
  TInput extends Record<string, string | number | string[]>,
  TOutput,
> {
  private config: PromptTestConfig<TInput, TOutput>;
  private outputDir: string;

  constructor(config: PromptTestConfig<TInput, TOutput>) {
    this.config = config;
    this.outputDir = path.join(process.cwd(), 'src', 'testing', 'outputs');
    this.ensureOutputDir();
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private buildPrompt(inputs: TInput): string {
    let prompt = this.config.promptTemplate;
    for (const [key, value] of Object.entries(inputs)) {
      const placeholder = `{{${key}}}`;
      const stringValue = Array.isArray(value)
        ? value.join(', ')
        : String(value);
      prompt = prompt.replaceAll(placeholder, stringValue);
    }
    return prompt;
  }

  private createModel(modelConfig: ModelConfig) {
    const { provider, model, temperature = 0.7 } = modelConfig;
    switch (provider) {
      case 'anthropic':
        return new ChatAnthropic({
          model,
          temperature,
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
      case 'openai':
        return new ChatOpenAI({
          model,
          temperature,
          apiKey: process.env.OPENAI_API_KEY,
        });
      case 'deepseek':
        return new ChatDeepSeek({
          model,
          temperature,
          apiKey: process.env.DEEPSEEK_API_KEY,
        });
      case 'google':
        return new ChatGoogleGenerativeAI({
          model,
          temperature,
          apiKey: process.env.GOOGLE_API_KEY,
        });
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async runSingleTest(
    testCase: TestCase<TInput>,
    modelConfig: ModelConfig,
  ): Promise<TestResult<TOutput>> {
    const startTime = Date.now();
    const modelName = `${modelConfig.provider}/${modelConfig.model}`;
    const prompt = this.buildPrompt(testCase.inputs);

    try {
      const model = this.createModel(modelConfig);
      const structuredModel = model.withStructuredOutput(
        this.config.outputSchema,
        { includeRaw: true },
      );
      const response = await structuredModel.invoke(prompt);

      // Extract token usage from the raw response metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usageMetadata = (response.raw as any)?.usage_metadata;
      const inputTokens = usageMetadata?.input_tokens as number | undefined;
      const outputTokens = usageMetadata?.output_tokens as number | undefined;

      return {
        testName: testCase.name,
        model: modelName,
        success: true,
        output: response.parsed as TOutput,
        durationMs: Date.now() - startTime,
        prompt,
        inputTokens,
        outputTokens,
      };
    } catch (error) {
      return {
        testName: testCase.name,
        model: modelName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
        prompt,
      };
    }
  }

  /**
   * Run all tests in PARALLEL and save results to file
   */
  async run(): Promise<TestSuiteResult<TOutput>> {
    const startTime = Date.now();

    console.log(
      `\n⚡ Running ${this.config.testCases.length} tests in parallel...`,
    );

    // Build and run all test promises in parallel
    const testPromises: Promise<TestResult<TOutput>>[] = [];
    for (const modelConfig of this.config.models) {
      for (const testCase of this.config.testCases) {
        testPromises.push(this.runSingleTest(testCase, modelConfig));
      }
    }

    const results = await Promise.all(testPromises);
    const totalTimeMs = Date.now() - startTime;

    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalInputTokens = results.reduce(
      (sum, r) => sum + (r.inputTokens ?? 0),
      0,
    );
    const totalOutputTokens = results.reduce(
      (sum, r) => sum + (r.outputTokens ?? 0),
      0,
    );

    const suiteResult: TestSuiteResult<TOutput> = {
      featureName: this.config.featureName,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        totalTimeMs,
        totalInputTokens,
        totalOutputTokens,
      },
    };

    // Save to file
    const filePath = this.saveResults(suiteResult);

    // Print summary to console
    this.printSummary(suiteResult, filePath);

    return suiteResult;
  }

  private saveResults(suiteResult: TestSuiteResult<TOutput>): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const featureSlug = this.config.featureName
      .toLowerCase()
      .replace(/\s+/g, '-');
    const fileName = `${featureSlug}_${timestamp}.txt`;
    const filePath = path.join(this.outputDir, fileName);

    let content = '';
    content += `${'='.repeat(80)}\n`;
    content += `PROMPT TEST RESULTS: ${this.config.featureName}\n`;
    content += `Timestamp: ${suiteResult.timestamp}\n`;
    content += `${'='.repeat(80)}\n\n`;

    for (const result of suiteResult.results) {
      const status = result.success ? 'PASS' : 'FAIL';
      content += `${'─'.repeat(80)}\n`;
      content += `[${status}] ${result.testName}\n`;
      content += `Model: ${result.model} | Duration: ${result.durationMs}ms\n`;
      if (
        result.inputTokens !== undefined ||
        result.outputTokens !== undefined
      ) {
        content += `Tokens: ${result.inputTokens ?? '?'} in / ${result.outputTokens ?? '?'} out\n`;
      }
      content += `${'─'.repeat(80)}\n\n`;

      content += `PROMPT:\n${result.prompt}\n\n`;

      if (result.success && result.output) {
        content += `OUTPUT:\n${JSON.stringify(result.output, null, 2)}\n`;
      } else {
        content += `ERROR:\n${result.error}\n`;
      }
      content += '\n\n';
    }

    content += `${'='.repeat(80)}\n`;
    content += `SUMMARY\n`;
    content += `${'='.repeat(80)}\n`;
    content += `Total: ${suiteResult.summary.total}\n`;
    content += `Passed: ${suiteResult.summary.passed}\n`;
    content += `Failed: ${suiteResult.summary.failed}\n`;
    content += `Success Rate: ${((suiteResult.summary.passed / suiteResult.summary.total) * 100).toFixed(1)}%\n`;
    content += `Total Time: ${(suiteResult.summary.totalTimeMs / 1000).toFixed(2)}s\n`;
    content += `Total Tokens: ${suiteResult.summary.totalInputTokens} in / ${suiteResult.summary.totalOutputTokens} out\n`;

    fs.writeFileSync(filePath, content);
    return filePath;
  }

  private printSummary(
    suiteResult: TestSuiteResult<TOutput>,
    filePath: string,
  ) {
    const { summary, results } = suiteResult;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${this.config.featureName.toUpperCase()} - RESULTS`);
    console.log(`${'='.repeat(60)}\n`);

    for (const result of results) {
      const icon = result.success ? '✅' : '❌';
      const tokens =
        result.inputTokens !== undefined
          ? ` | ${result.inputTokens}/${result.outputTokens} tokens`
          : '';
      console.log(
        `${icon} ${result.testName} (${result.durationMs}ms${tokens})`,
      );
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(
      `Total: ${summary.total} | ✅ ${summary.passed} | ❌ ${summary.failed}`,
    );
    console.log(`Time: ${(summary.totalTimeMs / 1000).toFixed(2)}s`);
    console.log(
      `Tokens: ${summary.totalInputTokens} in / ${summary.totalOutputTokens} out`,
    );
    console.log(`${'─'.repeat(60)}`);
    console.log(`\n📁 Full outputs: ${filePath}\n`);
  }
}
