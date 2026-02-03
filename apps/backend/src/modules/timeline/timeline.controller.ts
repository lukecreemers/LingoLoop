import { Body, Controller, Get, Post } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CurriculumService } from './curriculum.service';
import type { GenerateCurriculumDto } from './curriculum.service';
import type { Curriculum } from 'src/shared/types/curriculum.types';

// Static data path - used for demo/fallback
const STATIC_CURRICULUM_PATH = path.join(
  process.cwd(),
  'src/testing/outputs/curriculum_latest.json',
);

@Controller('timeline')
export class TimelineController {
  constructor(private readonly curriculumService: CurriculumService) {}

  /**
   * Get the current curriculum (static for now, will be user-specific later)
   */
  @Get()
  getCurriculum(): Curriculum {
    try {
      // Try to load saved curriculum
      if (fs.existsSync(STATIC_CURRICULUM_PATH)) {
        const data = fs.readFileSync(STATIC_CURRICULUM_PATH, 'utf-8');
        return JSON.parse(data);
      }

      // Return empty curriculum if none exists
      return {
        userGoal: '',
        totalMonths: 0,
        totalWeeks: 0,
        totalLessons: 0,
        months: [],
      };
    } catch (error) {
      console.error('Failed to load curriculum:', error);
      throw error;
    }
  }

  /**
   * Generate a new curriculum from user goal
   */
  @Post('generate')
  async generateCurriculum(
    @Body() body: GenerateCurriculumDto,
  ): Promise<Curriculum> {
    const curriculum = await this.curriculumService.generateCurriculum(body);

    // Save as the latest curriculum
    try {
      const outputDir = path.join(process.cwd(), 'src/testing/outputs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(
        STATIC_CURRICULUM_PATH,
        JSON.stringify(curriculum, null, 2),
      );
    } catch (error) {
      console.error('Failed to save curriculum:', error);
    }

    return curriculum;
  }
}
