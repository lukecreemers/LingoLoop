import { useState, useMemo, useCallback, useEffect } from "react";
import type { WOOutput, LessonPlanUnit } from "@shared";
import { RedoButton } from "../../components/ui/RedoButton";

interface WordOrderProps {
  data: WOOutput;
  plan: LessonPlanUnit;
  onComplete: () => void;
}

interface SentenceProgress {
  originalWords: string[];
  shuffledWords: string[];
  userOrder: string[];
  wordStatuses: ("pending" | "correct" | "incorrect")[];
  isChecked: boolean;
  isCorrect: boolean | null;
}

// Shuffle array using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Split sentence into words, keeping punctuation attached
function splitSentence(sentence: string): string[] {
  // Split on spaces but keep punctuation with words
  return sentence.split(/\s+/).filter((w) => w.length > 0);
}

// Get score color based on value
function getScoreColor(correct: number, total: number): string {
  const ratio = correct / total;
  if (ratio >= 0.8) return "text-bauhaus-green";
  if (ratio >= 0.5) return "text-bauhaus-yellow";
  return "text-bauhaus-red";
}

// Initialize progress from data
function initializeProgress(data: WOOutput): SentenceProgress[] {
  return data.sentences.map((s) => {
    const words = splitSentence(s.sentence);
    let shuffled = shuffleArray(words);
    // Ensure shuffled is different from original
    while (shuffled.join(" ") === words.join(" ") && words.length > 1) {
      shuffled = shuffleArray(words);
    }
    return {
      originalWords: words,
      shuffledWords: shuffled,
      userOrder: [],
      wordStatuses: [],
      isChecked: false,
      isCorrect: null,
    };
  });
}

export default function WordOrder({ data, plan, onComplete }: WordOrderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<SentenceProgress[]>(() =>
    initializeProgress(data)
  );

  // Reset state when data changes (e.g., after redo)
  // Use JSON.stringify to ensure we detect changes even if object reference stays same
  const dataKey = JSON.stringify(data.sentences.map((s) => s.sentence));
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(initializeProgress(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  const currentSentence = data.sentences[currentIndex];
  const currentProgress = progress[currentIndex];
  const correctCount = progress.filter((p) => p.isCorrect === true).length;
  const completedCount = progress.filter((p) => p.isChecked).length;
  const allCompleted = completedCount === data.sentences.length;

  // Words still available to place
  const availableWords = useMemo(() => {
    const usedIndices = new Set<number>();
    currentProgress.userOrder.forEach((word) => {
      // Find the first unused index of this word in shuffledWords
      const idx = currentProgress.shuffledWords.findIndex(
        (w, i) => w === word && !usedIndices.has(i)
      );
      if (idx !== -1) usedIndices.add(idx);
    });
    return currentProgress.shuffledWords
      .map((word, idx) => ({ word, idx }))
      .filter(({ idx }) => !usedIndices.has(idx));
  }, [currentProgress.shuffledWords, currentProgress.userOrder]);

  const handleWordClick = useCallback(
    (word: string) => {
      if (currentProgress.isChecked) return;

      setProgress((prev) =>
        prev.map((p, i) =>
          i === currentIndex ? { ...p, userOrder: [...p.userOrder, word] } : p
        )
      );
    },
    [currentIndex, currentProgress.isChecked]
  );

  const handlePlacedWordClick = useCallback(
    (wordIndex: number) => {
      if (currentProgress.isChecked) return;

      setProgress((prev) =>
        prev.map((p, i) =>
          i === currentIndex
            ? { ...p, userOrder: p.userOrder.filter((_, idx) => idx !== wordIndex) }
            : p
        )
      );
    },
    [currentIndex, currentProgress.isChecked]
  );

  const handleCheck = useCallback(() => {
    // Check each word position individually
    const wordStatuses = currentProgress.userOrder.map(
      (word, idx): "correct" | "incorrect" =>
        word === currentProgress.originalWords[idx] ? "correct" : "incorrect"
    );
    const isCorrect = wordStatuses.every((s) => s === "correct");

    setProgress((prev) =>
      prev.map((p, i) =>
        i === currentIndex ? { ...p, wordStatuses, isChecked: true, isCorrect } : p
      )
    );
  }, [currentIndex, currentProgress]);

  const handleTryAgain = useCallback(() => {
    setProgress((prev) =>
      prev.map((p, i) =>
        i === currentIndex
          ? {
              ...p,
              userOrder: [],
              wordStatuses: [],
              isChecked: false,
              isCorrect: null,
              shuffledWords: shuffleArray(p.originalWords),
            }
          : p
      )
    );
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < data.sentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, data.sentences.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const canCheck =
    currentProgress.userOrder.length === currentProgress.originalWords.length &&
    !currentProgress.isChecked;

  return (
    <div className="h-full bg-bauhaus-white text-black font-sans flex flex-col selection:bg-purple-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              ORDER<span className="text-purple-500">.</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Arrange words in the correct order
            </p>
          </div>

          {completedCount > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
                Score
              </span>
              <div
                className={`text-3xl font-black font-mono ${getScoreColor(
                  correctCount,
                  completedCount
                )}`}
              >
                {correctCount}/{completedCount}
              </div>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {data.sentences.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 flex-1 transition-colors ${
                i === currentIndex
                  ? "bg-zinc-700"
                  : progress[i].isCorrect === true
                  ? "bg-bauhaus-green"
                  : progress[i].isCorrect === false
                  ? "bg-bauhaus-red"
                  : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-y-auto">
        {/* Translation hint */}
        <div className="bg-zinc-100 border-2 border-zinc-200 p-4 mb-6">
          <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Translation
          </span>
          <p className="text-lg text-zinc-600 mt-1">
            {currentSentence.translation}
          </p>
        </div>

        {/* User's answer area */}
        <div className="bg-white border-2 border-black p-6 bauhaus-shadow mb-6">
          <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Your Answer
          </span>
          <div className="min-h-[60px] mt-3 flex flex-wrap gap-2">
            {currentProgress.userOrder.length === 0 ? (
              <span className="text-zinc-300 italic">
                Click words below to build the sentence...
              </span>
            ) : (
              currentProgress.userOrder.map((word, idx) => {
                const wordStatus = currentProgress.wordStatuses[idx];
                return (
                  <button
                    key={`placed-${idx}`}
                    onClick={() => handlePlacedWordClick(idx)}
                    disabled={currentProgress.isChecked}
                    className={`px-4 py-2 text-lg font-medium border-2 transition-all ${
                      !currentProgress.isChecked
                        ? "border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer"
                        : wordStatus === "correct"
                        ? "border-bauhaus-green bg-green-50 text-bauhaus-green"
                        : "border-bauhaus-red bg-rose-50 text-bauhaus-red"
                    }`}
                  >
                    {word}
                  </button>
                );
              })
            )}
          </div>

          {/* Correct answer shown after checking */}
          {currentProgress.isCorrect === false && (
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <span className="text-xs font-bold tracking-widest text-bauhaus-green uppercase">
                Correct Answer
              </span>
              <p className="text-lg text-bauhaus-green mt-1">
                {currentProgress.originalWords.join(" ")}
              </p>
            </div>
          )}
        </div>

        {/* Available words */}
        {!currentProgress.isChecked && (
          <div className="bg-zinc-50 border-2 border-zinc-200 p-6">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
              Available Words
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableWords.map(({ word, idx }) => (
                <button
                  key={`available-${idx}`}
                  onClick={() => handleWordClick(word)}
                  className="px-4 py-2 text-lg font-medium border-2 border-black bg-white hover:bg-zinc-100 
                    transition-all active:translate-y-[1px] bauhaus-shadow"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-6 py-3 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-white text-black hover:bg-zinc-100 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === data.sentences.length - 1}
              className="px-6 py-3 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-white text-black hover:bg-zinc-100 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>

          <div className="flex gap-4">
            {currentProgress.isCorrect === false && (
              <button
                onClick={handleTryAgain}
                className="px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-white text-black hover:bg-zinc-100 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Try Again
              </button>
            )}

            {allCompleted && (
              <RedoButton
                unitPlan={plan}
                onRedo={() => {
                  // Only reset index - the useEffect will handle resetting
                  // progress when the new data arrives from the store
                  setCurrentIndex(0);
                }}
              />
            )}

            {!currentProgress.isChecked ? (
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className={`
                  px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                  ${
                    canCheck
                      ? "bg-purple-500 text-white hover:bg-purple-600 bauhaus-shadow"
                      : "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                  }
                `}
              >
                Check
              </button>
            ) : allCompleted ? (
              <button
                onClick={onComplete}
                className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-purple-500 text-white hover:bg-purple-600 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

