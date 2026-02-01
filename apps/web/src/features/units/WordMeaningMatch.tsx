import { useState, useMemo } from "react";
import type { WMMOutput } from "@shared";
import ProgressBar from "../../components/ui/ProgressBar";

type MatchStatus = "unmatched" | "matched" | "correct" | "incorrect";

interface Match {
  aIndex: number;
  bIndex: number;
}

interface WordMeaningMatchProps {
  data: WMMOutput;
  onComplete: () => void;
}

export default function WordMeaningMatch({
  data,
  onComplete,
}: WordMeaningMatchProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [matchStatuses, setMatchStatuses] = useState<Map<number, MatchStatus>>(
    new Map()
  );

  const [score, setScore] = useState({ correct: 0, total: 0 });

  const currentExercise = data.exercises[currentIndex];
  const pairCount = currentExercise.pairs.length;

  // Column A items (left side) - from pairs
  const columnA = useMemo(() => {
    return currentExercise.pairs.map((pair, index) => ({
      text: pair[0],
      originalIndex: index,
    }));
  }, [currentExercise]);

  // Column B items (right side) - from pairs + distractors, shuffled
  const columnB = useMemo(() => {
    const correctItems = currentExercise.pairs.map((pair, index) => ({
      text: pair[1],
      correctPairIndex: index,
      isDistractor: false,
    }));
    const distractorItems = currentExercise.distractors.map((text) => ({
      text,
      correctPairIndex: -1,
      isDistractor: true,
    }));
    return [...correctItems, ...distractorItems].sort(
      () => Math.random() - 0.5
    );
  }, [currentExercise]);

  // Reset state when exercise changes
  useMemo(() => {
    setSelectedA(null);
    setMatches([]);
    setIsChecked(false);
    setMatchStatuses(new Map());
  }, [currentIndex]);

  // Check if an A item is already matched
  const getMatchedBForA = (aIndex: number): number | null => {
    const match = matches.find((m) => m.aIndex === aIndex);
    return match ? match.bIndex : null;
  };

  // Check if a B item is already matched
  const getMatchedAForB = (bIndex: number): number | null => {
    const match = matches.find((m) => m.bIndex === bIndex);
    return match ? match.aIndex : null;
  };

  const handleSelectA = (aIndex: number) => {
    if (isChecked) return;

    // If already matched, unselect/remove match
    const existingMatch = matches.find((m) => m.aIndex === aIndex);
    if (existingMatch) {
      setMatches((prev) => prev.filter((m) => m.aIndex !== aIndex));
      setSelectedA(null);
      return;
    }

    setSelectedA(aIndex);
  };

  const handleSelectB = (bIndex: number) => {
    if (isChecked) return;
    if (selectedA === null) return;

    // If B is already matched to something else, remove that match first
    const existingBMatch = matches.find((m) => m.bIndex === bIndex);
    if (existingBMatch) {
      setMatches((prev) => prev.filter((m) => m.bIndex !== bIndex));
    }

    // Create new match
    setMatches((prev) => {
      // Remove any existing match for selectedA
      const filtered = prev.filter((m) => m.aIndex !== selectedA);
      return [...filtered, { aIndex: selectedA, bIndex }];
    });
    setSelectedA(null);
  };

  const allMatched = matches.length === pairCount;

  const handleCheck = () => {
    const newStatuses = new Map<number, MatchStatus>();
    let correctCount = 0;

    matches.forEach((match) => {
      const bItem = columnB[match.bIndex];
      const isCorrect = bItem.correctPairIndex === match.aIndex;

      newStatuses.set(match.aIndex, isCorrect ? "correct" : "incorrect");

      if (isCorrect) correctCount++;
    });

    setMatchStatuses(newStatuses);
    setIsChecked(true);

    setScore((prev) => ({
      correct: prev.correct + correctCount,
      total: prev.total + pairCount,
    }));
  };

  const handleNext = () => {
    if (currentIndex < data.exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const isLastExercise = currentIndex === data.exercises.length - 1;
  const allCorrect =
    isChecked && [...matchStatuses.values()].every((s) => s === "correct");

  // Get match number for display
  const getMatchNumber = (aIndex: number): number | null => {
    const matchIndex = matches.findIndex((m) => m.aIndex === aIndex);
    return matchIndex >= 0 ? matchIndex + 1 : null;
  };

  const getMatchNumberForB = (bIndex: number): number | null => {
    const match = matches.find((m) => m.bIndex === bIndex);
    if (!match) return null;
    const matchIndex = matches.findIndex((m) => m.aIndex === match.aIndex);
    return matchIndex >= 0 ? matchIndex + 1 : null;
  };

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-rose-200 overflow-x-hidden overflow-y-auto">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 max-w-5xl mx-auto w-full shrink-0">
        <div className="flex items-end justify-between mb-6 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              MATCH<span className="text-bauhaus-green">.</span>
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
              Total Score
            </span>
            <div className="text-2xl font-black font-mono tracking-tight">
              <span className="text-bauhaus-green">
                {score.correct.toString().padStart(2, "0")}
              </span>
              <span className="text-zinc-300 mx-1">/</span>
              <span className="text-black">
                {score.total.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        <ProgressBar
          current={currentIndex + 1}
          total={data.exercises.length}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-8 flex flex-col py-4">
        {/* Instruction */}
        <p className="text-center text-zinc-500 mb-4 shrink-0">
          {currentExercise.instruction}
        </p>

        {/* Matching Area */}
        <div className="bg-white border-2 border-black p-6 bauhaus-shadow flex flex-col mb-6">
          {/* Column Labels */}
          <div className="flex justify-between mb-4 shrink-0">
            <div className="w-[45%] text-center">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {currentExercise.columnLabels.a}
              </span>
            </div>
            <div className="w-[45%] text-center">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {currentExercise.columnLabels.b}
              </span>
            </div>
          </div>

          {/* Columns */}
          <div className="flex justify-between gap-4">
            {/* Column A */}
            <div className="w-[45%] flex flex-col gap-3">
              {columnA.map((item, index) => {
                const matchedB = getMatchedBForA(index);
                const isSelected = selectedA === index;
                const status = matchStatuses.get(index) || "unmatched";
                const matchNum = getMatchNumber(index);

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectA(index)}
                    disabled={isChecked}
                    className={`
                      relative p-4 text-left font-medium border-2 transition-all duration-200
                      ${
                        status === "correct"
                          ? "border-bauhaus-green bg-emerald-50 text-bauhaus-green"
                          : status === "incorrect"
                          ? "border-bauhaus-red bg-rose-50 text-bauhaus-red"
                          : isSelected
                          ? "border-bauhaus-blue bg-blue-50 text-bauhaus-blue"
                          : matchedB !== null
                          ? "border-zinc-400 bg-zinc-100 text-black"
                          : "border-zinc-300 bg-white text-black hover:border-zinc-400"
                      }
                      ${isChecked ? "cursor-default" : "cursor-pointer"}
                    `}
                  >
                    {matchNum && (
                      <span
                        className={`absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center text-xs font-bold text-white ${
                          status === "correct"
                            ? "bg-bauhaus-green"
                            : status === "incorrect"
                            ? "bg-bauhaus-red"
                            : "bg-zinc-500"
                        }`}
                      >
                        {matchNum}
                      </span>
                    )}
                    {item.text}
                  </button>
                );
              })}
            </div>

            {/* Column B */}
            <div className="w-[45%] flex flex-col gap-3">
              {columnB.map((item, index) => {
                const matchedA = getMatchedAForB(index);
                const matchNum = getMatchNumberForB(index);
                const aStatus =
                  matchedA !== null ? matchStatuses.get(matchedA) : null;

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectB(index)}
                    disabled={isChecked || selectedA === null}
                    className={`
                      relative p-4 text-left font-medium border-2 transition-all duration-200
                      ${
                        aStatus === "correct"
                          ? "border-bauhaus-green bg-emerald-50 text-bauhaus-green"
                          : aStatus === "incorrect"
                          ? "border-bauhaus-red bg-rose-50 text-bauhaus-red"
                          : matchedA !== null
                          ? "border-zinc-400 bg-zinc-100 text-black"
                          : selectedA !== null
                          ? "border-zinc-300 bg-white text-black hover:border-bauhaus-blue hover:bg-blue-50 cursor-pointer"
                          : "border-zinc-300 bg-white text-black opacity-60"
                      }
                      ${
                        isChecked
                          ? "cursor-default"
                          : selectedA === null
                          ? "cursor-default"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    {matchNum && (
                      <span
                        className={`absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-xs font-bold text-white ${
                          aStatus === "correct"
                            ? "bg-bauhaus-green"
                            : aStatus === "incorrect"
                            ? "bg-bauhaus-red"
                            : "bg-zinc-500"
                        }`}
                      >
                        {matchNum}
                      </span>
                    )}
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Area */}
          <div className="min-h-16 shrink-0 flex items-center justify-center border-t-2 border-zinc-100 mt-4 py-3">
            {isChecked ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 text-center w-full px-4">
                {allCorrect ? (
                  <p className="text-bauhaus-green font-black text-2xl tracking-tight">
                    PERFECT MATCHES!
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-bauhaus-red font-bold">
                      {
                        [...matchStatuses.values()].filter(
                          (s) => s === "correct"
                        ).length
                      }{" "}
                      / {pairCount} correct
                    </p>
                    <div className="text-sm text-zinc-600">
                      <span className="font-semibold">Correct answers: </span>
                      {matches
                        .filter(
                          (match) =>
                            matchStatuses.get(match.aIndex) === "incorrect"
                        )
                        .map((match) => {
                          const aText = columnA[match.aIndex].text;
                          const correctBItem = columnB.find(
                            (b) => b.correctPairIndex === match.aIndex
                          );
                          return `${aText} → ${correctBItem?.text || "?"}`;
                        })
                        .join(" • ")}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-300 font-medium italic">
                {selectedA !== null
                  ? "Now select a match from the right column"
                  : "Select an item from the left column"}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button
            onClick={isChecked ? handleNext : handleCheck}
            disabled={!isChecked && !allMatched}
            className={`
              px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              ${
                isChecked
                  ? allCorrect
                    ? "bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow"
                    : "bg-black text-white hover:bg-zinc-800 bauhaus-shadow"
                  : allMatched
                  ? "bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow"
                  : "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
              }
            `}
          >
            {isChecked
              ? isLastExercise
                ? "Finish Lesson"
                : "Continue →"
              : "Check Answer"}
          </button>
        </div>
      </footer>
    </div>
  );
}
