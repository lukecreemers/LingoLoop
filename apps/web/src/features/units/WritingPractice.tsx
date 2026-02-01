import { useState, useMemo, useRef } from "react";
import type { WPOutput, WritingPracticeUnit, WPMarkingOutput } from "@shared";
import { RedoButton } from "../../components/ui/RedoButton";
import { SelectableText } from "../../components/ui/SelectableText";
import { DEMO_KNOWN_VOCAB } from "../../constants/vocab";

// Error word with fixed tooltip
function ErrorWord({
  content,
  fix,
  why,
}: {
  content: string;
  fix: string;
  why: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
    setIsHovered(true);
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-rose-100 border-b-2 border-bauhaus-red text-bauhaus-red px-1 cursor-help"
      >
        {content}
      </span>
      {isHovered && (
        <div
          className="fixed z-[9999] px-3 py-2 bg-black text-white text-sm whitespace-nowrap pointer-events-none"
          style={{
            left: position.x,
            top: position.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-bold text-bauhaus-green">{fix}</span>
          <span className="block text-xs text-zinc-300 mt-1">{why}</span>
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
        </div>
      )}
    </>
  );
}

interface WritingPracticeProps {
  data: WPOutput;
  plan: WritingPracticeUnit;
  onComplete: () => void;
}

// Hook to call the writing practice marking API
function useWritingMarking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markWriting = async (
    prompt: string,
    userResponse: string
  ): Promise<WPMarkingOutput | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-assist/mark-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          userResponse,
          targetLanguage: "Spanish",
          nativeLanguage: "English",
          userLevel: "intermediate",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark writing");
      }

      const result = await response.json();
      return result.data as WPMarkingOutput;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { markWriting, isLoading, error };
}

// Parse marked text with <err> tags into renderable segments (same as Translation.tsx)
interface TextSegment {
  type: "text" | "error";
  content: string;
  fix?: string;
  why?: string;
}

function parseMarkedText(markedText: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /<err\s+fix="([^"]*)"\s+why="([^"]*)">([^<]*)<\/err>/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(markedText)) !== null) {
    // Add text before the error
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: markedText.slice(lastIndex, match.index),
      });
    }

    // Add the error segment
    segments.push({
      type: "error",
      content: match[3], // User's wrong word
      fix: match[1], // Correct version
      why: match[2], // Reason
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last error
  if (lastIndex < markedText.length) {
    segments.push({
      type: "text",
      content: markedText.slice(lastIndex),
    });
  }

  return segments;
}

// Get score color based on value
function getScoreColor(score: number): string {
  if (score >= 80) return "text-bauhaus-green";
  if (score >= 60) return "text-bauhaus-yellow";
  return "text-bauhaus-red";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent!";
  if (score >= 80) return "Great Work";
  if (score >= 70) return "Good";
  if (score >= 60) return "Keep Going";
  return "Keep Practicing";
}

export default function WritingPractice({
  data,
  plan,
  onComplete,
}: WritingPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [markingResult, setMarkingResult] = useState<WPMarkingOutput | null>(
    null
  );
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [completedPrompts, setCompletedPrompts] = useState<Set<number>>(
    new Set()
  );

  const { markWriting, isLoading, error } = useWritingMarking();

  const currentPrompt = data.prompts[currentIndex];
  const allCompleted = completedPrompts.size === data.prompts.length;

  // Parse the marked text with inline <err> tags
  const parsedMarkedText = useMemo(() => {
    if (!markingResult?.markedText) return [];
    return parseMarkedText(markingResult.markedText);
  }, [markingResult]);

  const hasErrors = parsedMarkedText.some((seg) => seg.type === "error");

  const handleSubmit = async () => {
    if (!userResponse.trim()) return;

    const result = await markWriting(currentPrompt.prompt, userResponse);
    if (result) {
      setMarkingResult(result);
      setCompletedPrompts((prev) => new Set([...prev, currentIndex]));
    }
  };

  const handleNext = () => {
    if (currentIndex < data.prompts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserResponse("");
      setMarkingResult(null);
      setShowModelAnswer(false);
    }
  };

  const handleTryAgain = () => {
    setMarkingResult(null);
    setUserResponse("");
    setShowModelAnswer(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setUserResponse("");
    setMarkingResult(null);
    setShowModelAnswer(false);
    setCompletedPrompts(new Set());
  };

  return (
    <div className="h-full bg-bauhaus-white text-black font-sans flex flex-col selection:bg-orange-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              WRITE<span className="text-orange-500">.</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{data.topic}</p>
          </div>

          {markingResult && (
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
                Score
              </span>
              <div
                className={`text-3xl font-black font-mono ${getScoreColor(
                  markingResult.overallScore
                )}`}
              >
                {markingResult.overallScore}%
              </div>
              <span
                className={`text-sm font-bold ${getScoreColor(
                  markingResult.overallScore
                )}`}
              >
                {getScoreLabel(markingResult.overallScore)}
              </span>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {data.prompts.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (completedPrompts.has(currentIndex) || markingResult) {
                  setCurrentIndex(i);
                  setUserResponse("");
                  setMarkingResult(null);
                  setShowModelAnswer(false);
                }
              }}
              className={`h-2 flex-1 transition-colors ${
                i === currentIndex
                  ? "bg-orange-500"
                  : completedPrompts.has(i)
                  ? "bg-bauhaus-green"
                  : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-y-auto text-start">
        {/* Prompt Card */}
        <div className="bg-white border-2 border-black p-6 bauhaus-shadow mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">
              Writing Prompt
            </span>
            <span className="text-xs px-2 py-1 bg-zinc-100 rounded">
              {currentPrompt.expectedLength}
            </span>
          </div>
          <SelectableText
            text={currentPrompt.prompt}
            knownVocab={DEMO_KNOWN_VOCAB}
            sourceLanguage="Spanish"
            targetLanguage="English"
            className="text-xl font-bold mb-3"
          />
          <p className="text-zinc-500 italic">
            {currentPrompt.promptTranslation}
          </p>
          {currentPrompt.hints && currentPrompt.hints.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Hints
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {currentPrompt.hints.map((hint, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-orange-50 text-orange-700 text-sm rounded"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response Input or Result */}
        {!markingResult ? (
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-2 border-black p-6 bauhaus-shadow flex-1 flex flex-col">
              <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
                Your response (in Spanish)
              </div>
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Write your response here..."
                className="flex-1 w-full resize-none text-lg leading-relaxed focus:outline-none placeholder:text-zinc-300"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-rose-50 border-2 border-bauhaus-red text-bauhaus-red">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
            {/* Marked Result - inline errors like Translation.tsx */}
            <div className="bg-white border-2 border-black p-6 bauhaus-shadow">
              <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
                Your response {hasErrors ? "(with corrections)" : ""}
              </div>
              <div className="text-lg leading-relaxed text-start">
                {parsedMarkedText.map((segment, index) => {
                  if (segment.type === "text") {
                    return <span key={index}>{segment.content}</span>;
                  }
                  return (
                    <ErrorWord
                      key={index}
                      content={segment.content}
                      fix={segment.fix || ""}
                      why={segment.why || ""}
                    />
                  );
                })}
              </div>

              {/* Error Legend */}
              {hasErrors && (
                <div className="mt-4 pt-4 border-t border-zinc-200 text-sm text-zinc-500">
                  <span className="bg-rose-100 border-b-2 border-bauhaus-red text-bauhaus-red px-1">
                    Highlighted text
                  </span>{" "}
                  = errors. Hover for corrections.
                </div>
              )}

              {/* Model Answer Toggle - inside response card for easy comparison */}
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <button
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="w-full text-left flex items-center justify-between hover:bg-zinc-50 transition-colors py-2 -mx-2 px-2 rounded"
                >
                  <span className="text-xs font-bold tracking-widest text-bauhaus-green uppercase">
                    {showModelAnswer ? "Hide" : "Show"} Model Answer
                  </span>
                  <span className="text-bauhaus-green">
                    {showModelAnswer ? "▲" : "▼"}
                  </span>
                </button>
                {showModelAnswer && (
                  <div className="mt-3">
                    <SelectableText
                      text={markingResult.modelAnswer}
                      knownVocab={DEMO_KNOWN_VOCAB}
                      sourceLanguage="Spanish"
                      targetLanguage="English"
                      className="text-lg leading-relaxed"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white border-2 border-black p-6 bauhaus-shadow">
              <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
                Feedback
              </div>
              <p className="text-zinc-700">{markingResult.feedback}</p>

              {/* Strengths */}
              {markingResult.strengths &&
                markingResult.strengths.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <span className="text-xs font-bold tracking-widest text-bauhaus-green uppercase">
                      What you did well
                    </span>
                    <ul className="mt-2 space-y-1">
                      {markingResult.strengths.map((strength, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-bauhaus-green">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-between items-center">
          {markingResult && (
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

          <div className="flex gap-4">
            {allCompleted && (
              <RedoButton
                unitPlan={plan}
                onRedo={handleReset}
              />
            )}

            {!markingResult ? (
              <button
                onClick={handleSubmit}
                disabled={!userResponse.trim() || isLoading}
                className={`
                  px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                  ${
                    userResponse.trim() && !isLoading
                      ? "bg-orange-500 text-white hover:bg-orange-600 bauhaus-shadow"
                      : "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                  }
                `}
              >
                {isLoading ? "Marking..." : "Submit"}
              </button>
            ) : currentIndex < data.prompts.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-orange-500 text-white hover:bg-orange-600 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Next Prompt →
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
