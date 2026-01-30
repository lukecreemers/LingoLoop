import { Module } from '@nestjs/common';
import { FillInBlanksController } from './fill-in-blanks.controller';
import { FillInBlanksService } from './fill-in-blanks.service';

@Module({
  controllers: [FillInBlanksController],
  providers: [FillInBlanksService]
})
export class FillInBlanksModule {}
