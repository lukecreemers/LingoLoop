import { create } from "zustand";
import { DEFAULT_CURRICULUM } from "../constants/defaultCurriculum";

// ============================================================================
// CURRICULUM TYPES (matching backend)
// ============================================================================

export interface CurriculumLesson {
  name: string;
  description: string;
  lessonIndex: number;
  globalLessonIndex: number;
}

export interface CurriculumWeek {
  name: string;
  description: string;
  weekIndex: number;
  globalWeekIndex: number;
  lessons: CurriculumLesson[];
}

export interface CurriculumMonth {
  name: string;
  description: string;
  monthIndex: number;
  weeks: CurriculumWeek[];
}

export interface Curriculum {
  userGoal: string;
  totalMonths: number;
  totalWeeks: number;
  totalLessons: number;
  months: CurriculumMonth[];
}

export interface CompletedLesson {
  globalLessonIndex: number;
  completedAt: Date;
  score?: number;
}

type RoadmapStatus = "idle" | "loading" | "loaded" | "generating" | "error";

// Context for structured lesson endpoint
export interface StructuredLessonContext {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  lessonTitle: string;
  lessonDescription: string;
  weekTitle?: string;
  weekDescription?: string;
  weekLessonsSoFar?: Array<{ title: string; description: string }>;
  previousWeeksSummary?: string;
}

interface RoadmapState {
  // Data
  curriculum: Curriculum | null;
  completedLessons: CompletedLesson[];
  status: RoadmapStatus;
  error: string | null;

  // Selected lesson for playing
  selectedLesson: {
    monthIndex: number;
    weekIndex: number;
    lessonIndex: number;
  } | null;

  // Actions
  fetchCurriculum: () => Promise<void>;
  generateCurriculum: (userGoal: string) => Promise<void>;
  selectLesson: (
    monthIndex: number,
    weekIndex: number,
    lessonIndex: number
  ) => void;
  clearSelectedLesson: () => void;
  markLessonComplete: (globalLessonIndex: number, score?: number) => void;
  isLessonCompleted: (globalLessonIndex: number) => boolean;
  getSelectedLessonData: () => {
    lesson: CurriculumLesson;
    week: CurriculumWeek;
    month: CurriculumMonth;
  } | null;
  buildStructuredLessonContext: () => StructuredLessonContext | null;
  reset: () => void;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  // Initial state - preloaded with default curriculum
  curriculum: DEFAULT_CURRICULUM,
  completedLessons: [],
  status: "loaded",
  error: null,
  selectedLesson: null,

  // Actions
  fetchCurriculum: async () => {
    set({ status: "loading", error: null });
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/timeline`);
      if (!response.ok) {
        throw new Error("Failed to fetch curriculum");
      }
      const result = await response.json();
      // Handle both wrapped and unwrapped responses
      const curriculum = result.data || result;

      // Check if curriculum has data
      if (!curriculum.months || curriculum.months.length === 0) {
        set({ curriculum: null, status: "loaded" });
        return;
      }

      set({ curriculum, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error:
          err instanceof Error ? err.message : "Failed to load curriculum",
      });
    }
  },

  generateCurriculum: async (userGoal: string) => {
    set({ status: "generating", error: null });
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/timeline/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGoal }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate curriculum");
      }
      const result = await response.json();
      const curriculum = result.data || result;
      set({ curriculum, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error:
          err instanceof Error ? err.message : "Failed to generate curriculum",
      });
    }
  },

  selectLesson: (monthIndex, weekIndex, lessonIndex) => {
    set({ selectedLesson: { monthIndex, weekIndex, lessonIndex } });
  },

  clearSelectedLesson: () => {
    set({ selectedLesson: null });
  },

  markLessonComplete: (globalLessonIndex, score) => {
    const { completedLessons } = get();
    if (
      completedLessons.some((l) => l.globalLessonIndex === globalLessonIndex)
    ) {
      return;
    }
    set({
      completedLessons: [
        ...completedLessons,
        { globalLessonIndex, completedAt: new Date(), score },
      ],
    });
  },

  isLessonCompleted: (globalLessonIndex) => {
    return get().completedLessons.some(
      (l) => l.globalLessonIndex === globalLessonIndex
    );
  },

  getSelectedLessonData: () => {
    const { curriculum, selectedLesson } = get();
    if (!curriculum || !selectedLesson) return null;

    const month = curriculum.months[selectedLesson.monthIndex];
    if (!month) return null;

    const week = month.weeks[selectedLesson.weekIndex];
    if (!week) return null;

    const lesson = week.lessons[selectedLesson.lessonIndex];
    if (!lesson) return null;

    return { lesson, week, month };
  },

  buildStructuredLessonContext: () => {
    const { curriculum, selectedLesson, completedLessons } = get();
    if (!curriculum || !selectedLesson) return null;

    const month = curriculum.months[selectedLesson.monthIndex];
    if (!month) return null;

    const week = month.weeks[selectedLesson.weekIndex];
    if (!week) return null;

    const lesson = week.lessons[selectedLesson.lessonIndex];
    if (!lesson) return null;

    // Get lessons completed this week
    const weekLessonsSoFar = week.lessons
      .filter(
        (l) =>
          l.lessonIndex < lesson.lessonIndex &&
          completedLessons.some(
            (c) => c.globalLessonIndex === l.globalLessonIndex
          )
      )
      .map((l) => ({
        title: l.name,
        description: l.description,
      }));

    // Build previous weeks summary
    const previousWeeks: string[] = [];

    // Add all previous months
    for (let mi = 0; mi < selectedLesson.monthIndex; mi++) {
      const m = curriculum.months[mi];
      previousWeeks.push(`Month ${mi + 1}: ${m.name} - ${m.description}`);
    }

    // Add previous weeks from current month
    for (let wi = 0; wi < selectedLesson.weekIndex; wi++) {
      const w = month.weeks[wi];
      previousWeeks.push(`Week ${wi + 1}: ${w.name} - ${w.description}`);
    }

    // TODO: These should come from user settings or curriculum metadata
    return {
      userLevel: "intermediate", // Extract from userGoal or make configurable
      targetLanguage: "Spanish",
      nativeLanguage: "English",
      lessonTitle: lesson.name,
      lessonDescription: lesson.description,
      weekTitle: week.name,
      weekDescription: week.description,
      weekLessonsSoFar,
      previousWeeksSummary: previousWeeks.join("\n") || "No previous content.",
    };
  },

  reset: () => {
    set({
      curriculum: null,
      completedLessons: [],
      status: "idle",
      error: null,
      selectedLesson: null,
    });
  },
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useCurriculumMonths = () => {
  return useRoadmapStore((s) => s.curriculum?.months ?? []);
};

export const useRoadmapProgress = () => {
  const curriculum = useRoadmapStore((s) => s.curriculum);
  const completedLessons = useRoadmapStore((s) => s.completedLessons);

  if (!curriculum)
    return { completed: 0, total: 0, percentage: 0 };

  return {
    completed: completedLessons.length,
    total: curriculum.totalLessons,
    percentage: Math.round(
      (completedLessons.length / curriculum.totalLessons) * 100
    ),
  };
};
