import { useEffect, useRef } from "react";
import {
  useSectionedLessonStore,
  useCurrentUnit,
  useTotalScore,
  useCurrentUnitGlobalIndex,
} from "../../stores/useSectionedLessonStore";
import UnitDispatcher from "./UnitDispatcher";
import LessonRoadmapView from "./LessonRoadmapView";
import SectionIntro from "./SectionIntro";

interface LessonPlayerProps {
  onClose?: () => void;
  onLessonComplete?: () => void;
}

export default function LessonPlayer({
  onClose,
  onLessonComplete,
}: LessonPlayerProps) {
  const status = useSectionedLessonStore((s) => s.status);
  const lessonView = useSectionedLessonStore((s) => s.lessonView);
  const recordResult = useSectionedLessonStore((s) => s.recordResult);
  const startLesson = useSectionedLessonStore((s) => s.startLesson);
  const lessonData = useSectionedLessonStore((s) => s.lessonData);
  const currentSectionIndex = useSectionedLessonStore(
    (s) => s.currentSectionIndex
  );
  const goToRoadmap = useSectionedLessonStore((s) => s.goToRoadmap);
  const goToUnit = useSectionedLessonStore((s) => s.goToUnit);
  const advanceToNextUnit = useSectionedLessonStore((s) => s.advanceToNextUnit);

  const currentUnit = useCurrentUnit();
  const { score, total } = useTotalScore();
  const currentUnitGlobalIndex = useCurrentUnitGlobalIndex();

  const unitStartTime = useRef<number>(Date.now());

  // Start lesson when component mounts if in idle state
  useEffect(() => {
    if (status === "idle" && lessonData) {
      startLesson();
    }
  }, [status, startLesson, lessonData]);

  // Reset unit timer when unit changes
  useEffect(() => {
    unitStartTime.current = Date.now();
  }, [currentUnit]);

  // Handle lesson completion
  useEffect(() => {
    if (status === "completed" && onLessonComplete) {
      // Small delay so the completed screen renders first
      // onLessonComplete();
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

    // Advance to next unit (or section intro or completion)
    advanceToNextUnit();
  };

  const handleSectionIntroContinue = () => {
    // Start the first unit of the current section
    goToUnit(currentSectionIndex, 0);
  };

  // ============================
  // RENDER STATES
  // ============================

  // Loading / generating state
  if (status === "generating") {
    return (
      <div className="h-full bg-bauhaus-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tighter mb-4">
            Maestro is composing<span className="text-bauhaus-blue">...</span>
          </h2>
          <p className="text-zinc-400 mb-6 text-sm">
            Building your personalized lesson
          </p>
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

          <div className="flex gap-4 justify-center">
            <button
              onClick={goToRoadmap}
              className="px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-white text-black hover:bg-zinc-100 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              View Map
            </button>
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
      </div>
    );
  }

  // Not loaded
  if (!lessonData) {
    return (
      <div className="h-full bg-bauhaus-white flex items-center justify-center">
        <p className="text-zinc-500">No lesson loaded</p>
      </div>
    );
  }

  // ============================
  // PLAYING STATE - sub views
  // ============================

  // Roadmap view
  if (lessonView === "roadmap") {
    return <LessonRoadmapView lessonData={lessonData} onClose={onClose} />;
  }

  // Section intro view
  if (lessonView === "section-intro") {
    const section = lessonData.sections[currentSectionIndex];
    return (
      <SectionIntro
        sectionName={section?.sectionInstruction ?? `Section ${currentSectionIndex + 1}`}
        sectionIndex={currentSectionIndex}
        totalSections={lessonData.sections.length}
        onContinue={handleSectionIntroContinue}
      />
    );
  }

  // Unit view - render the current unit with navigation chrome
  if (!currentUnit) {
    return (
      <div className="h-full bg-bauhaus-white flex items-center justify-center">
        <p className="text-zinc-500">No unit to display</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
      {/* Top bar with roadmap button */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b-2 border-zinc-100 flex justify-center">
        <div className="w-[56rem] shrink-0 flex items-center gap-4">
          {/* Back to roadmap button */}
          <button
            onClick={goToRoadmap}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold tracking-wider uppercase
              border-2 border-black hover:bg-zinc-100 transition-colors shrink-0"
            aria-label="Back to lesson map"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0020 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Map
          </button>

          {/* Section name */}
          <div className="flex-1 text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">
              {lessonData.sections[currentSectionIndex]?.sectionInstruction}
            </span>
          </div>

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

      {/* Unit Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex justify-center">
        <div className="h-full w-[56rem] shrink-0">
          <UnitDispatcher
            key={currentUnitGlobalIndex}
            unit={currentUnit}
            onComplete={handleUnitComplete}
          />
        </div>
      </div>
    </div>
  );
}
