import { Body, Controller, Post } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import {
  CompiledLesson,
  CompiledLessonSchema,
  CompiledUnit,
  CompiledUnitSchema,
} from 'src/shared';
import { ZodResponse } from 'src/common/decorators/zod-response.decorator';
import { CreateLessonDto } from 'src/shared/types/create-lesson/create-lesson.dto';
import { RedoUnitDto } from 'src/shared/types/redo-unit.dto';
import { UnitFactoryService } from './unit-factory.service';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly unitFactoryService: UnitFactoryService,
  ) {}

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
}
