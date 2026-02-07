import { useState, useCallback, useMemo } from "react";
import type { FlashcardItem } from "@shared";

/**
 * Daily Flashcards - SRS-style flashcard review
 * Shows new words first, then review words
 * Different from the lesson Flashcard component: designed for daily SRS
 */

interface DailyFlashcardsProps {
  newCards: FlashcardItem[];
  reviewCards: FlashcardItem[];
  onComplete: () => void;
}

type CardCategory = "new" | "review";

interface CardState {
  card: FlashcardItem;
  category: CardCategory;
  status: "pending" | "known" | "unknown";
}

export default function DailyFlashcards({
  newCards,
  reviewCards,
  onComplete,
}: DailyFlashcardsProps) {
  const [cardStates, setCardStates] = useState<CardState[]>(() => {
    // Interleave: start with review, then new, then mix
    const review: CardState[] = reviewCards.map((card) => ({
      card,
      category: "review",
      status: "pending",
    }));
    const fresh: CardState[] = newCards.map((card) => ({
      card,
      category: "new",
      status: "pending",
    }));
    return [...review, ...fresh];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const remaining = useMemo(
    () => cardStates.filter((c) => c.status === "pending" || c.status === "unknown"),
    [cardStates]
  );

  const currentCard = remaining[currentIndex];
  const knownCount = cardStates.filter((c) => c.status === "known").length;
  const totalCards = cardStates.length;
  const progress = Math.round((knownCount / totalCards) * 100);
  const newKnown = cardStates.filter((c) => c.category === "new" && c.status === "known").length;
  const reviewKnown = cardStates.filter((c) => c.category === "review" && c.status === "known").length;

  const handleReveal = useCallback(() => setIsRevealed(true), []);

  const handleKnown = useCallback(() => {
    if (!currentCard) return;
    setCardStates((prev) => {
      const newStates = prev.map((c) =>
        c === currentCard ? { ...c, status: "known" as const } : c
      );
      const newRemaining = newStates.filter(
        (c) => c.status === "pending" || c.status === "unknown"
      );
      if (newRemaining.length === 0) {
        setTimeout(() => setShowResults(true), 0);
      } else {
        setTimeout(() => {
          setCurrentIndex((i) => (i >= newRemaining.length ? 0 : i));
          setIsRevealed(false);
        }, 0);
      }
      return newStates;
    });
  }, [currentCard]);

  const handleUnknown = useCallback(() => {
    if (!currentCard) return;
    setCardStates((prev) => {
      const newStates = prev.map((c) =>
        c === currentCard ? { ...c, status: "unknown" as const } : c
      );
      const newRemaining = newStates.filter(
        (c) => c.status === "pending" || c.status === "unknown"
      );
      setTimeout(() => {
        setCurrentIndex((i) => {
          const next = i + 1;
          return next >= newRemaining.length ? 0 : next;
        });
        setIsRevealed(false);
      }, 0);
      return newStates;
    });
  }, [currentCard]);

  // ============================================================================
  // RESULTS
  // ============================================================================
  if (showResults) {
    return (
      <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
        <header className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              VOCAB<span className="text-purple-500">.</span>
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

            <h2 className="text-3xl font-black mb-2">All Done! 🎉</h2>
            <p className="text-zinc-500 mb-8">
              You've reviewed all {totalCards} flashcards
            </p>

            <div className="flex gap-8 justify-center mb-8">
              <div className="text-center">
                <div className="text-3xl font-black text-blue-600">
                  {newKnown}/{newCards.length}
                </div>
                <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  New Words
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-purple-600">
                  {reviewKnown}/{reviewCards.length}
                </div>
                <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  Review Words
                </div>
              </div>
            </div>
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
  // FLASHCARD VIEW
  // ============================================================================
  return (
    <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-6 pb-4 shrink-0">
        <div className="flex items-end justify-between mb-3 border-b-4 border-black pb-3">
          <h1 className="text-3xl font-black tracking-tighter leading-none">
            VOCAB<span className="text-purple-500">.</span>
          </h1>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
              Progress
            </span>
            <div className="text-2xl font-black font-mono tracking-tight">
              <span className="text-bauhaus-green">
                {knownCount.toString().padStart(2, "0")}
              </span>
              <span className="text-zinc-300 mx-1">/</span>
              <span>{totalCards.toString().padStart(2, "0")}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-200 relative">
          <div
            className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Category badge */}
        {currentCard && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                currentCard.category === "new"
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-purple-100 text-purple-700 border border-purple-300"
              }`}
            >
              {currentCard.category === "new" ? "New Word" : "Review"}
            </span>
            <span className="text-sm text-zinc-400">
              Card {currentIndex + 1} of {remaining.length}
            </span>
          </div>
        )}
      </header>

      {/* Card */}
      <main className="flex-1 px-8 flex flex-col min-h-0 py-4">
        {currentCard && (
          <div className="flex flex-col h-full">
            {/* Card body */}
            <div
              onClick={!isRevealed ? handleReveal : undefined}
              className={`flex-1 flex flex-col bg-white border-2 border-black bauhaus-shadow ${
                !isRevealed ? "cursor-pointer hover:bg-zinc-50" : ""
              }`}
            >
              {/* Front (target language) */}
              <div className="flex-1 p-8 text-center flex flex-col justify-center">
                <p className="text-4xl font-black tracking-tight">
                  {currentCard.card.term}
                </p>
                {currentCard.card.example && (
                  <p className="text-lg text-zinc-500 italic mt-4">
                    "{currentCard.card.example}"
                  </p>
                )}
              </div>

              {/* Back (native language) */}
              <div
                className={`flex-1 flex flex-col border-t-2 ${
                  isRevealed
                    ? "border-purple-300 bg-purple-50"
                    : "border-dashed border-zinc-200 bg-zinc-50"
                }`}
              >
                {isRevealed ? (
                  <div className="flex-1 p-6 text-center flex flex-col justify-center">
                    <p className="text-2xl font-bold text-purple-900">
                      {currentCard.card.definition}
                    </p>
                    {currentCard.card.exampleTranslation && (
                      <p className="text-lg text-purple-600 italic mt-3">
                        "{currentCard.card.exampleTranslation}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm text-zinc-400">
                      Tap to reveal
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6">
        <div className="flex justify-center gap-4">
          {isRevealed ? (
            <>
              <button
                onClick={handleUnknown}
                className="flex-1 max-w-xs px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-bauhaus-red text-white hover:bg-red-700 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                ✗ Still Learning
              </button>
              <button
                onClick={handleKnown}
                className="flex-1 max-w-xs px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                ✓ I Know This
              </button>
            </>
          ) : (
            <>
              <button className="flex-1 max-w-xs px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black bg-bauhaus-red text-white bauhaus-shadow opacity-40 cursor-default">
                ✗ Still Learning
              </button>
              <button className="flex-1 max-w-xs px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black bg-bauhaus-green text-white bauhaus-shadow opacity-40 cursor-default">
                ✓ I Know This
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

