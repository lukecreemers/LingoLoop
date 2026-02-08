import { Module } from '@nestjs/common';
import { TimelineController } from './timeline.controller';
import { CurriculumService } from './curriculum.service';

@Module({
  controllers: [TimelineController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class TimelineModule {}
