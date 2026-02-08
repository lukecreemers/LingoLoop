import { Module } from '@nestjs/common';
import { OnboardingAgentController } from './onboarding-agent.controller';
import { OnboardingAgentService } from './onboarding-agent.service';

@Module({
  controllers: [OnboardingAgentController],
  providers: [OnboardingAgentService],
  exports: [OnboardingAgentService],
})
export class OnboardingAgentModule {}





