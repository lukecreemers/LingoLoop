import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FillInBlanksModule } from './modules/fill-in-blanks/fill-in-blanks.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { TranslationMarkingModule } from './modules/translation-marking/translation-marking.module';
import { AiAssistModule } from './modules/ai-assist/ai-assist.module';
import { TtsModule } from './modules/tts/tts.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { DayToDayAgentModule } from './modules/day-to-day-agent/day-to-day-agent.module';
import { DailyLoopModule } from './modules/daily-loop/daily-loop.module';
import { OnboardingAgentModule } from './modules/onboarding-agent/onboarding-agent.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FillInBlanksModule,
    LessonsModule,
    TranslationMarkingModule,
    AiAssistModule,
    TtsModule,
    TimelineModule,
    DayToDayAgentModule,
    DailyLoopModule,
    OnboardingAgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
