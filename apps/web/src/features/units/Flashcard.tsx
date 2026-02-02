import { useState, useMemo, useCallback } from "react";
import type { FCOutput, LessonPlanUnit } from "@shared";
import { RedoButton } from "../../components/ui/RedoButton";

interface FlashcardProps {
  data: FCOutput;
  plan: LessonPlanUnit;
  onComplete: () => void;
}

interface CardState {
  index: number;
  direction: "term-first" | "definition-first"; // term-first = show target lang, definition-first = show native lang
  status: "pending" | "known" | "unknown";
}

// Shuffle array in place (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Create shuffled cards where term-first always comes before definition-first for same card
function createShuffledCards(cardCount: number): CardState[] {
  // Create and shuffle term-first cards
  const termFirstCards: CardState[] = shuffleArray(
    Array.from({ length: cardCount }, (_, index) => ({
      index,
      direction: "term-first" as const,
      status: "pending" as const,
    }))
  );

  // Start with shuffled term-first cards
  const result = [...termFirstCards];

  // For each original card, insert its definition-first at a random valid position
  // (must be after its term-first counterpart)
  for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
    const termFirstPos = result.findIndex(
      (c) => c.index === cardIndex && c.direction === "term-first"
    );

    // Random position from (termFirstPos + 1) to end of array
    const minPos = termFirstPos + 1;
    const maxPos = result.length;
    const insertPos = minPos + Math.floor(Math.random() * (maxPos - minPos + 1));

    result.splice(insertPos, 0, {
      index: cardIndex,
      direction: "definition-first" as const,
      status: "pending" as const,
    });
  }

  return result;
}

export default function Flashcard({
  data,
  plan,
  onComplete,
}: FlashcardProps) {
  // Create shuffled cards - each card appears twice (once per direction)
  // Constraint: term-first always comes before definition-first for same card
  const [cardStates, setCardStates] = useState<CardState[]>(() =>
    createShuffledCards(data.cards.length)
  );
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Get cards that still need review (pending or unknown)
  const cardsToReview = useMemo(
    () =>
      cardStates.filter(
        (state) => state.status === "pending" || state.status === "unknown"
      ),
    [cardStates]
  );

  const currentCardState = cardsToReview[currentPosition];
  const currentCard = currentCardState
    ? data.cards[currentCardState.index]
    : null;
  const currentDirection = currentCardState?.direction;

  // Stats - total is doubled since we show each card in both directions
  const knownCount = cardStates.filter((s) => s.status === "known").length;
  const totalCards = cardStates.length; // This is now 2x original cards
  const progress = Math.round((knownCount / totalCards) * 100);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleKnown = useCallback(() => {
    if (!currentCardState) return;

    setCardStates((prev) => {
      const newStates = prev.map((state) =>
        state.index === currentCardState.index &&
        state.direction === currentCardState.direction
          ? { ...state, status: "known" as const }
          : state
      );

      const remainingToReview = newStates.filter(
        (s) => s.status === "pending" || s.status === "unknown"
      );

      if (remainingToReview.length === 0) {
        setTimeout(() => setShowResults(true), 0);
      } else {
        setTimeout(() => {
          setCurrentPosition((pos) =>
            pos >= remainingToReview.length ? 0 : pos
          );
          setIsRevealed(false);
        }, 0);
      }

      return newStates;
    });
  }, [currentCardState]);

  const handleUnknown = useCallback(() => {
    if (!currentCardState) return;

    setCardStates((prev) => {
      const newStates = prev.map((state) =>
        state.index === currentCardState.index &&
        state.direction === currentCardState.direction
          ? { ...state, status: "unknown" as const }
          : state
      );

      const remainingToReview = newStates.filter(
        (s) => s.status === "pending" || s.status === "unknown"
      );

      setTimeout(() => {
        setCurrentPosition((pos) => {
          const nextPos = pos + 1;
          return nextPos >= remainingToReview.length ? 0 : nextPos;
        });
        setIsRevealed(false);
      }, 0);

      return newStates;
    });
  }, [currentCardState]);

  const handleReset = useCallback(() => {
    setCardStates(createShuffledCards(data.cards.length));
    setCurrentPosition(0);
    setIsRevealed(false);
    setShowResults(false);
  }, [data.cards.length]);

  // Results screen
  if (showResults) {
    return (
      <div className="h-full bg-bauhaus-white text-black font-sans flex flex-col selection:bg-purple-200 overflow-hidden">
        <header className="px-8 pt-8 pb-4 w-full shrink-0">
          <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              CARDS<span className="text-purple-500">.</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500" />
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {data.theme}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-8 flex flex-col items-center justify-center min-h-0 py-4">
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

            <h2 className="text-3xl font-black mb-2">ALL CARDS LEARNED!</h2>
            <p className="text-zinc-500 mb-8">
              You've memorized all {totalCards} flashcards
            </p>

            <div className="flex gap-6 justify-center mb-8">
              <div className="text-center">
                <div className="text-4xl font-black text-bauhaus-green">
                  {totalCards}
                </div>
                <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  Cards Learned
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
          <div className="w-full flex justify-between gap-4">
            <RedoButton unitPlan={plan} onRedo={handleReset} />
            <button
              onClick={onComplete}
              className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Continue →
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-full bg-bauhaus-white text-black font-sans flex flex-col selection:bg-purple-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <h1 className="text-4xl font-black tracking-tighter leading-none">
            CARDS<span className="text-purple-500">.</span>
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
              <span className="text-black">
                {totalCards.toString().padStart(2, "0")}
              </span>
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

        {/* Theme badge */}
        <div className="mt-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500" />
          <span className="text-sm font-bold tracking-wider text-zinc-500">
            {data.theme}
          </span>
        </div>
      </header>

      {/* Card Area */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4">
        {currentCard && (
          <div className="flex flex-col h-full">
            {/* Card counter */}
            <div className="text-center py-2 shrink-0">
              <span className="text-sm font-bold text-zinc-400">
                Card {currentPosition + 1} of {cardsToReview.length}
                {cardsToReview.some((c) => c.status === "unknown") && (
                  <span className="ml-2 text-purple-500">(reviewing)</span>
                )}
              </span>
            </div>

            {/* Single Card - click anywhere to reveal, fills available space */}
            <div
              onClick={!isRevealed ? handleReveal : undefined}
              className={`flex-1 flex flex-col bg-white border-2 border-black bauhaus-shadow ${
                !isRevealed ? "cursor-pointer hover:bg-zinc-50" : ""
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b-2 border-zinc-100 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold tracking-widest text-purple-500 uppercase">
                  {currentDirection === "term-first" ? "Spanish" : "English"}
                </span>
                <span className="text-xs text-zinc-400">
                  {currentDirection === "term-first"
                    ? "What does this mean?"
                    : "How do you say this?"}
                </span>
              </div>

              {/* Question - takes up half the remaining space */}
              <div className="flex-1 p-8 text-center flex flex-col justify-center">
                <p className="text-4xl font-black tracking-tight">
                  {currentDirection === "term-first"
                    ? currentCard.term
                    : currentCard.definition}
                </p>
                {currentDirection === "term-first" && currentCard.example && (
                  <p className="text-lg text-zinc-500 italic mt-4">
                    "{currentCard.example}"
                  </p>
                )}
              </div>

              {/* Answer section - takes up half the remaining space */}
              <div className={`flex-1 flex flex-col border-t-2 ${isRevealed ? "border-purple-300 bg-purple-50" : "border-dashed border-zinc-200 bg-zinc-50"}`}>
                {isRevealed ? (
                  <>
                    <div className="p-4 border-b border-purple-200 shrink-0">
                      <span className="text-xs font-bold tracking-widest text-purple-600 uppercase">
                        {currentDirection === "term-first" ? "English" : "Spanish"}
                      </span>
                    </div>
                    <div className="flex-1 p-6 text-center flex flex-col justify-center">
                      <p className="text-2xl font-bold text-purple-900">
                        {currentDirection === "term-first"
                          ? currentCard.definition
                          : currentCard.term}
                      </p>
                      {currentDirection === "term-first" &&
                        currentCard.exampleTranslation && (
                          <p className="text-lg text-purple-600 italic mt-3">
                            "{currentCard.exampleTranslation}"
                          </p>
                        )}
                      {currentDirection === "definition-first" &&
                        currentCard.example && (
                          <p className="text-lg text-purple-600 italic mt-3">
                            "{currentCard.example}"
                          </p>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm text-zinc-400">
                      Tap anywhere to reveal
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Actions - Always show both buttons when revealed */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full">
          {isRevealed ? (
            <div className="flex justify-center gap-4">
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
            </div>
          ) : (
            <div className="flex justify-center gap-4 opacity-40 pointer-events-none">
              <button
                className="flex-1 max-w-xs px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-bauhaus-red text-white bauhaus-shadow"
              >
                ✗ Still Learning
              </button>
              <button
                className="flex-1 max-w-xs px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-bauhaus-green text-white bauhaus-shadow"
              >
                ✓ I Know This
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
