import { Module } from '@nestjs/common';
import { OnboardingAgentController } from './onboarding-agent.controller';
import { OnboardingAgentService } from './onboarding-agent.service';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [TimelineModule],
  controllers: [OnboardingAgentController],
  providers: [OnboardingAgentService],
  exports: [OnboardingAgentService],
})
export class OnboardingAgentModule {}





