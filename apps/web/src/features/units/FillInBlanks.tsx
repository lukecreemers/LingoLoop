import { useState, useMemo, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { FIBOutput, FillInBlanksUnit } from "@shared";
import WordChip from "../../components/ui/WordChip";
import SentenceWithBlanks from "../../components/ui/SentenceWithBlanks";
import { ExplainWrongButton } from "../../components/ui/ExplainWrong";
import { RedoButton } from "../../components/ui/RedoButton";

type SlotStatus = "empty" | "filled" | "correct" | "incorrect";

interface FillInBlanksProps {
  data: FIBOutput;
  plan: FillInBlanksUnit;
  onComplete: () => void;
}

export default function FillInBlanks({
  data,
  plan,
  onComplete,
}: FillInBlanksProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filledAnswers, setFilledAnswers] = useState<(string | null)[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [slotStatuses, setSlotStatuses] = useState<SlotStatus[]>([]);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [exerciseResults, setExerciseResults] = useState<
    ("pending" | "correct" | "incorrect")[]
  >(new Array(data.exercises.length).fill("pending"));

  const currentExercise = data.exercises[currentIndex];
  const blankCount = (currentExercise.template.match(/\[\*\]/g) || []).length;

  // Reset state when moving to a new exercise
  useEffect(() => {
    setFilledAnswers(new Array(blankCount).fill(null));
    setSlotStatuses(new Array(blankCount).fill("empty"));
    setIsChecked(false);
  }, [currentIndex, blankCount]);

  // Full reset function for redo
  const resetAll = useCallback(() => {
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setExerciseResults(new Array(data.exercises.length).fill("pending"));
  }, [data.exercises.length]);

  // Deduplicate and shuffle word options for current exercise
  const wordOptions = useMemo(() => {
    const allWords = [
      ...currentExercise.answers,
      ...currentExercise.distractors,
    ];
    // Remove duplicates
    const uniqueWords = [...new Set(allWords)];
    // Shuffle
    return uniqueWords.sort(() => Math.random() - 0.5);
  }, [currentExercise]);

  const usedWords = useMemo(() => {
    return new Set(filledAnswers.filter((w): w is string => w !== null));
  }, [filledAnswers]);

  const handleDrop = useCallback((slotIndex: number, word: string) => {
    setFilledAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[slotIndex] = word;
      return newAnswers;
    });
    setSlotStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[slotIndex] = "filled";
      return newStatuses;
    });
  }, []);

  const handleRemove = useCallback((slotIndex: number) => {
    setFilledAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[slotIndex] = null;
      return newAnswers;
    });
    setSlotStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[slotIndex] = "empty";
      return newStatuses;
    });
  }, []);

  const allSlotsFilled = filledAnswers.every((answer) => answer !== null);

  const handleCheck = () => {
    const newStatuses: SlotStatus[] = filledAnswers.map((answer, index) => {
      return answer === currentExercise.answers[index]
        ? "correct"
        : "incorrect";
    });
    setSlotStatuses(newStatuses);
    setIsChecked(true);

    const correctCount = newStatuses.filter((s) => s === "correct").length;
    setScore((prev) => ({
      correct: prev.correct + correctCount,
      total: prev.total + blankCount,
    }));

    // Track exercise-level result
    const allCorrectInExercise = newStatuses.every((s) => s === "correct");
    setExerciseResults((prev) => {
      const newResults = [...prev];
      newResults[currentIndex] = allCorrectInExercise ? "correct" : "incorrect";
      return newResults;
    });
  };

  const handleNext = () => {
    if (currentIndex < data.exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const isLastExercise = currentIndex === data.exercises.length - 1;
  const allCorrect = slotStatuses.every((s) => s === "correct");

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-[calc(100vh-100px)]  bg-bauhaus-white text-black font-sans flex flex-col selection:bg-rose-200">
        {/* Header - Fixed Height */}
        <header className="px-8 pt-8 pb-4 w-full shrink-0">
          <div className="flex items-end justify-between mb-6 border-b-4 border-black pb-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter leading-none">
                FILL IN<span className="text-bauhaus-red">.</span>
              </h1>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
                Total Score
              </span>
              <div className="text-2xl font-black font-mono tracking-tight">
                <span className="text-bauhaus-blue">
                  {score.correct.toString().padStart(2, "0")}
                </span>
                <span className="text-zinc-300 mx-1">/</span>
                <span className="text-black">
                  {score.total.toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {data.exercises.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 transition-colors ${
                  i === currentIndex
                    ? "bg-zinc-700"
                    : exerciseResults[i] === "correct"
                    ? "bg-bauhaus-green"
                    : exerciseResults[i] === "incorrect"
                    ? "bg-bauhaus-red"
                    : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </header>

        {/* Main Content - Flex Grow to fill space */}
        <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4">
          {/* Sentence Container - Flex Grow with max height constraint */}
          <div className="flex-1 bg-white border-2 border-black p-8 bauhaus-shadow flex flex-col relative min-h-0 mb-6">
            {/* Scrollable Sentence Area if text is very long */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              <SentenceWithBlanks
                template={currentExercise.template}
                filledAnswers={filledAnswers}
                slotStatuses={slotStatuses}
                onDrop={handleDrop}
                onRemove={handleRemove}
                disabled={isChecked}
              />
            </div>

            {/* Feedback Area - Absolute Overlay at Bottom of Card or Reserved Space */}
            <div className="min-h-24 shrink-0 flex flex-col items-center justify-center border-t-2 border-zinc-100 mt-4 py-4">
              {isChecked ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 text-center w-full">
                  {allCorrect ? (
                    <p className="text-bauhaus-green font-black text-2xl tracking-tight">
                      PERFECT MATCH
                    </p>
                  ) : (
                    <>
                      <p className="text-bauhaus-red font-bold text-xs tracking-widest uppercase mb-1">
                        Correct Answer
                      </p>
                      <p className="text-xl font-bold text-black truncate px-4 mb-3">
                        {currentExercise.answers.join(", ")}
                      </p>
                      <ExplainWrongButton
                        input={{
                          unitType: "fill in the blanks",
                          context: currentExercise.template,
                          userAnswer: filledAnswers.filter(Boolean).join(", "),
                          correctAnswer: currentExercise.answers.join(", "),
                          targetLanguage: "Spanish", // TODO: Get from lesson context
                        }}
                      />
                    </>
                  )}
                </div>
              ) : (
                <p className="text-zinc-300 font-medium italic">
                  Drag words to complete the sentence
                </p>
              )}
            </div>
          </div>

          {/* Word Bank - Fixed Height Area */}
          <div className="h-32 shrink-0 flex flex-wrap gap-3 justify-center items-start content-start overflow-y-auto p-4 border-2 border-dashed border-zinc-200 bg-zinc-50">
            {wordOptions.map((word, index) => (
              <WordChip
                key={`${word}-${index}`}
                word={word}
                isUsed={usedWords.has(word)}
              />
            ))}
          </div>
        </main>

        {/* Footer Actions - Fixed Height */}
        <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
          <div className="w-full flex justify-end gap-4">
            {isChecked && isLastExercise && (
              <RedoButton
                unitPlan={plan}
                onRedo={resetAll}
              />
            )}
            <button
              onClick={isChecked ? handleNext : handleCheck}
              disabled={!isChecked && !allSlotsFilled}
              className={`
                px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                ${
                  isChecked
                    ? allCorrect
                      ? "bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow"
                      : "bg-black text-white hover:bg-zinc-800 bauhaus-shadow"
                    : allSlotsFilled
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
    </DndProvider>
  );
}
