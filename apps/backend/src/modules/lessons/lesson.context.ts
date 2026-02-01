/**
 * Lesson Context - Contains user profile and learning data
 *
 * NOTE: These are temporary placeholders. In the future, these values will be:
 * - userWordList: Retrieved from a spaced repetition database tracking words the user is learning
 * - userGrammarList: Retrieved from user progress tracking their grammar focus areas
 * - Other profile data may come from authenticated user sessions
 */

export interface LessonContext {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  userWordList: string[];
  userGrammarList: string[];
}

/**
 * Default word list for Spanish learners
 * Covers common vocabulary across beginner/intermediate levels
 */
export const DEFAULT_WORD_LIST: string[] = [
  // Household & Common Objects
  'mesa',
  'silla',
  'ventana',
  'libro',
  'casa',
  'puerta',
  // People & Relationships
  'amigo',
  'familia',
  'persona',
  // Time & Frequency
  'mañana',
  'noche',
  'día',
  'ayer',
  'siempre',
  // Adjectives
  'feliz',
  'verde',
  'grande',
  'pequeño',
  // Intermediate Verbs
  'lograr',
  'aprovechar',
  'desarrollar',
  'soportar',
  // Abstract/Intermediate
  'extraño',
  'actual',
  'rincón',
  'cotidiano',
  'alrededor',
];

/**
 * Default grammar focus points
 */
export const DEFAULT_GRAMMAR_LIST: string[] = [
  'present tense regular verbs',
  'definite articles (el, la, los, las)',
  'adjective agreement',
  'question formation',
  'ser vs estar basics',
];

/**
 * Build a lesson context from DTO and defaults
 */
export function buildLessonContext(
  userLevel: string,
  targetLanguage: string,
  nativeLanguage: string,
  wordList?: string[],
  grammarList?: string[],
): LessonContext {
  return {
    userLevel,
    targetLanguage,
    nativeLanguage,
    userWordList: wordList ?? DEFAULT_WORD_LIST,
    userGrammarList: grammarList ?? DEFAULT_GRAMMAR_LIST,
  };
}
