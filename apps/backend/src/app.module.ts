import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FillInBlanksModule } from './modules/fill-in-blanks/fill-in-blanks.module';
import { LessonsModule } from './modules/lessons/lessons.module';

@Module({
  imports: [FillInBlanksModule, LessonsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
