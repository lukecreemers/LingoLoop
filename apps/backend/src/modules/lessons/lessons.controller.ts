import { Body, Controller, Post } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CompiledLesson, CompiledLessonSchema } from 'src/shared';
import { ZodResponse } from 'src/common/decorators/zod-response.decorator';
import { CreateLessonDto } from 'src/shared/types/create-lesson/create-lesson.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post('create-custom')
  @ZodResponse(CompiledLessonSchema)
  async createCustomLesson(
    @Body() body: CreateLessonDto,
  ): Promise<CompiledLesson> {
    return this.lessonsService.createCustomLesson(body);
  }
}
