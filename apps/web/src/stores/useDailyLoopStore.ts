import { create } from "zustand";
import type { DailyLoop, DailyTask } from "@shared";
import { STATIC_DAILY_LOOP } from "../constants/dailyLoopData";

// ============================================================================
// DAILY LOOP STORE
// ============================================================================

export type DailyLoopView = "home" | "task" | "roadmap";

interface DailyLoopState {
  // Data
  dailyLoop: DailyLoop;
  currentTaskId: string | null;
  view: DailyLoopView;

  // Computed helpers
  getCurrentTask: () => DailyTask | null;
  getTaskStatus: (taskId: string) => "completed" | "available" | "locked";
  getCompletedCount: () => number;
  getTotalTasks: () => number;
  getProgressPercent: () => number;

  // Actions
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  exitTask: () => void;
  goHome: () => void;
  goToRoadmap: () => void;
  reset: () => void;
}

export const useDailyLoopStore = create<DailyLoopState>((set, get) => ({
  // Initial state - use static data
  dailyLoop: STATIC_DAILY_LOOP,
  currentTaskId: null,
  view: "home",

  // Computed helpers
  getCurrentTask: () => {
    const { dailyLoop, currentTaskId } = get();
    if (!currentTaskId) return null;
    return dailyLoop.tasks.find((t) => t.id === currentTaskId) ?? null;
  },

  getTaskStatus: (taskId: string) => {
    const { dailyLoop } = get();
    if (dailyLoop.completedTaskIds.includes(taskId)) return "completed";

    // All tasks are available (no locking for now)
    return "available";
  },

  getCompletedCount: () => {
    return get().dailyLoop.completedTaskIds.length;
  },

  getTotalTasks: () => {
    return get().dailyLoop.tasks.length;
  },

  getProgressPercent: () => {
    const { dailyLoop } = get();
    if (dailyLoop.tasks.length === 0) return 0;
    return Math.round(
      (dailyLoop.completedTaskIds.length / dailyLoop.tasks.length) * 100
    );
  },

  // Actions
  startTask: (taskId: string) => {
    set({ currentTaskId: taskId, view: "task" });
  },

  completeTask: (taskId: string) => {
    const { dailyLoop } = get();
    if (dailyLoop.completedTaskIds.includes(taskId)) return;

    set({
      dailyLoop: {
        ...dailyLoop,
        completedTaskIds: [...dailyLoop.completedTaskIds, taskId],
      },
      currentTaskId: null,
      view: "home",
    });
  },

  exitTask: () => {
    set({ currentTaskId: null, view: "home" });
  },

  goHome: () => {
    set({ currentTaskId: null, view: "home" });
  },

  goToRoadmap: () => {
    set({ view: "roadmap" });
  },

  reset: () => {
    set({
      dailyLoop: STATIC_DAILY_LOOP,
      currentTaskId: null,
      view: "home",
    });
  },
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useDailyTasks = () => {
  return useDailyLoopStore((s) => s.dailyLoop.tasks);
};

export const useUserProfile = () => {
  return useDailyLoopStore((s) => s.dailyLoop.userProfile);
};

export const useDayNumber = () => {
  return useDailyLoopStore((s) => s.dailyLoop.dayNumber);
};

export const useDailyVocab = () => {
  return useDailyLoopStore((s) => s.dailyLoop.dailyVocab);
};

