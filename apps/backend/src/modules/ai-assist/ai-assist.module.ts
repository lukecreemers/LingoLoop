import { Module } from '@nestjs/common';
import { AiAssistController } from './ai-assist.controller';
import { AiAssistService } from './ai-assist.service';

@Module({
  controllers: [AiAssistController],
  providers: [AiAssistService],
  exports: [AiAssistService],
})
export class AiAssistModule {}

