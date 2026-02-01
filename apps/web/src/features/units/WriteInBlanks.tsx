import { useState, useCallback, useEffect } from "react";
import type { WIBOutput, WriteInBlanksUnit } from "@shared";
import SentenceWithInputs from "../../components/ui/SentenceWithInputs";
import ProgressBar from "../../components/ui/ProgressBar";
import { ExplainWrongButton } from "../../components/ui/ExplainWrong";
import { RedoButton } from "../../components/ui/RedoButton";

type SlotStatus = "empty" | "filled" | "correct" | "incorrect";

interface WriteInBlanksProps {
  data: WIBOutput;
  plan: WriteInBlanksUnit;
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

  const currentExercise = data.exercises[currentIndex];
  const blankCount = currentExercise.blanks.length;

  // Reset state when exercise changes
  useEffect(() => {
    setFilledAnswers(new Array(blankCount).fill(""));
    setSlotStatuses(new Array(blankCount).fill("empty"));
    setIsChecked(false);
  }, [currentIndex, blankCount]);

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

      // Check if answer matches correct answer or any accepted alternates
      if (
        trimmedAnswer === correctAnswer ||
        alternates.includes(trimmedAnswer)
      ) {
        return "correct";
      }
      return "incorrect";
    });

    setSlotStatuses(newStatuses);
    setIsChecked(true);

    const correctCount = newStatuses.filter((s) => s === "correct").length;
    setScore((prev) => ({
      correct: prev.correct + correctCount,
      total: prev.total + blankCount,
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
  const allCorrect = slotStatuses.every((s) => s === "correct");

  // Get the correct answers for feedback
  const correctAnswers = currentExercise.blanks.map((b) => b.correctAnswer);

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-rose-200 overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="px-8 pt-8 pb-4 max-w-5xl mx-auto w-full shrink-0">
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

        <ProgressBar
          current={currentIndex + 1}
          total={data.exercises.length}
        />
      </header>

      {/* Main Content - Flex Grow to fill space */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-8 flex flex-col min-h-0 py-4">
        {/* Sentence Container - Flex Grow with max height constraint */}
        <div className="flex-1 bg-white border-2 border-black p-8 bauhaus-shadow flex flex-col relative min-h-0 mb-6">
          {/* Scrollable Sentence Area if text is very long */}
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
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
                {allCorrect ? (
                  <p className="text-bauhaus-green font-black text-2xl tracking-tight">
                    PERFECT!
                  </p>
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
                        unitType: "write in the blanks",
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
        <div className="max-w-5xl mx-auto flex justify-end gap-4">
          {isChecked && isLastExercise && (
            <RedoButton
              unitPlan={plan}
              onRedo={() => {
                setCurrentIndex(0);
                setScore({ correct: 0, total: 0 });
              }}
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
