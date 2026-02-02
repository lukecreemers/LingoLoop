import { Body, Controller, Post } from '@nestjs/common';
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
import { RedoUnitDto } from 'src/shared/types/redo-unit.dto';
import { RedoSectionDto } from 'src/shared/types/redo-section.dto';
import { UnitFactoryService } from './unit-factory.service';
import { SectionedLessonsService } from './sectioned-lessons.service';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly unitFactoryService: UnitFactoryService,
    private readonly sectionedLessonsService: SectionedLessonsService,
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
}
