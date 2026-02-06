import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import type { SectionedLesson, LessonPlanUnit, CompiledUnit, CompiledSection } from 'src/shared';
import { UnitFactoryService } from './unit-factory.service';
import { buildLessonContext, type LessonContext } from './lesson.context';
import { parseLessonXml, extractXmlFromResponse, type ParsedSection } from './xml-parser.util';
import { LESSON_STRUCTURE_PROMPT_TEMPLATE } from 'src/testing/cases/lesson-structure.cases';
import * as fs from 'fs';
import * as path from 'path';

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
  ): Promise<StructuredLessonWithDebug> {
    this.logger.log(`Creating structured lesson: "${dto.lessonTitle}"`);

    // Step 1: Generate lesson structure (XML)
    const structurePrompt = this.buildStructurePrompt(dto);
    this.logger.debug('Generating lesson structure...');

    const response = await this.llm.invoke(structurePrompt);
    const rawXmlResponse =
      typeof response.content === 'string'
        ? response.content
        : String(response.content);

    // Step 2: Parse XML into sections with units
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

    // Step 3: Execute all units via unit factory with debug capture
    this.logger.debug('Executing units...');
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
      await this.executeSectionsWithDebug(parsedSections, allParsedUnits, context);

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

    return { lesson, pipeline };
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
   * Execute all sections and their units sequentially, capturing debug info.
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
  ): Promise<{
    compiledSections: CompiledSection[];
    unitExecutions: UnitPipelineDebug[];
  }> {
    const unitExecutions: UnitPipelineDebug[] = [];
    const compiledSections: CompiledSection[] = [];

    let globalUnitIndex = 0;

    for (
      let sectionIndex = 0;
      sectionIndex < parsedSections.length;
      sectionIndex++
    ) {
      const section = parsedSections[sectionIndex];
      const compiledUnits: CompiledUnit[] = [];
      const unitPlans: LessonPlanUnit[] = [];

      for (let unitIndex = 0; unitIndex < section.units.length; unitIndex++) {
        const parsedUnit = section.units[unitIndex];
        const unitPlan: LessonPlanUnit = {
          type: parsedUnit.type,
          instructions: parsedUnit.instructions,
        };
        unitPlans.push(unitPlan);

        // Build context with lesson plan up to this unit
        const lessonPlanContext = this.buildLessonPlanContext(
          allParsedUnits,
          globalUnitIndex,
        );

        const contextWithPlan: LessonContext = {
          ...baseContext,
          lessonPlanContext,
        };

        // Use unit factory
        const prompt = this.unitFactory.buildUnitPrompt(
          unitPlan,
          contextWithPlan,
        );
        const result = await this.unitFactory.executeUnit(
          unitPlan,
          contextWithPlan,
        );

        unitExecutions.push({
          sectionIndex,
          unitIndex,
          unitType: parsedUnit.type,
          unitName: parsedUnit.name,
          prompt,
          output: result.output,
        });

        compiledUnits.push(result);
        globalUnitIndex++;
      }

      compiledSections.push({
        sectionInstruction: section.name,
        sectionIndex,
        unitPlans,
        units: compiledUnits,
      });
    }

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
