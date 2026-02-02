import { useEffect, useRef } from "react";
import {
  useSectionedLessonStore,
  useCurrentUnit,
  useCurrentSection,
  useLessonProgress,
  useTotalScore,
} from "../../stores/useSectionedLessonStore";
import UnitDispatcher from "./UnitDispatcher";
import ProgressBar from "../ui/ProgressBar";

interface LessonPlayerProps {
  onClose?: () => void;
  onLessonComplete?: () => void;
}

export default function LessonPlayer({
  onClose,
  onLessonComplete,
}: LessonPlayerProps) {
  const status = useSectionedLessonStore((s) => s.status);
  const nextUnit = useSectionedLessonStore((s) => s.nextUnit);
  const recordResult = useSectionedLessonStore((s) => s.recordResult);
  const startLesson = useSectionedLessonStore((s) => s.startLesson);
  const lessonData = useSectionedLessonStore((s) => s.lessonData);
  const currentSectionIndex = useSectionedLessonStore(
    (s) => s.currentSectionIndex
  );

  const currentUnit = useCurrentUnit();
  const currentSection = useCurrentSection();
  const progress = useLessonProgress();
  const { score, total } = useTotalScore();

  const unitStartTime = useRef<number>(Date.now());

  // Start lesson when component mounts if in idle state
  useEffect(() => {
    if (status === "idle") {
      startLesson();
    }
  }, [status, startLesson]);

  // Reset unit timer when unit changes
  useEffect(() => {
    unitStartTime.current = Date.now();
  }, [currentUnit]);

  // Handle lesson completion
  useEffect(() => {
    if (status === "completed" && onLessonComplete) {
      onLessonComplete();
    }
  }, [status, onLessonComplete]);

  const handleUnitComplete = (result?: {
    score?: number;
    totalPossible?: number;
  }) => {
    const timeSpentMs = Date.now() - unitStartTime.current;

    recordResult({
      unitType: currentUnit?.type ?? "unknown",
      score: result?.score,
      totalPossible: result?.totalPossible,
      timeSpentMs,
    });

    nextUnit();
  };

  // Loading state
  if (status === "generating") {
    return (
      <div className="h-full bg-bauhaus-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter mb-4">
            Maestro is composing<span className="text-bauhaus-blue">...</span>
          </h2>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-bauhaus-blue animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (status === "completed") {
    return (
      <div className="h-full bg-bauhaus-white flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-4xl font-black tracking-tighter mb-4">
            Lesson Complete<span className="text-bauhaus-green">!</span>
          </h2>

          {total > 0 && (
            <div className="mb-8">
              <p className="text-zinc-500 mb-2">Final Score</p>
              <div className="text-5xl font-black font-mono">
                <span className="text-bauhaus-green">{score}</span>
                <span className="text-zinc-300 mx-2">/</span>
                <span>{total}</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // No unit to display
  if (!currentUnit) {
    return (
      <div className="h-full bg-bauhaus-white flex items-center justify-center">
        <p className="text-zinc-500">No lesson loaded</p>
      </div>
    );
  }

  // Playing state - render the current unit
  return (
    <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
      {/* Top Progress Bar */}
      <div className="shrink-0 px-4 pt-4 pb-2 border-b-2 border-zinc-100 flex justify-center">
        <div className="w-[56rem] shrink-0 flex items-center gap-4">
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-zinc-100 transition-colors shrink-0"
              aria-label="Close lesson"
            >
              <span className="text-xl font-bold">×</span>
            </button>
          )}

          {/* Progress */}
          <div className="flex-1">
            <ProgressBar current={progress.current} total={progress.total} />
          </div>

          {/* Section indicator */}
          {lessonData && lessonData.sections.length > 1 && (
            <div className="text-xs font-bold tracking-widest uppercase text-zinc-400 shrink-0">
              Section {currentSectionIndex + 1}/{lessonData.sections.length}
            </div>
          )}

          {/* Score */}
          {total > 0 && (
            <div className="text-right shrink-0">
              <div className="text-lg font-black font-mono tracking-tight">
                <span className="text-bauhaus-green">{score}</span>
                <span className="text-zinc-300 mx-1">/</span>
                <span>{total}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unit Content - Fixed width wrapper to prevent resizing between units */}
      <div className="flex-1 min-h-0 overflow-hidden flex justify-center">
        <div className="h-full w-[56rem] shrink-0">
          <UnitDispatcher unit={currentUnit} onComplete={handleUnitComplete} />
        </div>
      </div>
    </div>
  );
}

