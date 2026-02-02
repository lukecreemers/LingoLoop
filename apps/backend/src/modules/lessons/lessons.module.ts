import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { UnitFactoryService } from './unit-factory.service';
import { SectionedLessonsService } from './sectioned-lessons.service';
import { LessonDebugService } from './lesson-debug.service';

@Module({
  controllers: [LessonsController],
  providers: [
    LessonsService,
    UnitFactoryService,
    SectionedLessonsService,
    LessonDebugService,
  ],
})
export class LessonsModule {}
