/**
 * Lesson Context - Contains user profile and learning data
 */

// ============================================================================
// USER PROFILE - Static for testing, will be dynamic later
// ============================================================================

export interface UserProfile {
  // Basic info
  name: string;
  nativeLanguage: string;
  targetLanguage: string;
  currentLevel: string;
}

/**
 * Static test user profile
 * TODO: Replace with actual user data from database
 */
export const TEST_USER_PROFILE: UserProfile = {
  name: 'Alex',
  nativeLanguage: 'English',
  targetLanguage: 'Spanish',
  currentLevel: 'superbeginner',
};

/**
 * Format user profile as a string for prompt injection
 */
export function formatUserProfile(profile: UserProfile): string {
  return `
## LEARNER PROFILE
- **Name:** ${profile.name}
- **Native Language:** ${profile.nativeLanguage}
- **Learning:** ${profile.targetLanguage}
- **Current Level:** ${profile.currentLevel}
`.trim();
}

// ============================================================================
// LESSON CONTEXT - Simplified
// ============================================================================

export interface LessonContext {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  userProfile: UserProfile;
  /** Lesson plan context (XML/units) up to and including the current unit */
  lessonPlanContext?: string;
}

/**
 * Build a lesson context from DTO and defaults
 */
export function buildLessonContext(
  userLevel: string,
  targetLanguage: string,
  nativeLanguage: string,
  profile?: UserProfile,
): LessonContext {
  return {
    userLevel,
    targetLanguage,
    nativeLanguage,
    userProfile: profile ?? TEST_USER_PROFILE,
  };
}
