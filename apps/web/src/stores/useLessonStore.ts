import { create } from "zustand";
import type { CompiledLesson, CompiledUnit } from "@shared";

// Result data for each unit
export interface UnitResult {
  unitIndex: number;
  unitType: string;
  score?: number;
  totalPossible?: number;
  timeSpentMs: number;
  completedAt: Date;
}

// Lesson status
export type LessonStatus = "idle" | "generating" | "playing" | "completed";

interface LessonState {
  // Data
  lessonData: CompiledLesson | null;
  currentIndex: number;
  results: UnitResult[];
  status: LessonStatus;
  startTime: number | null;
  isRedoing: boolean;

  // Computed
  currentUnit: CompiledUnit | null;
  totalUnits: number;
  isLastUnit: boolean;

  // Actions
  setLesson: (data: CompiledLesson) => void;
  startLesson: () => void;
  nextUnit: () => void;
  recordResult: (result: Omit<UnitResult, "unitIndex" | "completedAt">) => void;
  completeLesson: () => void;
  reset: () => void;
  setStatus: (status: LessonStatus) => void;
  updateCurrentUnit: (unit: CompiledUnit) => void;
  setIsRedoing: (value: boolean) => void;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  // Initial state
  lessonData: null,
  currentIndex: 0,
  results: [],
  status: "idle",
  startTime: null,
  isRedoing: false,

  // Computed getters (recalculated on access)
  get currentUnit() {
    const { lessonData, currentIndex } = get();
    return lessonData?.units[currentIndex] ?? null;
  },

  get totalUnits() {
    return get().lessonData?.units.length ?? 0;
  },

  get isLastUnit() {
    const { lessonData, currentIndex } = get();
    if (!lessonData) return false;
    return currentIndex >= lessonData.units.length - 1;
  },

  // Actions
  setLesson: (data) =>
    set({
      lessonData: data,
      currentIndex: 0,
      results: [],
      status: "idle",
      startTime: null,
    }),

  startLesson: () =>
    set({
      status: "playing",
      startTime: Date.now(),
      currentIndex: 0,
      results: [],
    }),

  nextUnit: () => {
    const { currentIndex, lessonData } = get();
    if (!lessonData) return;

    if (currentIndex < lessonData.units.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ status: "completed" });
    }
  },

  recordResult: (result) => {
    const { results, currentIndex } = get();
    set({
      results: [
        ...results,
        {
          ...result,
          unitIndex: currentIndex,
          completedAt: new Date(),
        },
      ],
    });
  },

  completeLesson: () => set({ status: "completed" }),

  reset: () =>
    set({
      lessonData: null,
      currentIndex: 0,
      results: [],
      status: "idle",
      startTime: null,
      isRedoing: false,
    }),

  setStatus: (status) => set({ status }),

  updateCurrentUnit: (unit) => {
    const { lessonData, currentIndex } = get();
    if (!lessonData) return;

    const newUnits = [...lessonData.units];
    newUnits[currentIndex] = unit;
    set({ lessonData: { ...lessonData, units: newUnits } });
  },

  setIsRedoing: (value) => set({ isRedoing: value }),
}));

// Selector hooks for computed values
export const useCurrentUnit = () => {
  const lessonData = useLessonStore((s) => s.lessonData);
  const currentIndex = useLessonStore((s) => s.currentIndex);
  return lessonData?.units[currentIndex] ?? null;
};

export const useTotalUnits = () => {
  const lessonData = useLessonStore((s) => s.lessonData);
  return lessonData?.units.length ?? 0;
};

export const useIsLastUnit = () => {
  const lessonData = useLessonStore((s) => s.lessonData);
  const currentIndex = useLessonStore((s) => s.currentIndex);
  if (!lessonData) return false;
  return currentIndex >= lessonData.units.length - 1;
};

export const useLessonProgress = () => {
  const currentIndex = useLessonStore((s) => s.currentIndex);
  const totalUnits = useTotalUnits();
  return { current: currentIndex + 1, total: totalUnits };
};

export const useTotalScore = () => {
  const results = useLessonStore((s) => s.results);
  const totalScore = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const totalPossible = results.reduce(
    (sum, r) => sum + (r.totalPossible ?? 0),
    0
  );
  return { score: totalScore, total: totalPossible };
};

