import { useState, useMemo } from "react";
import type { TGOutput, TMOutput, TranslationUnit } from "@shared";
import ProgressBar from "../../components/ui/ProgressBar";

interface TranslationProps {
  data: TGOutput;
  plan: TranslationUnit;
  onComplete: () => void;
}

// Hook to call the translation marking API
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referenceText, userTranslation }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark translation");
      }

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

// Parse marked text with <err> tags into renderable segments
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
  if (score >= 8) return "text-bauhaus-green";
  if (score >= 5) return "text-bauhaus-blue";
  return "text-bauhaus-red";
}

function getScoreLabel(score: number): string {
  if (score === 10) return "Perfect!";
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Needs Work";
  return "Keep Practicing";
}

export default function Translation({ data, plan: _plan, onComplete }: TranslationProps) {
  const [userTranslation, setUserTranslation] = useState("");
  const [markingResult, setMarkingResult] = useState<TMOutput | null>(null);
  const [showIdealAnswer, setShowIdealAnswer] = useState(false);

  const { markTranslation, isLoading, error } = useTranslationMarking();

  const parsedMarkedText = useMemo(() => {
    if (!markingResult) return [];
    return parseMarkedText(markingResult.markedText);
  }, [markingResult]);

  const hasErrors = parsedMarkedText.some((seg) => seg.type === "error");

  const handleSubmit = async () => {
    if (!userTranslation.trim()) return;

    const result = await markTranslation(data.translation, userTranslation);
    if (result) {
      setMarkingResult(result);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  const handleTryAgain = () => {
    setMarkingResult(null);
    setUserTranslation("");
    setShowIdealAnswer(false);
  };

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-blue-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              TRANSLATE<span className="text-bauhaus-blue">.</span>
            </h1>
          </div>

          {markingResult && (
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
                Score
              </span>
              <div
                className={`text-3xl font-black font-mono ${getScoreColor(markingResult.overallScore)}`}
              >
                {markingResult.overallScore}/10
              </div>
              <span
                className={`text-sm font-bold ${getScoreColor(markingResult.overallScore)}`}
              >
                {getScoreLabel(markingResult.overallScore)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-y-auto">
        {/* Source Text */}
        <div className="bg-white border-2 border-black p-6 bauhaus-shadow mb-6">
          <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
            Translate this text
          </div>
          <p className="text-lg leading-relaxed">{data.paragraph}</p>
        </div>

        {/* Translation Input or Result */}
        {!markingResult ? (
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-2 border-black p-6 bauhaus-shadow flex-1 flex flex-col">
              <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
                Your translation
              </div>
              <textarea
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                placeholder="Type your translation here..."
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
          <div className="flex-1 flex flex-col gap-6">
            {/* Marked Result */}
            <div className="bg-white border-2 border-black p-6 bauhaus-shadow">
              <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
                Your translation {hasErrors ? "(with corrections)" : ""}
              </div>
              <div className="text-lg leading-relaxed">
                {parsedMarkedText.map((segment, index) => {
                  if (segment.type === "text") {
                    return <span key={index}>{segment.content}</span>;
                  }
                  return (
                    <span
                      key={index}
                      className="relative group inline-block"
                    >
                      <span className="bg-rose-100 border-b-2 border-bauhaus-red text-bauhaus-red px-1 cursor-help">
                        {segment.content}
                      </span>
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <span className="font-bold text-bauhaus-green">
                          {segment.fix}
                        </span>
                        <span className="block text-xs text-zinc-300 mt-1">
                          {segment.why}
                        </span>
                        {/* Arrow */}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                      </span>
                    </span>
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
            </div>

            {/* Ideal Answer Toggle */}
            <div className="bg-white border-2 border-black bauhaus-shadow">
              <button
                onClick={() => setShowIdealAnswer(!showIdealAnswer)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors"
              >
                <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  {showIdealAnswer ? "Hide" : "Show"} Ideal Answer
                </span>
                <span className="text-zinc-400">{showIdealAnswer ? "▲" : "▼"}</span>
              </button>
              {showIdealAnswer && (
                <div className="p-6 pt-0 border-t border-zinc-200">
                  <p className="text-lg leading-relaxed text-bauhaus-green">
                    {data.translation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-between">
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

          {!markingResult ? (
            <button
              onClick={handleSubmit}
              disabled={!userTranslation.trim() || isLoading}
              className={`
                px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                ${
                  userTranslation.trim() && !isLoading
                    ? "bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow"
                    : "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                }
              `}
            >
              {isLoading ? "Checking..." : "Check Translation"}
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Continue →
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

