import { Injectable } from '@nestjs/common';
import type { DailyLoop } from '../../shared/types/daily-loop.types';

/**
 * Daily Loop Service
 * Currently returns static data for testing.
 * In future: will generate personalised daily loops using AI + user data.
 */
@Injectable()
export class DailyLoopService {
  getDailyLoop(): DailyLoop {
    // Static data for testing - matches frontend constant
    return {
      date: new Date().toISOString().split('T')[0],
      dayNumber: 4,
      userProfile: {
        targetLanguage: 'Spanish',
        nativeLanguage: 'English',
        level: 'beginner',
        name: 'Alex',
      },
      dailyVocab: {
        newWords: [],
        reviewWords: [],
        grammarConcepts: [],
      },
      tasks: [],
      completedTaskIds: [],
    };
  }
}
