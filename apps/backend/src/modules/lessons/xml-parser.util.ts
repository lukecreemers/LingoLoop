import { UnitTypeSchema } from 'src/shared/types/custom-lesson-generation.types';
import type { ParsedUnit } from 'src/shared/types/lesson-structure.types';

/**
 * Valid unit types for validation
 */
const VALID_UNIT_TYPES = [
  'context',
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
 * A parsed section containing a name and its units
 */
export interface ParsedSection {
  name: string;
  units: ParsedUnit[];
}

/**
 * Parse all <unit> tags from a chunk of XML content
 */
function parseUnitsFromContent(content: string): ParsedUnit[] {
  const units: ParsedUnit[] = [];

  const unitRegex = /<unit\s+type=["']([^"']+)["']\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/unit>/gi;

  let match;
  while ((match = unitRegex.exec(content)) !== null) {
    const [, type, name, instructions] = match;

    const normalizedType = type.toLowerCase().trim();
    if (!VALID_UNIT_TYPES.includes(normalizedType as typeof VALID_UNIT_TYPES[number])) {
      console.warn(`Unknown unit type "${type}", skipping...`);
      continue;
    }

    const parsedType = UnitTypeSchema.parse(normalizedType);

    units.push({
      type: parsedType,
      name: name.trim(),
      instructions: instructions.trim(),
    });
  }

  return units;
}

/**
 * Parse XML lesson structure into an array of sections with their units.
 * 
 * Supports two formats:
 * 
 * Format 1 (with sections):
 * <lesson>
 *   <section name="Introduction">
 *     <unit type="context" name="Welcome">Instructions here</unit>
 *   </section>
 *   <section name="Practice">
 *     <unit type="flashcard" name="Vocab">Instructions here</unit>
 *   </section>
 * </lesson>
 * 
 * Format 2 (flat - legacy):
 * <lesson>
 *   <unit type="flashcard" name="Food Vocabulary">Instructions here</unit>
 * </lesson>
 */
export function parseLessonXml(xml: string): ParsedSection[] {
  // Extract content inside <lesson> tags
  const lessonMatch = xml.match(/<lesson>([\s\S]*?)<\/lesson>/i);
  if (!lessonMatch) {
    throw new Error('No <lesson> tags found in XML output');
  }

  const lessonContent = lessonMatch[1];

  // Check if there are <section> tags
  const sectionRegex = /<section\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/section>/gi;
  const sections: ParsedSection[] = [];

  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(lessonContent)) !== null) {
    const [, sectionName, sectionContent] = sectionMatch;
    const units = parseUnitsFromContent(sectionContent);

    if (units.length > 0) {
      sections.push({
        name: sectionName.trim(),
        units,
      });
    }
  }

  // If no sections found, fall back to flat unit parsing (legacy format)
  if (sections.length === 0) {
    const flatUnits = parseUnitsFromContent(lessonContent);
    if (flatUnits.length === 0) {
      throw new Error('No valid <unit> tags found in lesson XML');
    }
    // Wrap flat units in a single default section
    sections.push({
      name: 'Lesson',
      units: flatUnits,
    });
  }

  return sections;
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
