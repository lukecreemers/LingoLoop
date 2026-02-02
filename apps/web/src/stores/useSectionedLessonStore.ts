import { create } from "zustand";
import type { SectionedLesson, CompiledSection, CompiledUnit } from "@shared";

// Result data for each unit
export interface UnitResult {
  sectionIndex: number;
  unitIndex: number;
  unitType: string;
  score?: number;
  totalPossible?: number;
  timeSpentMs: number;
  completedAt: Date;
}

// Lesson status
export type LessonStatus = "idle" | "generating" | "playing" | "completed";

interface SectionedLessonState {
  // Data
  lessonData: SectionedLesson | null;
  currentSectionIndex: number;
  currentUnitIndex: number;
  results: UnitResult[];
  status: LessonStatus;
  startTime: number | null;
  isRedoing: boolean;
  isRedoingSection: boolean;

  // Actions
  setLesson: (data: SectionedLesson) => void;
  startLesson: () => void;
  nextUnit: () => void;
  recordResult: (
    result: Omit<UnitResult, "sectionIndex" | "unitIndex" | "completedAt">
  ) => void;
  completeLesson: () => void;
  reset: () => void;
  setStatus: (status: LessonStatus) => void;
  updateCurrentUnit: (unit: CompiledUnit) => void;
  updateSection: (sectionIndex: number, section: CompiledSection) => void;
  setIsRedoing: (value: boolean) => void;
  setIsRedoingSection: (value: boolean) => void;
}

export const useSectionedLessonStore = create<SectionedLessonState>(
  (set, get) => ({
    // Initial state
    lessonData: null,
    currentSectionIndex: 0,
    currentUnitIndex: 0,
    results: [],
    status: "idle",
    startTime: null,
    isRedoing: false,
    isRedoingSection: false,

    // Actions
    setLesson: (data) =>
      set({
        lessonData: data,
        currentSectionIndex: 0,
        currentUnitIndex: 0,
        results: [],
        status: "idle",
        startTime: null,
      }),

    startLesson: () =>
      set({
        status: "playing",
        startTime: Date.now(),
        currentSectionIndex: 0,
        currentUnitIndex: 0,
        results: [],
      }),

    nextUnit: () => {
      const { currentSectionIndex, currentUnitIndex, lessonData } = get();
      if (!lessonData) return;

      const currentSection = lessonData.sections[currentSectionIndex];
      if (!currentSection) return;

      // Check if there are more units in current section
      if (currentUnitIndex < currentSection.units.length - 1) {
        set({ currentUnitIndex: currentUnitIndex + 1 });
      }
      // Check if there are more sections
      else if (currentSectionIndex < lessonData.sections.length - 1) {
        set({
          currentSectionIndex: currentSectionIndex + 1,
          currentUnitIndex: 0,
        });
      }
      // Lesson complete
      else {
        set({ status: "completed" });
      }
    },

    recordResult: (result) => {
      const { results, currentSectionIndex, currentUnitIndex } = get();
      set({
        results: [
          ...results,
          {
            ...result,
            sectionIndex: currentSectionIndex,
            unitIndex: currentUnitIndex,
            completedAt: new Date(),
          },
        ],
      });
    },

    completeLesson: () => set({ status: "completed" }),

    reset: () =>
      set({
        lessonData: null,
        currentSectionIndex: 0,
        currentUnitIndex: 0,
        results: [],
        status: "idle",
        startTime: null,
        isRedoing: false,
        isRedoingSection: false,
      }),

    setStatus: (status) => set({ status }),

    updateCurrentUnit: (unit) => {
      const { lessonData, currentSectionIndex, currentUnitIndex } = get();
      if (!lessonData) return;

      const newSections = [...lessonData.sections];
      const newUnits = [...newSections[currentSectionIndex].units];
      newUnits[currentUnitIndex] = unit;
      newSections[currentSectionIndex] = {
        ...newSections[currentSectionIndex],
        units: newUnits,
      };

      set({ lessonData: { ...lessonData, sections: newSections } });
    },

    updateSection: (sectionIndex, section) => {
      const { lessonData } = get();
      if (!lessonData) return;

      const newSections = [...lessonData.sections];
      newSections[sectionIndex] = section;

      set({ lessonData: { ...lessonData, sections: newSections } });
    },

    setIsRedoing: (value) => set({ isRedoing: value }),
    setIsRedoingSection: (value) => set({ isRedoingSection: value }),
  })
);

// Selector hooks for computed values
export const useCurrentSection = () => {
  const lessonData = useSectionedLessonStore((s) => s.lessonData);
  const currentSectionIndex = useSectionedLessonStore(
    (s) => s.currentSectionIndex
  );
  return lessonData?.sections[currentSectionIndex] ?? null;
};

export const useCurrentUnit = () => {
  const lessonData = useSectionedLessonStore((s) => s.lessonData);
  const currentSectionIndex = useSectionedLessonStore(
    (s) => s.currentSectionIndex
  );
  const currentUnitIndex = useSectionedLessonStore((s) => s.currentUnitIndex);
  return (
    lessonData?.sections[currentSectionIndex]?.units[currentUnitIndex] ?? null
  );
};

export const useTotalUnits = () => {
  const lessonData = useSectionedLessonStore((s) => s.lessonData);
  if (!lessonData) return 0;
  return lessonData.sections.reduce((sum, s) => sum + s.units.length, 0);
};

export const useCurrentUnitGlobalIndex = () => {
  const lessonData = useSectionedLessonStore((s) => s.lessonData);
  const currentSectionIndex = useSectionedLessonStore(
    (s) => s.currentSectionIndex
  );
  const currentUnitIndex = useSectionedLessonStore((s) => s.currentUnitIndex);

  if (!lessonData) return 0;

  // Sum all units in previous sections + current unit index
  let globalIndex = currentUnitIndex;
  for (let i = 0; i < currentSectionIndex; i++) {
    globalIndex += lessonData.sections[i].units.length;
  }
  return globalIndex;
};

export const useIsLastUnit = () => {
  const lessonData = useSectionedLessonStore((s) => s.lessonData);
  const currentSectionIndex = useSectionedLessonStore(
    (s) => s.currentSectionIndex
  );
  const currentUnitIndex = useSectionedLessonStore((s) => s.currentUnitIndex);

  if (!lessonData) return false;

  const isLastSection =
    currentSectionIndex >= lessonData.sections.length - 1;
  const currentSection = lessonData.sections[currentSectionIndex];
  const isLastUnitInSection =
    currentSection && currentUnitIndex >= currentSection.units.length - 1;

  return isLastSection && isLastUnitInSection;
};

export const useLessonProgress = () => {
  const currentGlobalIndex = useCurrentUnitGlobalIndex();
  const totalUnits = useTotalUnits();
  return { current: currentGlobalIndex + 1, total: totalUnits };
};

export const useTotalScore = () => {
  const results = useSectionedLessonStore((s) => s.results);
  const totalScore = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const totalPossible = results.reduce(
    (sum, r) => sum + (r.totalPossible ?? 0),
    0
  );
  return { score: totalScore, total: totalPossible };
};

