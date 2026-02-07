import { Module } from '@nestjs/common';
import { DailyLoopController } from './daily-loop.controller';
import { DailyLoopService } from './daily-loop.service';
import { ReadingGenerationService } from './reading-generation.service';

@Module({
  controllers: [DailyLoopController],
  providers: [DailyLoopService, ReadingGenerationService],
  exports: [DailyLoopService],
})
export class DailyLoopModule {}
