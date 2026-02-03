import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FillInBlanksModule } from './modules/fill-in-blanks/fill-in-blanks.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { TranslationMarkingModule } from './modules/translation-marking/translation-marking.module';
import { AiAssistModule } from './modules/ai-assist/ai-assist.module';
import { TtsModule } from './modules/tts/tts.module';
import { TimelineModule } from './modules/timeline/timeline.module';

@Module({
  imports: [
    FillInBlanksModule,
    LessonsModule,
    TranslationMarkingModule,
    AiAssistModule,
    TtsModule,
    TimelineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
