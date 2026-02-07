import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import type { SectionedLesson, LessonPlanUnit, CompiledUnit, CompiledSection } from 'src/shared';
import { UnitFactoryService } from './unit-factory.service';
import { buildLessonContext, type LessonContext } from './lesson.context';
import { parseLessonXml, extractXmlFromResponse, type ParsedSection } from './xml-parser.util';
import { LESSON_STRUCTURE_PROMPT_TEMPLATE } from 'src/testing/cases/lesson-structure.cases';
import { LESSON_UPDATE_STRUCTURE_PROMPT_TEMPLATE } from 'src/testing/cases/lesson-update-structure.cases';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// PROGRESS EVENT (used for SSE streaming)
// ============================================================================

export interface LessonProgressEvent {
  stage: 'structure' | 'parsing' | 'units' | 'summaries' | 'complete' | 'error';
  message: string;
  current?: number;
  total?: number;
}

// ============================================================================
// INPUT DTO
// ============================================================================

export interface CreateStructuredLessonDto {
  // User profile
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;

  // Lesson info
  lessonTitle: string;
  lessonDescription: string;

  // Context from learning journey (optional)
  weekTitle?: string;
  weekDescription?: string;
  weekLessonsSoFar?: Array<{ title: string; description: string }>;
  previousWeeksSummary?: string;
}

export interface LessonUpdateStructureDto {
  // User profile
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;

  // Lesson plan context (XML up to current point)
  lessonStructureSoFar: string;

  // The specific instruction from the tool call
  specificInstruction: string;

  // Conversation context (last 10 messages formatted as string)
  conversationContext: string;
}

// ============================================================================
// PIPELINE DEBUG OUTPUT
// ============================================================================

export interface UnitPipelineDebug {
  sectionIndex: number;
  unitIndex: number;
  unitType: string;
  unitName: string;
  prompt: string;
  output: unknown;
}

export interface LessonPipelineDebug {
  structurePrompt: string;
  rawXmlResponse: string;
  extractedXml: string;
  parsedSections: Array<{
    name: string;
    units: Array<{ type: string; name: string; instructions: string }>;
  }>;
  unitExecutions: UnitPipelineDebug[];
}

export interface StructuredLessonWithDebug {
  lesson: SectionedLesson;
  pipeline: LessonPipelineDebug;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class StructuredLessonService {
  private readonly logger = new Logger(StructuredLessonService.name);
  private llm: ChatAnthropic;

  constructor(private readonly unitFactory: UnitFactoryService) {
    this.llm = new ChatAnthropic({
      model: 'claude-sonnet-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 1,
    });
  }

  /**
   * Create a lesson using the new XML-based structure generation:
   * 1. Generate lesson structure as XML (with sections)
   * 2. Parse XML into sections with units
   * 3. Execute each unit via unit factory
   *
   * Returns SectionedLesson with full pipeline debug info
   */
  async createStructuredLesson(
    dto: CreateStructuredLessonDto,
    onProgress?: (event: LessonProgressEvent) => void,
  ): Promise<StructuredLessonWithDebug> {
    this.logger.log(`Creating structured lesson: "${dto.lessonTitle}"`);

    // Step 1: Generate lesson structure (XML)
    onProgress?.({ stage: 'structure', message: 'Creating lesson plan...' });
    const structurePrompt = this.buildStructurePrompt(dto);
    this.logger.debug('Generating lesson structure...');

    const response = await this.llm.invoke(structurePrompt);
    const rawXmlResponse =
      typeof response.content === 'string'
        ? response.content
        : String(response.content);

    // Step 2: Parse XML into sections with units
    onProgress?.({ stage: 'parsing', message: 'Analyzing lesson structure...' });
    this.logger.debug('Parsing XML structure...');
    const extractedXml = extractXmlFromResponse(rawXmlResponse);
    const parsedSections = parseLessonXml(extractedXml);

    const totalUnits = parsedSections.reduce(
      (sum, s) => sum + s.units.length,
      0,
    );
    this.logger.debug(
      `Parsed ${parsedSections.length} sections with ${totalUnits} total units`,
    );

    onProgress?.({
      stage: 'units',
      message: `Creating units (0/${totalUnits})`,
      current: 0,
      total: totalUnits,
    });

    // Step 3: Execute all units via unit factory with debug capture (PARALLEL)
    this.logger.debug('Executing units in parallel...');
    const context = buildLessonContext(
      dto.userLevel,
      dto.targetLanguage,
      dto.nativeLanguage,
    );

    // Build a flat list of all parsed units for lesson plan context
    const allParsedUnits = parsedSections.flatMap((s) =>
      s.units.map((u) => ({
        type: u.type,
        name: u.name,
        instructions: u.instructions,
        sectionName: s.name,
      })),
    );

    const { compiledSections, unitExecutions } =
      await this.executeSectionsWithDebug(
        parsedSections,
        allParsedUnits,
        context,
        onProgress,
      );

    this.logger.log(
      `Lesson created with ${compiledSections.length} sections, ${totalUnits} units`,
    );

    // Build the SectionedLesson
    const sectionInstruction = `${dto.lessonTitle}: ${dto.lessonDescription}`;

    const lesson: SectionedLesson = {
      input: {
        instructions: sectionInstruction,
        userLevel: dto.userLevel,
        targetLanguage: dto.targetLanguage,
        nativeLanguage: dto.nativeLanguage,
      },
      sectionInstructions: parsedSections.map((s) => s.name),
      sections: compiledSections,
    };

    // Build pipeline debug info
    const pipeline: LessonPipelineDebug = {
      structurePrompt,
      rawXmlResponse,
      extractedXml,
      parsedSections: parsedSections.map((s) => ({
        name: s.name,
        units: s.units.map((u) => ({
          type: u.type,
          name: u.name,
          instructions: u.instructions,
        })),
      })),
      unitExecutions,
    };

    // Save pipeline debug to file
    this.savePipelineDebug(dto.lessonTitle, pipeline);

    onProgress?.({ stage: 'complete', message: 'Lesson ready!' });

    return { lesson, pipeline };
  }

  // ============================================================================
  // LESSON UPDATE STRUCTURE (generate extra sections mid-lesson)
  // ============================================================================

  /**
   * Generate extra sections to insert into an existing lesson.
   * Called when the section chat's tool call triggers lesson-update-structure.
   *
   * 1. Generate update structure as XML (with the update prompt)
   * 2. Parse XML into sections with units
   * 3. Execute each unit via unit factory (with full lesson context)
   *
   * Returns an array of compiled sections ready to insert into the lesson.
   */
  async generateExtraSections(
    dto: LessonUpdateStructureDto,
    onProgress?: (event: LessonProgressEvent) => void,
  ): Promise<CompiledSection[]> {
    this.logger.log('Generating extra sections for lesson update...');

    // Step 1: Build and invoke the update structure prompt
    onProgress?.({ stage: 'structure', message: 'Planning extra practice...' });
    const prompt = this.buildUpdateStructurePrompt(dto);
    this.logger.debug('Invoking LLM for lesson update structure...');

    // ── Pipeline log: prompt ──
    console.log('\n' + '='.repeat(80));
    console.log('🔄 LESSON-UPDATE-STRUCTURE PIPELINE');
    console.log('='.repeat(80));
    console.log('📝 Specific Instruction:', dto.specificInstruction);
    console.log('💬 Conversation Context (last msgs):\n', dto.conversationContext);
    console.log('─'.repeat(80));
    console.log('📝 Full Update Prompt:\n', prompt);
    console.log('─'.repeat(80));

    const response = await this.llm.invoke(prompt);
    const rawXmlResponse =
      typeof response.content === 'string'
        ? response.content
        : String(response.content);

    // Step 2: Parse XML into sections
    onProgress?.({ stage: 'parsing', message: 'Analyzing practice structure...' });
    this.logger.debug('Parsing update structure XML...');
    const extractedXml = extractXmlFromResponse(rawXmlResponse);
    const parsedSections = parseLessonXml(extractedXml);

    const totalUnits = parsedSections.reduce(
      (sum, s) => sum + s.units.length,
      0,
    );
    this.logger.debug(
      `Parsed ${parsedSections.length} extra sections with ${totalUnits} total units`,
    );

    onProgress?.({
      stage: 'units',
      message: `Creating units (0/${totalUnits})`,
      current: 0,
      total: totalUnits,
    });

    // ── Pipeline log: XML & parsed ──
    console.log('📄 Raw XML Response:\n', rawXmlResponse);
    console.log('─'.repeat(80));
    console.log('🏷️  Extracted XML:\n', extractedXml);
    console.log('─'.repeat(80));
    console.log('📦 Parsed Sections:');
    parsedSections.forEach((s, si) => {
      console.log(`  Section ${si + 1}: ${s.name}`);
      s.units.forEach((u, ui) => {
        console.log(`    Unit ${ui + 1}: [${u.type}] ${u.name} — ${u.instructions.slice(0, 80)}`);
      });
    });
    console.log('─'.repeat(80));

    // Step 3: Execute all units via unit factory
    // Build context — include the full lesson plan so far so units are coherent
    const context = buildLessonContext(
      dto.userLevel,
      dto.targetLanguage,
      dto.nativeLanguage,
    );

    // Build flat list of parsed units for lesson plan context building
    const allParsedUnits = parsedSections.flatMap((s) =>
      s.units.map((u) => ({
        type: u.type,
        name: u.name,
        instructions: u.instructions,
        sectionName: s.name,
      })),
    );

    const { compiledSections, unitExecutions } = await this.executeSectionsWithDebug(
      parsedSections,
      allParsedUnits,
      {
        ...context,
        // Pass the existing lesson plan as context so generated units
        // are coherent with what the student has already done
        lessonPlanContext: dto.lessonStructureSoFar,
      },
      onProgress,
    );

    onProgress?.({ stage: 'complete', message: 'Extra practice ready!' });

    // ── Pipeline log: unit executions ──
    console.log('⚙️  Unit Executions:');
    unitExecutions.forEach((exec) => {
      console.log(`  S${exec.sectionIndex + 1} Unit ${exec.unitIndex + 1}: [${exec.unitType}] ${exec.unitName}`);
      console.log('    Prompt:', exec.prompt.slice(0, 200) + '...');
      console.log('    Output:', JSON.stringify(exec.output).slice(0, 300));
    });
    console.log('='.repeat(80));

    this.logger.log(
      `Extra sections generated: ${compiledSections.length} sections, ${totalUnits} units`,
    );

    return compiledSections;
  }

  /**
   * Build the prompt for lesson update structure generation
   */
  private buildUpdateStructurePrompt(dto: LessonUpdateStructureDto): string {
    return this.buildPrompt(LESSON_UPDATE_STRUCTURE_PROMPT_TEMPLATE, {
      userLevel: dto.userLevel,
      targetLanguage: dto.targetLanguage,
      nativeLanguage: dto.nativeLanguage,
      lessonStructureSoFar: dto.lessonStructureSoFar,
      specificInstruction: dto.specificInstruction,
      conversationContext: dto.conversationContext,
    });
  }

  /**
   * Save pipeline debug info to outputs folder
   */
  private savePipelineDebug(
    lessonTitle: string,
    pipeline: LessonPipelineDebug,
  ): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputDir = path.join(__dirname, '../../testing/outputs');

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `lesson-pipeline_${timestamp}.txt`;
      const filepath = path.join(outputDir, filename);

      // Build formatted output
      let output = '';
      output += '='.repeat(80) + '\n';
      output += `LESSON PIPELINE DEBUG: ${lessonTitle}\n`;
      output += `Generated: ${new Date().toISOString()}\n`;
      output += '='.repeat(80) + '\n\n';

      // Structure prompt
      output += '─'.repeat(80) + '\n';
      output += '📝 STRUCTURE PROMPT\n';
      output += '─'.repeat(80) + '\n';
      output += pipeline.structurePrompt + '\n\n';

      // Raw XML response
      output += '─'.repeat(80) + '\n';
      output += '📄 RAW XML RESPONSE\n';
      output += '─'.repeat(80) + '\n';
      output += pipeline.rawXmlResponse + '\n\n';

      // Extracted XML
      output += '─'.repeat(80) + '\n';
      output += '🏷️ EXTRACTED XML\n';
      output += '─'.repeat(80) + '\n';
      output += pipeline.extractedXml + '\n\n';

      // Parsed sections summary
      output += '─'.repeat(80) + '\n';
      output += '📦 PARSED SECTIONS SUMMARY\n';
      output += '─'.repeat(80) + '\n';
      pipeline.parsedSections.forEach((section, si) => {
        output += `\nSection ${si + 1}: ${section.name}\n`;
        section.units.forEach((unit, ui) => {
          output += `  ${ui + 1}. [${unit.type}] ${unit.name}\n`;
          output += `     Instructions: ${unit.instructions.slice(0, 100)}...\n`;
        });
      });
      output += '\n';

      // Unit executions
      output += '─'.repeat(80) + '\n';
      output += '⚙️ UNIT EXECUTIONS\n';
      output += '─'.repeat(80) + '\n\n';

      pipeline.unitExecutions.forEach((unit) => {
        output += '┌' + '─'.repeat(78) + '┐\n';
        output += `│ SECTION ${unit.sectionIndex + 1} / UNIT ${unit.unitIndex + 1}: ${unit.unitName} (${unit.unitType})\n`;
        output += '├' + '─'.repeat(78) + '┤\n';
        output += '│ PROMPT:\n';
        output += '└' + '─'.repeat(78) + '┘\n';
        output += unit.prompt + '\n\n';
        output += '┌' + '─'.repeat(78) + '┐\n';
        output += '│ OUTPUT:\n';
        output += '└' + '─'.repeat(78) + '┘\n';
        output += JSON.stringify(unit.output, null, 2) + '\n\n';
      });

      fs.writeFileSync(filepath, output);
      this.logger.log(`📁 Pipeline debug saved to: ${filename}`);
    } catch (error) {
      this.logger.warn(`Failed to save pipeline debug: ${error}`);
    }
  }

  /**
   * Build lesson plan context XML up to and including a specific global unit index.
   * Now includes section structure.
   */
  private buildLessonPlanContext(
    allParsedUnits: Array<{
      type: string;
      name: string;
      instructions: string;
      sectionName: string;
    }>,
    upToGlobalIndex: number,
  ): string {
    const unitsToInclude = allParsedUnits.slice(0, upToGlobalIndex + 1);

    let context = '<lesson_plan>\n';
    let currentSection = '';
    unitsToInclude.forEach((unit, i) => {
      if (unit.sectionName !== currentSection) {
        if (currentSection) {
          context += `  </section>\n`;
        }
        currentSection = unit.sectionName;
        context += `  <section name="${unit.sectionName}">\n`;
      }
      const isCurrent = i === upToGlobalIndex;
      context += `    <unit index="${i + 1}" type="${unit.type}" name="${unit.name}"${isCurrent ? ' status="CURRENT"' : ' status="completed"'}>\n`;
      context += `      <instructions>${unit.instructions}</instructions>\n`;
      context += `    </unit>\n`;
    });
    if (currentSection) {
      context += `  </section>\n`;
    }
    context += '</lesson_plan>';

    return context;
  }

  /**
   * Generate a learning summary for a section using AI.
   */
  private async generateSectionSummary(
    sectionName: string,
    unitInstructions: string[],
    context: LessonContext,
  ): Promise<string> {
    const summaryLlm = new ChatAnthropic({
      model: 'claude-haiku-4-5',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.7,
    });

    const unitList = unitInstructions
      .map((instr, i) => `${i + 1}. ${instr}`)
      .join('\n');

    const prompt = `You are summarizing what a ${context.userLevel} student learned in a language lesson section.

Section: "${sectionName}"
Target language: ${context.targetLanguage}
Native language: ${context.nativeLanguage}

The section covered these topics/activities:
${unitList}

Write a short, friendly checklist of what the student learned and practiced.
Format it as a brief intro line followed by markdown bullet points. Use "✓" as the bullet marker.

Example format:
Great work! In this section you covered:
✓ How to conjugate regular -ar verbs in present tense
✓ Common greetings and introductions
✓ Using "ser" vs "estar" in context

Rules:
- Use second person ("you")
- Be specific about actual language concepts, vocabulary, or grammar covered
- Each bullet should be a concise but informative learning point
- Do NOT just copy unit names — synthesize into clear learning outcomes
- Keep it to 3-6 bullet points maximum
- The intro line should be warm and encouraging (1 short sentence)`;

    try {
      const response = await summaryLlm.invoke(prompt);
      return typeof response.content === 'string'
        ? response.content
        : String(response.content);
    } catch (error) {
      this.logger.warn(`Failed to generate section summary: ${error}`);
      return `You completed the "${sectionName}" section!`;
    }
  }

  /**
   * Execute all sections and their units in PARALLEL, capturing debug info.
   * All units across all sections run concurrently for maximum speed.
   * Accepts an optional progress callback for SSE streaming.
   */
  private async executeSectionsWithDebug(
    parsedSections: ParsedSection[],
    allParsedUnits: Array<{
      type: string;
      name: string;
      instructions: string;
      sectionName: string;
    }>,
    baseContext: LessonContext,
    onProgress?: (event: LessonProgressEvent) => void,
  ): Promise<{
    compiledSections: CompiledSection[];
    unitExecutions: UnitPipelineDebug[];
  }> {
    // Build the full lesson plan context once (all units can see the full plan)
    const fullLessonPlanContext = this.buildLessonPlanContext(
      allParsedUnits,
      allParsedUnits.length - 1,
    );

    const contextWithPlan: LessonContext = {
      ...baseContext,
      lessonPlanContext: baseContext.lessonPlanContext || fullLessonPlanContext,
    };

    // Flatten all units with their section/unit indices
    const totalUnits = allParsedUnits.length;
    let completedCount = 0;

    interface UnitTask {
      sectionIndex: number;
      unitIndex: number;
      parsedUnit: { type: string; name: string; instructions: string };
      unitPlan: LessonPlanUnit;
    }

    const tasks: UnitTask[] = parsedSections.flatMap((section, sectionIndex) =>
      section.units.map((parsedUnit, unitIndex) => ({
        sectionIndex,
        unitIndex,
        parsedUnit,
        unitPlan: {
          type: parsedUnit.type,
          instructions: parsedUnit.instructions,
        } as LessonPlanUnit,
      })),
    );

    // Execute ALL units AND section summaries in parallel
    // Summaries only depend on instructions (not unit results), so they can run concurrently
    const summaryPromises = parsedSections.map((section) =>
      this.generateSectionSummary(
        section.name,
        section.units.map((u) => u.instructions),
        contextWithPlan,
      ),
    );

    const unitPromises = tasks.map(async (task) => {
      const prompt = this.unitFactory.buildUnitPrompt(
        task.unitPlan,
        contextWithPlan,
      );
      const result = await this.unitFactory.executeUnit(
        task.unitPlan,
        contextWithPlan,
      );

      completedCount++;
      onProgress?.({
        stage: 'units',
        message: `Creating units (${completedCount}/${totalUnits})`,
        current: completedCount,
        total: totalUnits,
      });

      return {
        ...task,
        prompt,
        result,
      };
    });

    // Run everything concurrently
    const [results, sectionSummaries] = await Promise.all([
      Promise.all(unitPromises),
      Promise.all(summaryPromises),
    ]);

    // Assemble results back into sections
    const unitExecutions: UnitPipelineDebug[] = results.map((r) => ({
      sectionIndex: r.sectionIndex,
      unitIndex: r.unitIndex,
      unitType: r.parsedUnit.type,
      unitName: r.parsedUnit.name,
      prompt: r.prompt,
      output: r.result.output,
    }));

    onProgress?.({
      stage: 'summaries',
      message: 'Finalizing...',
    });

    // Build compiled sections
    const compiledSections: CompiledSection[] = parsedSections.map(
      (section, sectionIndex) => {
        const sectionResults = results.filter(
          (r) => r.sectionIndex === sectionIndex,
        );
        // Sort by unitIndex to maintain order
        sectionResults.sort((a, b) => a.unitIndex - b.unitIndex);

        return {
          sectionInstruction: section.name,
          sectionIndex,
          unitPlans: sectionResults.map((r) => r.unitPlan),
          units: sectionResults.map((r) => r.result),
          learningSummary: sectionSummaries[sectionIndex],
        };
      },
    );

    return { compiledSections, unitExecutions };
  }

  /**
   * Build the prompt for structure generation
   */
  private buildStructurePrompt(dto: CreateStructuredLessonDto): string {
    // Build user info section
    const userInfo = `Level: ${dto.userLevel}
Target Language: ${dto.targetLanguage}
Native Language: ${dto.nativeLanguage}`;

    // Build week summary
    let weekSummary =
      'This is the first lesson of the week. No previous lessons yet.';
    if (dto.weekLessonsSoFar && dto.weekLessonsSoFar.length > 0) {
      weekSummary = dto.weekLessonsSoFar
        .map(
          (lesson, i) =>
            `Lesson ${i + 1}: ${lesson.title} - ${lesson.description}`,
        )
        .join('\n');
    }

    // Build previous weeks summary
    const previousWeekSummary =
      dto.previousWeeksSummary || 'No previous weeks yet.';

    // Build lesson overview
    const lessonOverview = `Lesson Title: ${dto.lessonTitle}
Description: ${dto.lessonDescription}`;

    // Replace placeholders in template
    return this.buildPrompt(LESSON_STRUCTURE_PROMPT_TEMPLATE, {
      userInfo,
      weekSummary,
      previousWeekSummary,
      lessonOverview,
    });
  }

  /**
   * Replace {{placeholders}} in template
   */
  private buildPrompt(
    template: string,
    values: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return values[key] ?? '';
    });
  }
}
