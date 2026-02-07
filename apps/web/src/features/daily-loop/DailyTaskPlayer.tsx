import type { DailyTask, ReviewTask } from "@shared";
import { useDailyLoopStore } from "../../stores/useDailyLoopStore";
import { useSectionedLessonStore } from "../../stores/useSectionedLessonStore";
import { LessonPlayer } from "../../components/lesson";
import UnitDispatcher from "../../components/lesson/UnitDispatcher";
import ReadingExercise from "./ReadingExercise";
import DailyFlashcards from "./DailyFlashcards";
import DailyWritingExercise from "./DailyWritingExercise";
import { useState, useEffect } from "react";

/**
 * Dispatches to the correct component based on task type.
 * Handles completion and returns to the daily loop home.
 */

interface DailyTaskPlayerProps {
  task: DailyTask;
}

// ============================================================================
// REVIEW SESSION - plays through a sequence of review units
// ============================================================================

function ReviewSession({
  task,
  onComplete,
}: {
  task: ReviewTask;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);

  const unit = task.reviewUnits[currentIndex];
  const totalUnits = task.reviewUnits.length;

  const handleUnitComplete = (result?: {
    score?: number;
    totalPossible?: number;
  }) => {
    if (result?.score) setScore((s) => s + result.score!);
    if (result?.totalPossible)
      setTotalPossible((t) => t + result.totalPossible!);

    if (currentIndex < totalUnits - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
        <header className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              REVIEW<span className="text-teal-500">.</span>
            </h1>
          </div>
        </header>
        <main className="flex-1 px-8 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-bauhaus-green flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-black mb-2">Review Complete! 🔄</h2>
            <p className="text-zinc-500 mb-4">
              {task.sourceDescription}
            </p>
            {totalPossible > 0 && (
              <div className="text-2xl font-black mb-8">
                <span className="text-bauhaus-green">{score}</span>
                <span className="text-zinc-300 mx-1">/</span>
                <span>{totalPossible}</span>
              </div>
            )}
          </div>
        </main>
        <footer className="shrink-0 bg-white border-t-4 border-black p-6">
          <div className="flex justify-end">
            <button
              onClick={onComplete}
              className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Complete →
            </button>
          </div>
        </footer>
      </div>
    );
  }

  if (!unit) return null;

  return (
    <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b-2 border-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-700 border border-teal-300">
              Review
            </span>
            <span className="text-xs text-zinc-400">{task.sourceDescription}</span>
          </div>
          <div className="text-sm font-bold text-zinc-500">
            {currentIndex + 1} / {totalUnits}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-200 mt-2 relative">
          <div
            className="absolute inset-y-0 left-0 bg-teal-500 transition-all duration-500"
            style={{ width: `${(currentIndex / totalUnits) * 100}%` }}
          />
        </div>
      </div>

      {/* Unit content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <UnitDispatcher
          key={`review-${currentIndex}`}
          unit={unit}
          onComplete={handleUnitComplete}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN TASK PLAYER
// ============================================================================

export default function DailyTaskPlayer({ task }: DailyTaskPlayerProps) {
  const completeTask = useDailyLoopStore((s) => s.completeTask);
  const exitTask = useDailyLoopStore((s) => s.exitTask);

  const sectionedLessonStore = useSectionedLessonStore();

  // For custom_lesson, set up the sectioned lesson store
  useEffect(() => {
    if (task.type === "custom_lesson") {
      sectionedLessonStore.setLesson(task.lessonData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const handleComplete = () => {
    if (task.type === "custom_lesson") {
      sectionedLessonStore.reset();
    }
    completeTask(task.id);
  };

  const handleExit = () => {
    if (task.type === "custom_lesson") {
      sectionedLessonStore.reset();
    }
    exitTask();
  };

  // Render based on task type
  switch (task.type) {
    case "custom_lesson":
      return (
        <div className="h-full flex flex-col">
          {/* Back button overlay */}
          <div className="absolute top-3 left-3 z-30">
            <button
              onClick={handleExit}
              className="px-3 py-2 text-sm font-bold tracking-wider uppercase
                border-2 border-black bg-white hover:bg-zinc-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Daily Loop
            </button>
          </div>
          <LessonPlayer onClose={handleExit} onLessonComplete={handleComplete} />
        </div>
      );

    case "review":
      return (
        <div className="h-full flex flex-col relative">
          <div className="absolute top-2 left-2 z-30">
            <ExitButton onExit={handleExit} />
          </div>
          <ReviewSession task={task} onComplete={handleComplete} />
        </div>
      );

    case "flashcards":
      return (
        <div className="h-full flex flex-col relative">
          <div className="absolute top-2 left-2 z-30">
            <ExitButton onExit={handleExit} />
          </div>
          <DailyFlashcards
            newCards={task.newCards}
            reviewCards={task.reviewCards}
            onComplete={handleComplete}
          />
        </div>
      );

    case "reading":
      return (
        <div className="h-full flex flex-col relative">
          <div className="absolute top-2 left-2 z-30">
            <ExitButton onExit={handleExit} />
          </div>
          <ReadingExercise
            task={task}
            onComplete={handleComplete}
          />
        </div>
      );

    case "writing":
      return (
        <div className="h-full flex flex-col relative">
          <div className="absolute top-2 left-2 z-30">
            <ExitButton onExit={handleExit} />
          </div>
          <DailyWritingExercise
            task={task}
            onComplete={handleComplete}
          />
        </div>
      );

    default:
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-zinc-500">Unknown task type</p>
        </div>
      );
  }
}

// ============================================================================
// EXIT BUTTON - overlays on task views
// ============================================================================

function ExitButton({ onExit }: { onExit: () => void }) {
  return (
    <button
      onClick={onExit}
      className="px-3 py-1.5 text-sm font-bold tracking-wider uppercase
        border-2 border-black bg-white hover:bg-zinc-100 transition-colors flex items-center gap-2 shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
