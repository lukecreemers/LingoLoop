import { useState, useCallback } from "react";
import type { WritingTask } from "@shared";
import WritingPractice from "../units/WritingPractice";

// ============================================================================
// DAILY WRITING EXERCISE
// Wraps the existing WritingPractice component with a daily-loop recap screen.
// After completing all prompts, the user sees a recap with the option to
// generate a new writing exercise or request a custom topic.
// ============================================================================

interface DailyWritingExerciseProps {
  task: WritingTask;
  onComplete: () => void;
}

type Phase = "writing" | "recap" | "generating";

export default function DailyWritingExercise({
  task,
  onComplete,
}: DailyWritingExerciseProps) {
  const [phase, setPhase] = useState<Phase>("writing");
  const [customRequest, setCustomRequest] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Key to force-remount WritingPractice when regenerating
  const [writingKey, setWritingKey] = useState(0);

  const handleWritingComplete = useCallback(() => {
    setPhase("recap");
  }, []);

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    setPhase("generating");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      await fetch(`${apiUrl}/daily-loop/generate-writing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length: task.config.length,
          promptCount: task.config.promptCount,
          customRequest: customRequest.trim() || undefined,
          targetVocab: task.targetVocab,
          targetConcepts: task.targetConcepts,
        }),
      });
      // TODO: In future, replace writing exercise with AI response.
      // For now, restart with same content as placeholder.
    } catch {
      // Stub endpoint — still restart
    }

    // Reset and restart writing
    setCustomRequest("");
    setIsGenerating(false);
    setWritingKey((k) => k + 1);
    setPhase("writing");
  };

  // ============================================================================
  // GENERATING SCREEN
  // ============================================================================
  if (phase === "generating") {
    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-black mb-2">
            Generating Writing<span className="text-orange-500">...</span>
          </h2>
          <p className="text-zinc-500 text-sm">
            Creating a new AI-powered writing exercise for you
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RECAP SCREEN
  // ============================================================================
  if (phase === "recap") {
    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
        <header className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              WRITING RECAP<span className="text-orange-500">.</span>
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-4">
          {/* Summary */}
          <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200">
            <h3 className="font-bold text-lg mb-1">
              {task.writingExercise.topic}
            </h3>
            <p className="text-sm text-zinc-500">
              {task.writingExercise.prompts.length} prompts completed •{" "}
              {task.config.length} difficulty
            </p>
          </div>

          {/* Vocab used */}
          <div className="mb-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Target Vocabulary
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.targetVocab.map((word) => (
                <span
                  key={word}
                  className="px-2 py-1 bg-orange-100 text-orange-700 text-sm border border-orange-200 font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Concepts practiced */}
          <div className="mb-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Grammar Concepts
            </h4>
            <div className="space-y-1">
              {task.targetConcepts.map((concept, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span className="text-zinc-600">{concept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate new / custom request */}
          <div className="mt-8 p-6 bg-white border-2 border-black bauhaus-shadow">
            <h3 className="font-bold text-lg mb-2">
              Want another writing exercise?
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Generate a new AI-powered writing exercise, or describe what
              you'd like to write about.
            </p>
            <textarea
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              placeholder="e.g. I want to practice writing about my daily routine..."
              className="w-full p-3 border-2 border-zinc-200 text-sm resize-none h-20 focus:outline-none focus:border-orange-500 mb-3"
            />
            <button
              onClick={handleGenerateNew}
              disabled={isGenerating}
              className="w-full px-6 py-3 text-sm font-bold uppercase tracking-widest border-2 border-black
                bg-orange-500 text-white hover:bg-orange-600 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating
                ? "Generating..."
                : customRequest.trim()
                  ? "Generate Custom Writing →"
                  : "Generate New Writing →"}
            </button>
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

  // ============================================================================
  // WRITING PRACTICE (existing component)
  // ============================================================================
  return (
    <WritingPractice
      key={writingKey}
      data={task.writingExercise}
      plan={{
        type: "writing_practice",
        instructions: `Daily writing practice. Target vocab: ${task.targetVocab.join(", ")}. Concepts: ${task.targetConcepts.join(", ")}`,
      }}
      onComplete={handleWritingComplete}
    />
  );
}
