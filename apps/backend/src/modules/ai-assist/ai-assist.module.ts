import { Module } from '@nestjs/common';
import { AiAssistController } from './ai-assist.controller';
import { AiAssistService } from './ai-assist.service';
import { LessonsModule } from '../lessons/lessons.module';

@Module({
  imports: [LessonsModule],
  controllers: [AiAssistController],
  providers: [AiAssistService],
  exports: [AiAssistService],
})
export class AiAssistModule {}

