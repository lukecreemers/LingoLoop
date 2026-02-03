import type {
  Curriculum,
  CurriculumMonth,
  CurriculumWeek,
  CurriculumLesson,
} from 'src/shared/types/curriculum.types';

/**
 * Parse curriculum XML into structured data
 *
 * Expected format:
 * <curriculum>
 *   <Month name="..." description="...">
 *     <Week name="..." description="...">
 *       <Lesson name="...">bullet points</Lesson>
 *     </Week>
 *   </Month>
 * </curriculum>
 */
export function parseCurriculumXml(xml: string, userGoal: string): Curriculum {
  // Extract content inside <curriculum> tags
  const curriculumMatch = xml.match(/<curriculum>([\s\S]*?)<\/curriculum>/i);
  if (!curriculumMatch) {
    throw new Error('No <curriculum> tags found in XML output');
  }

  const curriculumContent = curriculumMatch[1];
  const months: CurriculumMonth[] = [];

  // Match all <Month> tags
  const monthRegex =
    /<Month\s+name=["']([^"']+)["']\s+description=["']([^"']+)["']\s*>([\s\S]*?)<\/Month>/gi;

  let monthMatch;
  let monthIndex = 0;
  let globalWeekIndex = 0;
  let globalLessonIndex = 0;

  while ((monthMatch = monthRegex.exec(curriculumContent)) !== null) {
    const [, monthName, monthDescription, monthContent] = monthMatch;

    const weeks: CurriculumWeek[] = [];

    // Match all <Week> tags within this month
    const weekRegex =
      /<Week\s+name=["']([^"']+)["']\s+description=["']([^"']+)["']\s*>([\s\S]*?)<\/Week>/gi;

    let weekMatch;
    let weekIndex = 0;

    while ((weekMatch = weekRegex.exec(monthContent)) !== null) {
      const [, weekName, weekDescription, weekContent] = weekMatch;

      const lessons: CurriculumLesson[] = [];

      // Match all <Lesson> tags within this week
      const lessonRegex =
        /<Lesson\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/Lesson>/gi;

      let lessonMatch;
      let lessonIndex = 0;

      while ((lessonMatch = lessonRegex.exec(weekContent)) !== null) {
        const [, lessonName, lessonDescription] = lessonMatch;

        lessons.push({
          name: lessonName.trim(),
          description: lessonDescription.trim(),
          lessonIndex,
          globalLessonIndex: globalLessonIndex++,
        });

        lessonIndex++;
      }

      weeks.push({
        name: weekName.trim(),
        description: weekDescription.trim(),
        weekIndex,
        globalWeekIndex: globalWeekIndex++,
        lessons,
      });

      weekIndex++;
    }

    months.push({
      name: monthName.trim(),
      description: monthDescription.trim(),
      monthIndex,
      weeks,
    });

    monthIndex++;
  }

  if (months.length === 0) {
    throw new Error('No valid <Month> tags found in curriculum XML');
  }

  return {
    userGoal,
    totalMonths: months.length,
    totalWeeks: globalWeekIndex,
    totalLessons: globalLessonIndex,
    months,
  };
}

/**
 * Extract just the XML from a potentially mixed response
 * Handles:
 * - Code fences (```xml ... ```)
 * - XML declarations (<?xml ...?>)
 * - Extra text before/after curriculum tags
 */
export function extractCurriculumXml(response: string): string {
  // Remove code fences if present
  let cleaned = response.replace(/```xml\s*/gi, '').replace(/```\s*/g, '');
  
  // Remove XML declaration if present
  cleaned = cleaned.replace(/<\?xml[^?]*\?>\s*/gi, '');
  
  // Extract just the curriculum content
  const match = cleaned.match(/<curriculum>([\s\S]*?)<\/curriculum>/i);
  if (match) {
    return `<curriculum>${match[1]}</curriculum>`;
  }
  
  // If no match, return cleaned response (will fail in parser with helpful error)
  return cleaned;
}

