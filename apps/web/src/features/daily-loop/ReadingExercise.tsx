import { useState, useCallback, useMemo } from "react";
import type {
  ReadingTask,
  ReadingPassage,
  ReadingActivityType,
  TMOutput,
} from "@shared";
import { DEMO_KNOWN_VOCAB } from "../../constants/vocab";
import ReadingContent from "./ReadingContent";
import { useDailyVocab } from "../../stores/useDailyLoopStore";

// ============================================================================
// READING EXERCISE
// Phases: read → [optional activities: mcq, translate_phrases] → recap
// Reading text uses SelectableText with underlines on unknown words.
// Translate phrases uses the AI translation-marking API.
// After completion, user can generate a new one or request a custom topic.
// ============================================================================

interface ReadingExerciseProps {
  task: ReadingTask;
  onComplete: () => void;
}

type Phase = "reading" | "mcq" | "translate_phrases" | "recap" | "generating";

// ============================================================================
// TRANSLATION MARKING HOOK (same API as Translation unit)
// ============================================================================

function useTranslationMarking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markTranslation = async (
    referenceText: string,
    userTranslation: string
  ): Promise<TMOutput | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/translation-marking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceText, userTranslation }),
      });

      if (!response.ok) throw new Error("Failed to mark translation");
      const result = await response.json();
      return result.data as TMOutput;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { markTranslation, isLoading, error };
}

// ============================================================================
// PARSE MARKED TEXT (from Translation unit)
// ============================================================================

interface TextSegment {
  type: "text" | "error";
  content: string;
  fix?: string;
  why?: string;
  severity?: "minor" | "major";
}

function parseMarkedText(markedText: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex =
    /<err\s+(?:severity="([^"]*)"\s+)?fix="([^"]*)"\s+why="([^"]*)">([^<]*)<\/err>/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(markedText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: markedText.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "error",
      content: match[4],
      fix: match[2],
      why: match[3],
      severity: (match[1] as "minor" | "major") || "major",
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < markedText.length) {
    segments.push({ type: "text", content: markedText.slice(lastIndex) });
  }

  return segments;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReadingExercise({
  task,
  onComplete,
}: ReadingExerciseProps) {
  const { config } = task;
  const activities = config.activities;
  const dailyVocab = useDailyVocab();

  // ── Mutable passage state (can be replaced by AI generation) ─────────
  const [passage, setPassage] = useState<ReadingPassage>(task.passage);

  // Determine the phase sequence: reading → configured activities → recap
  const phaseSequence: Phase[] = ["reading", ...activities, "recap"];

  const [phaseIndex, setPhaseIndex] = useState(0);
  const currentPhase = phaseSequence[phaseIndex];

  // MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelectedAnswer, setMcqSelectedAnswer] = useState<number | null>(
    null
  );
  const [mcqShowFeedback, setMcqShowFeedback] = useState(false);
  const [mcqScore, setMcqScore] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<(number | null)[]>([]);

  // Translate phrases state
  const [tpIndex, setTpIndex] = useState(0);
  const [tpUserInput, setTpUserInput] = useState("");
  const [tpMarkingResult, setTpMarkingResult] = useState<TMOutput | null>(null);
  const [, setTpScore] = useState(0);
  const [tpResults, setTpResults] = useState<
    Array<{ score: number; markingResult: TMOutput | null }>
  >([]);

  // Recap state
  const [customRequest, setCustomRequest] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Extend reading state ("Generate More" in reading phase)
  const [isExtending, setIsExtending] = useState(false);

  // Translation marking hook
  const {
    markTranslation,
    isLoading: isMarking,
    error: markingError,
  } = useTranslationMarking();

  // Build knownVocab set — combine demo known words with daily vocab words
  const knownVocab = useMemo(() => {
    const vocabSet = new Set(DEMO_KNOWN_VOCAB);
    // Target vocab words from the passage are "new" so NOT in known
    // (they should be underlined). We don't add them.
    return vocabSet;
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const goNextPhase = useCallback(() => {
    setPhaseIndex((i) => Math.min(i + 1, phaseSequence.length - 1));
  }, [phaseSequence.length]);

  // Reset all state for "generate new"
  const resetAllState = useCallback(() => {
    setPhaseIndex(0);
    setMcqIndex(0);
    setMcqSelectedAnswer(null);
    setMcqShowFeedback(false);
    setMcqScore(0);
    setMcqAnswers([]);
    setTpIndex(0);
    setTpUserInput("");
    setTpMarkingResult(null);
    setTpScore(0);
    setTpResults([]);
    setCustomRequest("");
    setIsGenerating(false);
    setIsExtending(false);
  }, []);

  // ── Generate More (extend current reading) ────────────────────────────
  const handleExtendReading = useCallback(async () => {
    if (isExtending) return;
    setIsExtending(true);
    try {
      const response = await fetch(`${apiUrl}/daily-loop/extend-reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingContent: passage.content,
          dailyVocab,
          targetLanguage: "Spanish",
          nativeLanguage: "English",
          level: "beginner",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.data?.content || data?.content) {
          const newContent = data?.data?.content || data?.content;
          setPassage((prev) => ({
            ...prev,
            content: prev.content + "\n\n" + newContent,
          }));
        }
      }
    } catch {
      // Silently handle errors
    } finally {
      setIsExtending(false);
    }
  }, [apiUrl, passage.content, dailyVocab, isExtending]);

  // ============================================================================
  // GENERATING SCREEN — shown while AI generates new content
  // ============================================================================
  if (currentPhase === "generating" || isGenerating) {
    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-black mb-2">
            Generating Reading<span className="text-amber-500">...</span>
          </h2>
          <p className="text-zinc-500 text-sm">
            Creating a new AI-powered reading exercise for you
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // READING PHASE — with SelectableText + underlined unknown words
  // ============================================================================
  if (currentPhase === "reading") {
    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden text-start">
        <header className="px-8 pt-6 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-3 border-b-4 border-black pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300">
                  {passage.type}
                </span>
                {activities.length === 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-300">
                    Read Only
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-none">
                {passage.title}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {passage.titleTranslation}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500" />
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Reading
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 pb-4">
          {/* Vocab sidebar */}
          <div className="mb-5 p-3 bg-purple-50/60 border border-purple-200 rounded-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2">
              <span className="inline-block w-3 h-0.5 bg-purple-400 mr-1.5 align-middle" />
              Key Vocabulary — Underlined words are new. Tap any word to translate.
            </div>
            <div className="flex flex-wrap gap-2">
              {passage.targetVocab.map((v) => (
                <span
                  key={v.word}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-purple-200 text-sm rounded-sm"
                  title={v.definition}
                >
                  <span className="font-bold text-purple-700">{v.word}</span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-zinc-600">{v.definition}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Reading passage with rich markdown + SelectableText */}
          <ReadingContent
            content={passage.content}
            type={passage.type}
            knownVocab={knownVocab}
            sourceLanguage="Spanish"
            targetLanguage="English"
          />

          {/* Generate More button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleExtendReading}
              disabled={isExtending}
              className="group flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest
                border-2 border-zinc-300 bg-white text-zinc-600
                hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50
                transition-all duration-150
                disabled:opacity-60 disabled:cursor-wait"
            >
              {isExtending ? (
                <>
                  <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="text-lg leading-none group-hover:scale-110 transition-transform">
                    +
                  </span>
                  Generate More
                </>
              )}
            </button>
          </div>
        </main>

        <footer className="shrink-0 bg-white border-t-4 border-black p-6">
          <div className="flex justify-between items-center">
            {activities.length > 0 && (
              <p className="text-sm text-zinc-400">
                Up next: {activities.map(activityLabel).join(", ")}
              </p>
            )}
            <div className="flex-1" />
            <button
              onClick={goNextPhase}
              className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-amber-500 text-white hover:bg-amber-600 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {activities.length > 0
                ? `${activityLabel(activities[0])} →`
                : "Done →"}
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // MCQ PHASE
  // ============================================================================
  if (currentPhase === "mcq") {
    const questions = passage.comprehensionQuestions;
    const current = questions[mcqIndex];
    const totalQuestions = questions.length;
    const isCorrect =
      mcqShowFeedback && mcqSelectedAnswer === current?.correctIndex;

    if (!current) {
      goNextPhase();
      return null;
    }

    const handleSelectAnswer = (index: number) => {
      if (mcqShowFeedback) return;
      setMcqSelectedAnswer(index);
      setMcqShowFeedback(true);
      if (index === current.correctIndex) {
        setMcqScore((s) => s + 1);
      }
      setMcqAnswers((prev) => [...prev, index]);
    };

    const handleNextQuestion = () => {
      if (mcqIndex < totalQuestions - 1) {
        setMcqIndex((q) => q + 1);
        setMcqSelectedAnswer(null);
        setMcqShowFeedback(false);
      } else {
        goNextPhase();
      }
    };

    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
        <header className="px-8 pt-6 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-3 border-b-4 border-black pb-3">
            <h1 className="text-3xl font-black tracking-tight leading-none">
              COMPRENSIÓN<span className="text-amber-500">.</span>
            </h1>
            <div className="text-right">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Question
              </span>
              <div className="text-2xl font-black font-mono">
                <span className="text-amber-500">
                  {(mcqIndex + 1).toString().padStart(2, "0")}
                </span>
                <span className="text-zinc-300 mx-1">/</span>
                <span>{totalQuestions.toString().padStart(2, "0")}</span>
              </div>
            </div>
          </div>
          <div className="h-2 bg-zinc-200 relative">
            <div
              className="absolute inset-y-0 left-0 bg-amber-500 transition-all duration-500"
              style={{
                width: `${((mcqIndex + (mcqShowFeedback ? 1 : 0)) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-2xl font-black mb-2">{current.question}</h2>
              <p className="text-zinc-500 italic">
                {current.questionTranslation}
              </p>
            </div>
            <div className="space-y-3">
              {current.options.map((option, i) => {
                let styles =
                  "bg-white border-2 border-zinc-200 hover:border-black hover:bauhaus-shadow";
                if (mcqShowFeedback) {
                  if (i === current.correctIndex) {
                    styles =
                      "bg-emerald-50 border-2 border-emerald-500 ring-2 ring-emerald-200";
                  } else if (i === mcqSelectedAnswer && !isCorrect) {
                    styles =
                      "bg-red-50 border-2 border-red-500 ring-2 ring-red-200";
                  } else {
                    styles = "bg-white border-2 border-zinc-200 opacity-50";
                  }
                } else if (mcqSelectedAnswer === i) {
                  styles =
                    "bg-amber-50 border-2 border-amber-500 bauhaus-shadow";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(i)}
                    disabled={mcqShowFeedback}
                    className={`w-full text-left p-4 transition-all duration-150 flex items-center gap-4 ${styles}`}
                  >
                    <span className="w-8 h-8 shrink-0 flex items-center justify-center font-bold text-sm border-2 border-current">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-lg font-medium">{option}</span>
                    {mcqShowFeedback && i === current.correctIndex && (
                      <span className="ml-auto text-emerald-600 font-bold">
                        ✓
                      </span>
                    )}
                    {mcqShowFeedback &&
                      i === mcqSelectedAnswer &&
                      !isCorrect && (
                        <span className="ml-auto text-red-500 font-bold">
                          ✗
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
            {mcqShowFeedback && (
              <div
                className={`mt-6 p-4 border-l-4 ${
                  isCorrect
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                <p className="font-bold text-lg">
                  {isCorrect ? "¡Correcto! 🎉" : "Not quite 😅"}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-zinc-600 mt-1">
                    The correct answer was:{" "}
                    <strong>{current.options[current.correctIndex]}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        <footer className="shrink-0 bg-white border-t-4 border-black p-6">
          <div className="flex justify-end">
            {mcqShowFeedback && (
              <button
                onClick={handleNextQuestion}
                className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-amber-500 text-white hover:bg-amber-600 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {mcqIndex < totalQuestions - 1
                  ? "Next Question →"
                  : "Continue →"}
              </button>
            )}
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // TRANSLATE PHRASES PHASE — uses AI translation-marking API
  // ============================================================================
  if (currentPhase === "translate_phrases") {
    const phrases = passage.translatePhrases;
    const totalPhrases = phrases.length;
    const currentPhrase = phrases[tpIndex];

    if (!currentPhrase) {
      goNextPhase();
      return null;
    }

    const parsedMarkedText = tpMarkingResult
      ? parseMarkedText(tpMarkingResult.markedText)
      : [];
    const hasErrors = parsedMarkedText.some((seg) => seg.type === "error");

    const handleSubmitTranslation = async () => {
      if (!tpUserInput.trim()) return;

      // Call the AI translation-marking API (same as Translation unit)
      const result = await markTranslation(
        currentPhrase.translation,
        tpUserInput.trim()
      );
      if (result) {
        setTpMarkingResult(result);
        if (result.overallScore >= 7) {
          setTpScore((s) => s + 1);
        }
        setTpResults((prev) => [...prev, { score: result.overallScore, markingResult: result }]);
      }
    };

    const handleNextPhrase = () => {
      if (tpIndex < totalPhrases - 1) {
        setTpIndex((i) => i + 1);
        setTpUserInput("");
        setTpMarkingResult(null);
      } else {
        goNextPhase();
      }
    };

    const handleTryAgain = () => {
      setTpMarkingResult(null);
      setTpUserInput("");
    };

    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
        <header className="px-8 pt-6 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-3 border-b-4 border-black pb-3">
            <h1 className="text-3xl font-black tracking-tight leading-none">
              TRANSLATE<span className="text-indigo-500">.</span>
            </h1>
            <div className="text-right">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Phrase
              </span>
              <div className="text-2xl font-black font-mono">
                <span className="text-indigo-500">
                  {(tpIndex + 1).toString().padStart(2, "0")}
                </span>
                <span className="text-zinc-300 mx-1">/</span>
                <span>{totalPhrases.toString().padStart(2, "0")}</span>
              </div>

              {/* Show score from marking result */}
              {tpMarkingResult && (
                <div
                  className={`text-xl font-black font-mono mt-1 ${
                    tpMarkingResult.overallScore >= 8
                      ? "text-emerald-600"
                      : tpMarkingResult.overallScore >= 5
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {tpMarkingResult.overallScore}/10
                </div>
              )}
            </div>
          </div>
          <div className="h-2 bg-zinc-200 relative">
            <div
              className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500"
              style={{
                width: `${((tpIndex + (tpMarkingResult ? 1 : 0)) / totalPhrases) * 100}%`,
              }}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
          <div className="flex-1">
            {/* Context */}
            <div className="mb-4 p-3 bg-zinc-50 border border-zinc-200 text-sm text-zinc-500 italic">
              Context: {currentPhrase.context}
            </div>

            {/* Phrase to translate */}
            <div className="mb-6 p-6 bg-white border-2 border-black bauhaus-shadow">
              <div className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-2">
                Translate this phrase
              </div>
              <p className="text-2xl font-black">{currentPhrase.phrase}</p>
            </div>

            {/* User input or marking result */}
            {!tpMarkingResult ? (
              <div className="bg-white border-2 border-black p-4 bauhaus-shadow">
                <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">
                  Your translation (in English)
                </div>
                <textarea
                  value={tpUserInput}
                  onChange={(e) => setTpUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitTranslation();
                    }
                  }}
                  placeholder="Type your translation..."
                  className="w-full text-lg py-2 focus:outline-none placeholder:text-zinc-300 resize-none"
                  rows={2}
                  disabled={isMarking}
                  autoFocus
                />
                {markingError && (
                  <p className="text-sm text-red-600 mt-2">{markingError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Marked result with error highlighting */}
                <div className="p-4 bg-white border-2 border-black bauhaus-shadow">
                  <div className="text-xs font-bold tracking-widest uppercase mb-2 text-zinc-400">
                    Your translation{hasErrors ? " (with corrections)" : ""}
                  </div>
                  <div className="text-lg leading-relaxed">
                    {parsedMarkedText.map((segment, idx) => {
                      if (segment.type === "text") {
                        return <span key={idx}>{segment.content}</span>;
                      }
                      const isMinor = segment.severity === "minor";
                      return (
                        <span key={idx} className="relative group inline-block">
                          <span
                            className={`px-1 cursor-help border-b-2 ${
                              isMinor
                                ? "bg-amber-50 border-amber-400 text-amber-700 border-dashed"
                                : "bg-rose-100 border-red-500 text-red-600"
                            }`}
                          >
                            {segment.content}
                          </span>
                          {/* Tooltip */}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {isMinor && (
                              <span className="block text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">
                                Minor
                              </span>
                            )}
                            <span className="font-bold text-emerald-400">
                              {segment.fix}
                            </span>
                            <span className="block text-xs text-zinc-300 mt-1">
                              {segment.why}
                            </span>
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Correct translation */}
                <div className="p-4 border-2 border-emerald-500 bg-emerald-50">
                  <div className="text-xs font-bold tracking-widest uppercase mb-1 text-emerald-600">
                    Correct translation
                  </div>
                  <p className="text-lg font-bold text-emerald-800">
                    {currentPhrase.translation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="shrink-0 bg-white border-t-4 border-black p-6">
          <div className="flex justify-between">
            {/* Try again */}
            {tpMarkingResult && (
              <button
                onClick={handleTryAgain}
                className="px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-white text-black hover:bg-zinc-100 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Try Again
              </button>
            )}

            <div className="flex-1" />

            {!tpMarkingResult ? (
              <button
                onClick={handleSubmitTranslation}
                disabled={!tpUserInput.trim() || isMarking}
                className={`px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                  ${
                    tpUserInput.trim() && !isMarking
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 bauhaus-shadow"
                      : "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                  }`}
              >
                {isMarking ? "Checking..." : "Check →"}
              </button>
            ) : (
              <button
                onClick={handleNextPhrase}
                className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-indigo-500 text-white hover:bg-indigo-600 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {tpIndex < totalPhrases - 1 ? "Next Phrase →" : "Continue →"}
              </button>
            )}
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // RECAP PHASE — summary + generate new / custom request
  // ============================================================================
  if (currentPhase === "recap") {
    const mcqTotal = passage.comprehensionQuestions.length;
    const hasMcq = activities.includes("mcq");
    const hasTranslate = activities.includes("translate_phrases");

    // Average translate score
    const avgTpScore =
      tpResults.length > 0
        ? Math.round(
            tpResults.reduce((sum, r) => sum + r.score, 0) / tpResults.length
          )
        : 0;

    const handleGenerateNew = async () => {
      setIsGenerating(true);
      try {
        const response = await fetch(`${apiUrl}/daily-loop/generate-reading`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: config.contentType,
            length: config.length,
            customRequest: customRequest.trim() || undefined,
            dailyVocab,
            targetLanguage: "Spanish",
            nativeLanguage: "English",
            level: "beginner",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // API may wrap in { data: ... } or return directly
          const newPassage: ReadingPassage = data?.data || data;
          if (newPassage?.content) {
            setPassage(newPassage);
          }
        }
      } catch {
        // On error, just restart with current passage
      }

      // Reset all state and restart the reading
      resetAllState();
    };

    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
        <header className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              READING RECAP<span className="text-amber-500">.</span>
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-4">
          {/* Reading summary */}
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200">
            <h3 className="font-bold text-lg mb-1">{passage.title}</h3>
            <p className="text-sm text-zinc-500">{passage.titleTranslation}</p>
            <p className="text-sm text-zinc-400 mt-1 uppercase">
              {passage.type} • {config.length}
            </p>
          </div>

          {/* Activity scores */}
          {(hasMcq || hasTranslate) && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {hasMcq && (
                <div className="p-4 bg-white border-2 border-black text-center">
                  <div className="text-3xl font-black text-amber-600">
                    {mcqScore}/{mcqTotal}
                  </div>
                  <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mt-1">
                    Comprehension
                  </div>
                </div>
              )}
              {hasTranslate && (
                <div className="p-4 bg-white border-2 border-black text-center">
                  <div className="text-3xl font-black text-indigo-600">
                    {avgTpScore}/10
                  </div>
                  <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mt-1">
                    Avg Translation Score
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MCQ review */}
          {hasMcq && mcqAnswers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">
                Comprehension Review
              </h4>
              <div className="space-y-2">
                {passage.comprehensionQuestions.map((q, i) => {
                  const userAnswer = mcqAnswers[i];
                  const correct = userAnswer === q.correctIndex;
                  return (
                    <div
                      key={i}
                      className={`p-3 border-2 flex items-center gap-3 ${
                        correct
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 shrink-0 flex items-center justify-center text-sm font-bold text-white ${
                          correct ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      >
                        {correct ? "✓" : "✗"}
                      </span>
                      <span className="text-sm">
                        {q.questionTranslation}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Translation review */}
          {hasTranslate && tpResults.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">
                Translation Review
              </h4>
              <div className="space-y-2">
                {passage.translatePhrases
                  .slice(0, tpResults.length)
                  .map((phrase, i) => {
                    const result = tpResults[i];
                    const good = result && result.score >= 7;
                    return (
                      <div
                        key={i}
                        className={`p-3 border-2 ${
                          good
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-amber-300 bg-amber-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">{phrase.phrase}</p>
                          {result && (
                            <span
                              className={`text-sm font-black ${
                                good ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {result.score}/10
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          → {phrase.translation}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Generate new / custom request */}
          <div className="mt-8 p-6 bg-white border-2 border-black bauhaus-shadow">
            <h3 className="font-bold text-lg mb-2">Want another reading?</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Generate a new AI-powered reading exercise, or tell us what you'd
              like to read about.
            </p>
            <textarea
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              placeholder="e.g. I want a reading about shopping at a market..."
              className="w-full p-3 border-2 border-zinc-200 text-sm resize-none h-20 focus:outline-none focus:border-amber-500 mb-3"
            />
            <button
              onClick={handleGenerateNew}
              disabled={isGenerating}
              className="w-full px-6 py-3 text-sm font-bold uppercase tracking-widest border-2 border-black
                bg-amber-500 text-white hover:bg-amber-600 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating
                ? "Generating..."
                : customRequest.trim()
                  ? "Generate Custom Reading →"
                  : "Generate New Reading →"}
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

  return null;
}

// ============================================================================
// HELPERS
// ============================================================================

function activityLabel(activity: ReadingActivityType): string {
  switch (activity) {
    case "mcq":
      return "Comprehension";
    case "translate_phrases":
      return "Translate Phrases";
    default:
      return activity;
  }
}
