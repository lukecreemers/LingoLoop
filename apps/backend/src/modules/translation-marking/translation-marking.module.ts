import { Module } from '@nestjs/common';
import { TranslationMarkingController } from './translation-marking.controller';
import { TranslationMarkingService } from './translation-marking.service';

@Module({
  controllers: [TranslationMarkingController],
  providers: [TranslationMarkingService],
  exports: [TranslationMarkingService],
})
export class TranslationMarkingModule {}

