import { Controller, Post } from '@nestjs/common';
import { FIBOutput, FIBOutputSchema } from '../../shared';
import { ZodResponse } from '../../common/decorators/zod-response.decorator';
import { FillInBlanksService } from './fill-in-blanks.service';

@Controller('fill-in-blanks')
export class FillInBlanksController {
  constructor(private readonly fillInBlanksService: FillInBlanksService) {}

  @Post()
  @ZodResponse(FIBOutputSchema)
  async createQuestion(): Promise<FIBOutput> {
    return this.fillInBlanksService.createQuestion();
  }
}
