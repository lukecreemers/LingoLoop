// ============================================================================
// DAILY LOOP TYPES
// The daily loop is a set of tasks the user completes each day.
// Tasks: custom_lesson, review, flashcards, reading, writing
// ============================================================================

import type { SectionedLesson } from './sectioned-lesson.types';
import type { CompiledUnit } from './custom-lesson-generation.types';
import type { FlashcardItem } from './flashcard.types';
import type { WPOutput } from './writing-practice.types';

// ============================================================================
// TASK TYPES
// ============================================================================

export type DailyTaskType =
  | 'custom_lesson'
  | 'review'
  | 'flashcards'
  | 'reading'
  | 'writing';

export type DailyTaskStatus = 'locked' | 'available' | 'in_progress' | 'completed';

// ============================================================================
// DAILY VOCAB (shared source for flashcards, reading, and writing)
// The flashcards ARE the daily vocab. Reading + writing inject these words.
// ============================================================================

export interface DailyVocabWord {
  word: string;
  definition: string;
  example?: string;
  exampleTranslation?: string;
}

export interface DailyVocab {
  /** New words the user is learning today (same as flashcard new words) */
  newWords: DailyVocabWord[];
  /** Review words from previous days (same as flashcard review words) */
  reviewWords: DailyVocabWord[];
  /** Grammar concepts from past lessons to reinforce */
  grammarConcepts: string[];
}

// ============================================================================
// READING TYPES
// ============================================================================

/** Activities the user can do after reading — configured per-user */
export type ReadingActivityType = 'mcq' | 'translate_phrases';

export interface ReadingComprehensionQuestion {
  question: string;
  questionTranslation: string;
  options: string[];
  correctIndex: number;
}

/** A phrase from the reading for the translation activity */
export interface TranslatePhrase {
  /** The phrase in target language (from the reading) */
  phrase: string;
  /** Correct translation in native language */
  translation: string;
  /** The surrounding sentence/context it appeared in */
  context: string;
}

export interface ReadingPassage {
  title: string;
  titleTranslation: string;
  type: 'conversation' | 'newsletter' | 'story' | 'article';
  /** Markdown-formatted reading content (fully translatable — user can tap any word) */
  content: string;
  /** Key vocabulary highlighted in the passage */
  targetVocab: Array<{
    word: string;
    definition: string;
  }>;
  /** MCQ comprehension questions (used if 'mcq' is in activities config) */
  comprehensionQuestions: ReadingComprehensionQuestion[];
  /** Phrases to translate (used if 'translate_phrases' is in activities config) */
  translatePhrases: TranslatePhrase[];
}

// ============================================================================
// INDIVIDUAL TASK TYPES (discriminated union)
// ============================================================================

interface DailyTaskBase {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  order: number;
}

export interface CustomLessonTask extends DailyTaskBase {
  type: 'custom_lesson';
  /** Reference to roadmap lesson */
  lessonRef: {
    monthIndex: number;
    weekIndex: number;
    lessonIndex: number;
    lessonName: string;
  };
  /** Inline lesson data for static testing */
  lessonData: SectionedLesson;
}

export interface ReviewTask extends DailyTaskBase {
  type: 'review';
  /** Where these review units came from */
  sourceDescription: string;
  /** The units to review (typically difficulty 2-3 from past lessons) */
  reviewUnits: CompiledUnit[];
}

export interface FlashcardsTask extends DailyTaskBase {
  type: 'flashcards';
  config: {
    newWordsPerDay: number;
    reviewWordsPerDay: number;
  };
  newCards: FlashcardItem[];
  reviewCards: FlashcardItem[];
}

export interface ReadingTask extends DailyTaskBase {
  type: 'reading';
  config: {
    contentType: 'conversation' | 'newsletter' | 'story' | 'article';
    length: 'short' | 'medium' | 'long';
    /**
     * Which activities to show after reading. User-configurable.
     * Empty array = read-only (no activities).
     * e.g. ['mcq', 'translate_phrases'] or ['mcq'] or []
     */
    activities: ReadingActivityType[];
  };
  passage: ReadingPassage;
}

export interface WritingTask extends DailyTaskBase {
  type: 'writing';
  config: {
    promptCount: number;
    length: 'short' | 'medium' | 'long';
  };
  writingExercise: WPOutput;
  /** Words the user should try to use (same as daily vocab) */
  targetVocab: string[];
  /** Grammar/concepts to practice (from daily vocab grammar concepts) */
  targetConcepts: string[];
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type DailyTask =
  | CustomLessonTask
  | ReviewTask
  | FlashcardsTask
  | ReadingTask
  | WritingTask;

// ============================================================================
// DAILY LOOP (the full day's work)
// ============================================================================

export interface DailyLoop {
  date: string;
  dayNumber: number; // Day X of the user's journey
  userProfile: {
    targetLanguage: string;
    nativeLanguage: string;
    level: string;
    name: string;
  };
  /**
   * Shared vocabulary for the day.
   * Flashcards use this directly. Reading + writing are injected with these words.
   */
  dailyVocab: DailyVocab;
  tasks: DailyTask[];
  /** IDs of completed tasks (persisted) */
  completedTaskIds: string[];
}
