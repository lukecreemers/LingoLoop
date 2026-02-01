import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { UnitFactoryService } from './unit-factory.service';

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, UnitFactoryService],
})
export class LessonsModule {}
