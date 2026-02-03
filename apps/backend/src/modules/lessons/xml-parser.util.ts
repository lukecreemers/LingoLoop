import { UnitTypeSchema } from 'src/shared/types/custom-lesson-generation.types';
import type { ParsedUnit } from 'src/shared/types/lesson-structure.types';

/**
 * Valid unit types for validation
 */
const VALID_UNIT_TYPES = [
  'flashcard',
  'explanation',
  'fill_in_blanks',
  'word_match',
  'write_in_blanks',
  'translation',
  'conversation',
  'writing_practice',
  'word_order',
] as const;

/**
 * Parse XML lesson structure into an array of units
 * 
 * Expected format:
 * <lesson>
 *   <unit type="flashcard" name="Food Vocabulary">Instructions here</unit>
 *   <unit type="explanation" name="Ordering Basics">More instructions</unit>
 * </lesson>
 */
export function parseLessonXml(xml: string): ParsedUnit[] {
  const units: ParsedUnit[] = [];

  // Extract content inside <lesson> tags
  const lessonMatch = xml.match(/<lesson>([\s\S]*?)<\/lesson>/i);
  if (!lessonMatch) {
    throw new Error('No <lesson> tags found in XML output');
  }

  const lessonContent = lessonMatch[1];

  // Match all <unit> tags with attributes
  // Supports: <unit type="..." name="...">content</unit>
  const unitRegex = /<unit\s+type=["']([^"']+)["']\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/unit>/gi;
  
  let match;
  while ((match = unitRegex.exec(lessonContent)) !== null) {
    const [, type, name, instructions] = match;
    
    // Validate unit type
    const normalizedType = type.toLowerCase().trim();
    if (!VALID_UNIT_TYPES.includes(normalizedType as typeof VALID_UNIT_TYPES[number])) {
      console.warn(`Unknown unit type "${type}", skipping...`);
      continue;
    }

    // Parse and validate the type
    const parsedType = UnitTypeSchema.parse(normalizedType);

    units.push({
      type: parsedType,
      name: name.trim(),
      instructions: instructions.trim(),
    });
  }

  if (units.length === 0) {
    throw new Error('No valid <unit> tags found in lesson XML');
  }

  return units;
}

/**
 * Extract just the XML from a potentially mixed response
 * (in case the model adds explanation text before/after)
 */
export function extractXmlFromResponse(response: string): string {
  // Try to find <lesson>...</lesson> block
  const match = response.match(/<lesson>[\s\S]*?<\/lesson>/i);
  if (match) {
    return match[0];
  }
  
  // If no lesson tags, return original (will fail in parseLessonXml)
  return response;
}

