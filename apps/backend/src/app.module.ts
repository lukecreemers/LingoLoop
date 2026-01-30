import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FillInBlanksModule } from './modules/fill-in-blanks/fill-in-blanks.module';

@Module({
  imports: [FillInBlanksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
