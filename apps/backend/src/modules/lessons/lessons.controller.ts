import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LessonsService } from './lessons.service';
import {
  CompiledLesson,
  CompiledLessonSchema,
  CompiledUnit,
  CompiledUnitSchema,
  SectionedLessonSchema,
  CompiledSectionSchema,
} from 'src/shared';
import type { SectionedLesson, CompiledSection } from 'src/shared';
import { ZodResponse } from 'src/common/decorators/zod-response.decorator';
import { CreateLessonDto } from 'src/shared/types/create-lesson/create-lesson.dto';
import { CreateStructuredLessonDto } from 'src/shared/types/create-structured-lesson.dto';
import { RedoUnitDto } from 'src/shared/types/redo-unit.dto';
import { RedoSectionDto } from 'src/shared/types/redo-section.dto';
import { UnitFactoryService } from './unit-factory.service';
import { SectionedLessonsService } from './sectioned-lessons.service';
import { StructuredLessonService } from './structured-lesson.service';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly unitFactoryService: UnitFactoryService,
    private readonly sectionedLessonsService: SectionedLessonsService,
    private readonly structuredLessonService: StructuredLessonService,
  ) {}

  // ============================================================================
  // ORIGINAL SINGLE-STAGE LESSON CREATION (kept for backwards compatibility)
  // ============================================================================

  @Post('create-custom')
  @ZodResponse(CompiledLessonSchema)
  async createCustomLesson(
    @Body() body: CreateLessonDto,
  ): Promise<CompiledLesson> {
    return this.lessonsService.createCustomLesson(body);
  }

  @Post('redo-unit')
  @ZodResponse(CompiledUnitSchema)
  async redoUnit(@Body() body: RedoUnitDto): Promise<CompiledUnit> {
    return this.unitFactoryService.redoUnit({
      unitPlan: body.unitPlan,
      previousOutput: body.previousOutput,
      userLevel: body.userLevel,
      targetLanguage: body.targetLanguage ?? 'Spanish',
      nativeLanguage: body.nativeLanguage ?? 'English',
    });
  }

  // ============================================================================
  // NEW MULTI-STAGE SECTIONED LESSON CREATION
  // ============================================================================

  @Post('create-sectioned')
  @ZodResponse(SectionedLessonSchema)
  async createSectionedLesson(
    @Body() body: CreateLessonDto,
  ): Promise<SectionedLesson> {
    return this.sectionedLessonsService.createSectionedLesson(body);
  }

  @Post('redo-section')
  @ZodResponse(CompiledSectionSchema)
  async redoSection(@Body() body: RedoSectionDto): Promise<CompiledSection> {
    return this.sectionedLessonsService.redoSection(
      body.lesson,
      body.sectionIndex,
    );
  }

  // ============================================================================
  // NEW XML-BASED STRUCTURED LESSON CREATION
  // ============================================================================

  @Post('create-structured')
  async createStructuredLesson(
    @Body() body: CreateStructuredLessonDto,
  ) {
    // Returns { lesson, pipeline } with full debug info
    return this.structuredLessonService.createStructuredLesson(body);
  }

  // ============================================================================
  // SSE STREAMING STRUCTURED LESSON CREATION (with progress events)
  // ============================================================================

  @Post('create-structured-stream')
  async createStructuredLessonStream(
    @Body() body: CreateStructuredLessonDto,
    @Res() res: Response,
  ) {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const result = await this.structuredLessonService.createStructuredLesson(
        body,
        (event) => {
          // Stream progress events to client
          res.write(`data: ${JSON.stringify({ type: 'progress', ...event })}\n\n`);
        },
      );

      // Send the final result
      res.write(`data: ${JSON.stringify({ type: 'result', data: result })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: String(error) })}\n\n`,
      );
      res.end();
    }
  }
}
