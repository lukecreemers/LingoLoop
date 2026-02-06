import { useState, useCallback, useEffect } from "react";
import type { WIBOutput, LessonPlanUnit } from "@shared";
import SentenceWithInputs from "../../components/ui/SentenceWithInputs";
import { ExplainWrongButton } from "../../components/ui/ExplainWrong";
import { RedoButton } from "../../components/ui/RedoButton";

type SlotStatus = "empty" | "filled" | "correct" | "almost" | "incorrect";

// Strip diacritical marks (accents) from a string for fuzzy comparison
function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface WriteInBlanksProps {
  data: WIBOutput;
  plan: LessonPlanUnit;
  onComplete: () => void;
}

export default function WriteInBlanks({
  data,
  plan,
  onComplete,
}: WriteInBlanksProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filledAnswers, setFilledAnswers] = useState<string[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [slotStatuses, setSlotStatuses] = useState<SlotStatus[]>([]);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [exerciseResults, setExerciseResults] = useState<
    ("pending" | "correct" | "incorrect")[]
  >(new Array(data.exercises.length).fill("pending"));

  const currentExercise = data.exercises[currentIndex];
  const blankCount = currentExercise.blanks.length;

  // Reset state when exercise changes
  useEffect(() => {
    setFilledAnswers(new Array(blankCount).fill(""));
    setSlotStatuses(new Array(blankCount).fill("empty"));
    setIsChecked(false);
  }, [currentIndex, blankCount]);

  // Full reset function for redo
  const resetAll = useCallback(() => {
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setExerciseResults(new Array(data.exercises.length).fill("pending"));
  }, [data.exercises.length]);

  const handleChange = useCallback((slotIndex: number, value: string) => {
    setFilledAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[slotIndex] = value;
      return newAnswers;
    });
    setSlotStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[slotIndex] = value.trim() ? "filled" : "empty";
      return newStatuses;
    });
  }, []);

  const allSlotsFilled = filledAnswers.every((answer) => answer.trim() !== "");

  const handleCheck = () => {
    const newStatuses: SlotStatus[] = filledAnswers.map((answer, index) => {
      const blank = currentExercise.blanks[index];
      const trimmedAnswer = answer.trim().toLowerCase();
      const correctAnswer = blank.correctAnswer.toLowerCase();
      const alternates = blank.acceptedAlternates.map((a) => a.toLowerCase());

      // Exact match (case-insensitive) — fully correct
      if (
        trimmedAnswer === correctAnswer ||
        alternates.includes(trimmedAnswer)
      ) {
        return "correct";
      }

      // Accent-tolerant match — correct letters but wrong/missing accents
      const strippedAnswer = stripAccents(trimmedAnswer);
      const strippedCorrect = stripAccents(correctAnswer);
      const strippedAlternates = alternates.map(stripAccents);
      if (
        strippedAnswer === strippedCorrect ||
        strippedAlternates.includes(strippedAnswer)
      ) {
        return "almost";
      }

      return "incorrect";
    });

    setSlotStatuses(newStatuses);
    setIsChecked(true);

    const correctCount = newStatuses.filter((s) => s === "correct").length;
    const almostCount = newStatuses.filter((s) => s === "almost").length;
    setScore((prev) => ({
      correct: prev.correct + correctCount,
      total: prev.total + blankCount,
    }));

    // Track exercise-level result
    // "almost" counts as not fully correct but is less harsh
    const allCorrectInExercise = newStatuses.every(
      (s) => s === "correct" || s === "almost"
    );
    const hasIncorrect = newStatuses.some((s) => s === "incorrect");
    setExerciseResults((prev) => {
      const newResults = [...prev];
      newResults[currentIndex] =
        !hasIncorrect && almostCount === 0
          ? "correct"
          : hasIncorrect
          ? "incorrect"
          : "correct"; // all-almost still counts as correct at exercise level
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
  const allCorrect = slotStatuses.every(
    (s) => s === "correct" || s === "almost"
  );
  const hasAlmost = slotStatuses.some((s) => s === "almost");

  // Get the correct answers for feedback
  const correctAnswers = currentExercise.blanks.map((b) => b.correctAnswer);

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-rose-200 overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-6 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              WRITE IN<span className="text-bauhaus-blue">.</span>
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
          <div className="flex-1 flex items-center justify-start overflow-y-auto">
            <SentenceWithInputs
              template={currentExercise.template}
              blanks={currentExercise.blanks}
              filledAnswers={filledAnswers}
              slotStatuses={slotStatuses}
              onChange={handleChange}
              disabled={isChecked}
            />
          </div>

          {/* Feedback Area - Reserved Space */}
          <div className="min-h-24 shrink-0 flex flex-col items-center justify-center border-t-2 border-zinc-100 mt-4 py-3">
            {isChecked ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 text-center w-full">
                {allCorrect && !hasAlmost ? (
                  <p className="text-bauhaus-green font-black text-2xl tracking-tight">
                    PERFECT!
                  </p>
                ) : allCorrect && hasAlmost ? (
                  <div>
                    <p className="text-orange-500 font-black text-2xl tracking-tight mb-1">
                      ALMOST!
                    </p>
                    <p className="text-sm text-zinc-500">
                      Watch your accents — the correct spelling is:
                    </p>
                    <p className="text-lg font-bold text-black mt-1">
                      {correctAnswers.join(", ")}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-bauhaus-red font-bold text-xs tracking-widest uppercase mb-1">
                      Correct Answer
                    </p>
                    <p className="text-xl font-bold text-black truncate px-4 mb-3">
                      {correctAnswers.join(", ")}
                    </p>
                    <ExplainWrongButton
                      input={{
                        unitType: "write_in_blanks",
                        context: currentExercise.template,
                        userAnswer: filledAnswers
                          .filter((_, i) => slotStatuses[i] === "incorrect")
                          .join(", "),
                        correctAnswer: currentExercise.blanks
                          .filter((_, i) => slotStatuses[i] === "incorrect")
                          .map((b) => b.correctAnswer)
                          .join(", "),
                        targetLanguage: "Spanish",
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <p className="text-zinc-300 font-medium italic">
                Type the correct form of each word
              </p>
            )}
          </div>
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
  );
}
