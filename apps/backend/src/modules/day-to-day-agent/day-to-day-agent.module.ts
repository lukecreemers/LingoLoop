import { Module } from '@nestjs/common';
import { DayToDayAgentController } from './day-to-day-agent.controller';
import { DayToDayAgentService } from './day-to-day-agent.service';

@Module({
  controllers: [DayToDayAgentController],
  providers: [DayToDayAgentService],
  exports: [DayToDayAgentService],
})
export class DayToDayAgentModule {}

