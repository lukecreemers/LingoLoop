import { useEffect, useState } from "react";
import type { GenerationProgress } from "../../stores/useSectionedLessonStore";

interface MaestroLoadingProps {
  progress: GenerationProgress | null;
}

// Pipeline stages in order
const STAGES = [
  { key: "structure", label: "Creating lesson plan", icon: "📝" },
  { key: "parsing", label: "Analyzing structure", icon: "🔍" },
  { key: "units", label: "Generating units", icon: "⚙️" },
  { key: "summaries", label: "Writing summaries", icon: "✨" },
  { key: "complete", label: "Ready!", icon: "🎉" },
] as const;

function getStageIndex(stage: string | undefined): number {
  if (!stage) return -1;
  return STAGES.findIndex((s) => s.key === stage);
}

export default function MaestroLoading({ progress }: MaestroLoadingProps) {
  const [dots, setDots] = useState("");

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const currentStageIdx = getStageIndex(progress?.stage);
  const unitProgress = progress?.stage === "units" && progress.total
    ? { current: progress.current ?? 0, total: progress.total }
    : null;

  // Overall percentage
  const overallPct = (() => {
    if (!progress) return 5;
    if (progress.stage === "complete") return 100;
    const stageWeight: Record<string, number> = {
      structure: 15,
      parsing: 25,
      units: 30, // base, will add unit progress
      summaries: 85,
    };
    const base = stageWeight[progress.stage] ?? 5;
    if (progress.stage === "units" && unitProgress) {
      const unitPct = unitProgress.total > 0
        ? (unitProgress.current / unitProgress.total) * 55 // units span 30-85%
        : 0;
      return Math.min(30 + unitPct, 85);
    }
    return base;
  })();

  return (
    <div className="h-full bg-bauhaus-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 left-12 w-24 h-24 bg-bauhaus-blue opacity-[0.04] rotate-12" />
        <div className="absolute bottom-16 right-16 w-32 h-32 bg-bauhaus-red opacity-[0.04] -rotate-12" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-bauhaus-green opacity-[0.04] rotate-45" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main icon + title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-4xl border-2 border-black">
              🎵
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tighter mb-1">
            Maestro is composing
            <span className="inline-block w-[1.5ch] text-left">{dots}</span>
          </h2>
          <p className="text-sm text-zinc-400">
            Building your personalized lesson
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="w-full h-3 bg-zinc-100 border-2 border-black overflow-hidden">
            <div
              className="h-full bg-bauhaus-blue transition-all duration-700 ease-out"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-xs font-bold text-zinc-400">
              {progress?.message ?? "Initializing..."}
            </p>
            <p className="text-xs font-mono font-bold text-zinc-400">
              {Math.round(overallPct)}%
            </p>
          </div>
        </div>

        {/* Stage checklist */}
        <div className="bg-white border-2 border-black p-5 bauhaus-shadow">
          <div className="space-y-3">
            {STAGES.map((stage, i) => {
              const isComplete = i < currentStageIdx;
              const isActive = i === currentStageIdx;
              const isPending = i > currentStageIdx;

              return (
                <div key={stage.key} className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="w-7 h-7 flex items-center justify-center shrink-0">
                    {isComplete ? (
                      <div className="w-6 h-6 bg-bauhaus-green text-white flex items-center justify-center border border-black">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 bg-bauhaus-blue text-white flex items-center justify-center border border-black animate-pulse">
                        <span className="text-xs">{stage.icon}</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-zinc-100 text-zinc-300 flex items-center justify-center border border-zinc-200">
                        <div className="w-2 h-2 bg-zinc-200 rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-bold tracking-wide ${
                        isComplete
                          ? "text-zinc-400 line-through"
                          : isActive
                            ? "text-black"
                            : "text-zinc-300"
                      }`}
                    >
                      {stage.label}
                    </p>
                    {/* Unit sub-progress */}
                    {isActive && stage.key === "units" && unitProgress && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-zinc-100 overflow-hidden">
                          <div
                            className="h-full bg-bauhaus-blue transition-all duration-300"
                            style={{
                              width: `${unitProgress.total > 0 ? (unitProgress.current / unitProgress.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-zinc-400">
                          {unitProgress.current}/{unitProgress.total}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status text */}
                  {isPending && (
                    <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
                      pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fun tip */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-300 italic">
            Each lesson is uniquely crafted for you ✦
          </p>
        </div>
      </div>
    </div>
  );
}

