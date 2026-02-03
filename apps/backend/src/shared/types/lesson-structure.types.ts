import { z } from 'zod';
import { UnitTypeSchema, LessonPlanUnitSchema } from './custom-lesson-generation.types';

// ============================================================================
// LESSON STRUCTURE GENERATION INPUT
// ============================================================================

export const LessonStructureInputSchema = z.object({
  // User profile
  userLevel: z.string().describe('User proficiency level (beginner, intermediate, advanced)'),
  targetLanguage: z.string().describe('The language the user is learning'),
  nativeLanguage: z.string().describe('The user\'s native language'),
  
  // Lesson context
  lessonTitle: z.string().describe('Short title for this lesson'),
  lessonDescription: z.string().describe('Description of what this lesson covers'),
  
  // Learning journey context
  weekTitle: z.string().optional().describe('Title of the current week'),
  weekDescription: z.string().optional().describe('Description of the current week\'s focus'),
  weekLessonsSoFar: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional().describe('Previous lessons completed this week'),
  previousWeeksSummary: z.string().optional().describe('Summary of what was learned in previous weeks'),
});

export type LessonStructureInput = z.infer<typeof LessonStructureInputSchema>;

// ============================================================================
// PARSED UNIT FROM XML
// ============================================================================

export const ParsedUnitSchema = z.object({
  type: UnitTypeSchema,
  name: z.string().describe('Display name for this unit'),
  instructions: z.string().describe('Detailed instructions for the unit generator'),
});

export type ParsedUnit = z.infer<typeof ParsedUnitSchema>;

// ============================================================================
// LESSON STRUCTURE OUTPUT (after parsing XML)
// ============================================================================

export const LessonStructureOutputSchema = z.object({
  units: z.array(ParsedUnitSchema).describe('The parsed units from the XML'),
  rawXml: z.string().optional().describe('The raw XML output for debugging'),
});

export type LessonStructureOutput = z.infer<typeof LessonStructureOutputSchema>;

// ============================================================================
// UNIT NAMES FOR REFERENCE
// ============================================================================

export const UNIT_TYPE_NAMES: Record<z.infer<typeof UnitTypeSchema>, string> = {
  flashcard: 'Vocabulary flashcards',
  explanation: 'Concept explanation',
  fill_in_blanks: 'Multiple-choice fill-in',
  word_match: 'Matching exercise (2 columns)',
  write_in_blanks: 'User types answer (no choices)',
  translation: 'Translate paragraph/sentences',
  conversation: 'Scripted dialogue between 2 characters',
  writing_practice: 'Open-ended prompts',
  word_order: 'Unscramble words',
};

