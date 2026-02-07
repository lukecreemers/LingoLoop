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

// Lesson status (top level)
export type LessonStatus = "idle" | "generating" | "playing" | "completed";

// Generation progress (for loading screen)
export interface GenerationProgress {
  stage: "structure" | "parsing" | "units" | "summaries" | "complete" | "error";
  message: string;
  current?: number;
  total?: number;
}

// Sub-view when status is "playing"
export type LessonView = "roadmap" | "section-intro" | "section-check-in" | "unit";

// Node status for the roadmap
export type NodeStatus = "locked" | "unlocked" | "active" | "completed";

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

  // Generation progress (for loading screen)
  generationProgress: GenerationProgress | null;

  // Lesson roadmap view state
  lessonView: LessonView;
  // Track which units have been completed (using "sectionIdx-unitIdx" keys)
  completedUnits: Set<string>;
  // The furthest point unlocked
  furthestSectionIndex: number;
  furthestUnitIndex: number;

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
  setGenerationProgress: (progress: GenerationProgress | null) => void;

  // Insert extra sections into the lesson (from lesson-update-structure)
  insertSectionsAfterCurrent: (newSections: CompiledSection[]) => void;

  // Advance from check-in to the next section intro (called by "All Good" button)
  advanceFromCheckIn: () => void;

  // New navigation actions for roadmap flow
  goToRoadmap: () => void;
  goToUnit: (sectionIndex: number, unitIndex: number) => void;
  showSectionIntro: (sectionIndex: number) => void;
  advanceToNextUnit: () => void; // After completing a unit, moves to next

  // Helper to get node status
  getNodeStatus: (sectionIndex: number, unitIndex: number) => NodeStatus;
}

function makeUnitKey(sectionIndex: number, unitIndex: number): string {
  return `${sectionIndex}-${unitIndex}`;
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
    generationProgress: null,
    lessonView: "roadmap",
    completedUnits: new Set<string>(),
    furthestSectionIndex: 0,
    furthestUnitIndex: 0,

    // Actions
    setLesson: (data) =>
      set({
        lessonData: data,
        currentSectionIndex: 0,
        currentUnitIndex: 0,
        results: [],
        status: "idle",
        startTime: null,
        generationProgress: null,
        lessonView: "roadmap",
        completedUnits: new Set<string>(),
        furthestSectionIndex: 0,
        furthestUnitIndex: 0,
      }),

    startLesson: () =>
      set({
        status: "playing",
        startTime: Date.now(),
        currentSectionIndex: 0,
        currentUnitIndex: 0,
        results: [],
        lessonView: "section-intro", // Start with section intro for section 0
        completedUnits: new Set<string>(),
        furthestSectionIndex: 0,
        furthestUnitIndex: 0,
      }),

    // Legacy nextUnit - now used internally
    nextUnit: () => {
      const { currentSectionIndex, currentUnitIndex, lessonData } = get();
      if (!lessonData) return;

      const currentSection = lessonData.sections[currentSectionIndex];
      if (!currentSection) return;

      if (currentUnitIndex < currentSection.units.length - 1) {
        set({ currentUnitIndex: currentUnitIndex + 1 });
      } else if (currentSectionIndex < lessonData.sections.length - 1) {
        set({
          currentSectionIndex: currentSectionIndex + 1,
          currentUnitIndex: 0,
        });
      } else {
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
        generationProgress: null,
        lessonView: "roadmap",
        completedUnits: new Set<string>(),
        furthestSectionIndex: 0,
        furthestUnitIndex: 0,
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
    setGenerationProgress: (progress) => set({ generationProgress: progress }),

    // ====== Insert extra sections (lesson-update-structure) ======

    insertSectionsAfterCurrent: (newSections) => {
      const { lessonData, currentSectionIndex } = get();
      if (!lessonData) return;

      // Re-index the new sections to continue after the current ones
      const insertAt = currentSectionIndex + 1;
      const reindexedSections = newSections.map((section, i) => ({
        ...section,
        sectionIndex: insertAt + i,
      }));

      // Build the new sections array: [existing before insert] + [new] + [existing after insert, re-indexed]
      const before = lessonData.sections.slice(0, insertAt);
      const after = lessonData.sections.slice(insertAt).map((section, i) => ({
        ...section,
        sectionIndex: insertAt + reindexedSections.length + i,
      }));

      const updatedSections = [...before, ...reindexedSections, ...after];

      // Also update sectionInstructions
      const newSectionInstructions = reindexedSections.map(
        (s) => s.sectionInstruction
      );
      const instructionsBefore = lessonData.sectionInstructions.slice(
        0,
        insertAt
      );
      const instructionsAfter =
        lessonData.sectionInstructions.slice(insertAt);
      const updatedInstructions = [
        ...instructionsBefore,
        ...newSectionInstructions,
        ...instructionsAfter,
      ];

      set({
        lessonData: {
          ...lessonData,
          sections: updatedSections,
          sectionInstructions: updatedInstructions,
        },
      });
    },

    // ====== Advance from section check-in to next section ======

    advanceFromCheckIn: () => {
      const { currentSectionIndex, lessonData } = get();
      if (!lessonData) return;

      const nextSectionIdx = currentSectionIndex + 1;

      // If the lesson is done (shouldn't normally happen from check-in, but just in case)
      if (nextSectionIdx >= lessonData.sections.length) {
        set({ status: "completed" });
        return;
      }

      set({
        currentSectionIndex: nextSectionIdx,
        currentUnitIndex: 0,
        lessonView: "section-intro",
      });
    },

    // ====== New roadmap flow actions ======

    goToRoadmap: () =>
      set({ lessonView: "roadmap" }),

    goToUnit: (sectionIndex, unitIndex) =>
      set({
        currentSectionIndex: sectionIndex,
        currentUnitIndex: unitIndex,
        lessonView: "unit",
      }),

    showSectionIntro: (sectionIndex) =>
      set({
        currentSectionIndex: sectionIndex,
        currentUnitIndex: 0,
        lessonView: "section-intro",
      }),

    advanceToNextUnit: () => {
      const {
        currentSectionIndex,
        currentUnitIndex,
        lessonData,
        completedUnits,
        furthestSectionIndex,
        furthestUnitIndex,
      } = get();
      if (!lessonData) return;

      // Mark current unit as completed
      const newCompleted = new Set(completedUnits);
      newCompleted.add(makeUnitKey(currentSectionIndex, currentUnitIndex));

      const currentSection = lessonData.sections[currentSectionIndex];
      if (!currentSection) return;

      // Calculate next position
      let nextSectionIdx = currentSectionIndex;
      let nextUnitIdx = currentUnitIndex + 1;

      if (nextUnitIdx >= currentSection.units.length) {
        // Move to next section
        nextSectionIdx = currentSectionIndex + 1;
        nextUnitIdx = 0;
      }

      // Update furthest progress
      let newFurthestSection = furthestSectionIndex;
      let newFurthestUnit = furthestUnitIndex;

      if (
        nextSectionIdx > furthestSectionIndex ||
        (nextSectionIdx === furthestSectionIndex &&
          nextUnitIdx > furthestUnitIndex)
      ) {
        newFurthestSection = nextSectionIdx;
        newFurthestUnit = nextUnitIdx;
      }

      // Check if lesson is complete
      if (nextSectionIdx >= lessonData.sections.length) {
        set({
          completedUnits: newCompleted,
          furthestSectionIndex: newFurthestSection,
          furthestUnitIndex: newFurthestUnit,
          status: "completed",
        });
        return;
      }

      // If moving to a new section, show the section check-in first
      // UNLESS the section only contained context units (no review needed)
      if (nextSectionIdx !== currentSectionIndex) {
        const isContextOnly = currentSection.units.every(
          (u) => u.type === "context"
        );

        if (isContextOnly) {
          // Skip check-in — go straight to the next section intro
          set({
            completedUnits: newCompleted,
            furthestSectionIndex: newFurthestSection,
            furthestUnitIndex: newFurthestUnit,
            currentSectionIndex: nextSectionIdx,
            currentUnitIndex: 0,
            lessonView: "section-intro",
          });
          return;
        }

        set({
          completedUnits: newCompleted,
          furthestSectionIndex: newFurthestSection,
          furthestUnitIndex: newFurthestUnit,
          // Keep currentSectionIndex pointing at the COMPLETED section
          // so the check-in references the right section
          lessonView: "section-check-in",
        });
      } else {
        // Same section, go to next unit
        set({
          completedUnits: newCompleted,
          furthestSectionIndex: newFurthestSection,
          furthestUnitIndex: newFurthestUnit,
          currentSectionIndex: nextSectionIdx,
          currentUnitIndex: nextUnitIdx,
          lessonView: "unit",
        });
      }
    },

    getNodeStatus: (sectionIndex, unitIndex) => {
      const { completedUnits, furthestSectionIndex, furthestUnitIndex } = get();
      const key = makeUnitKey(sectionIndex, unitIndex);

      if (completedUnits.has(key)) return "completed";

      // Check if this is the current furthest (unlocked/active) position
      if (
        sectionIndex === furthestSectionIndex &&
        unitIndex === furthestUnitIndex
      ) {
        return "unlocked";
      }

      // Check if before the frontier
      if (
        sectionIndex < furthestSectionIndex ||
        (sectionIndex === furthestSectionIndex &&
          unitIndex < furthestUnitIndex)
      ) {
        // Should be completed but isn't in the set - treat as unlocked
        return "unlocked";
      }

      return "locked";
    },
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
  const completedUnits = useSectionedLessonStore((s) => s.completedUnits);
  const totalUnits = useTotalUnits();
  return { current: completedUnits.size, total: totalUnits };
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
