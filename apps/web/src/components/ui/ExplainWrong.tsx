import { useState } from "react";

interface ExplainWrongInput {
  unitType: string;
  context: string;
  userAnswer: string;
  correctAnswer: string;
  targetLanguage: string;
}

interface ExplainWrongOutput {
  explanation: string;
  tip: string;
}

interface ExplainWrongButtonProps {
  input: ExplainWrongInput;
  className?: string;
}

export function useExplainWrong() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplainWrongOutput | null>(null);

  const explainWrong = async (
    input: ExplainWrongInput
  ): Promise<ExplainWrongOutput | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-assist/explain-wrong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await response.json();
      const output = data.data as ExplainWrongOutput;
      setResult(output);
      return output;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { explainWrong, isLoading, error, result, reset };
}

export function ExplainWrongButton({
  input,
  className = "",
}: ExplainWrongButtonProps) {
  const { explainWrong, isLoading, error, result } = useExplainWrong();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    if (result) {
      setIsOpen(!isOpen);
      return;
    }
    const res = await explainWrong(input);
    if (res) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Button */}
      <div className="flex justify-center">
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`
            px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 border-black
            transition-all duration-100
            ${
              isLoading
                ? "bg-zinc-100 text-zinc-400 cursor-wait"
                : "bg-amber-100 text-amber-800 hover:bg-amber-200 bauhaus-shadow active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Thinking...
            </span>
          ) : result ? (
            isOpen ? "Hide Explanation ▲" : "Show Explanation ▼"
          ) : (
            "Why was I wrong?"
          )}
        </button>
      </div>

      {/* Inline Explanation Panel */}
      {isOpen && result && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-amber-50 border-2 border-amber-200 p-4 text-left">
            <h4 className="font-bold text-sm uppercase tracking-wider text-amber-700 mb-2">
              Why it's wrong
            </h4>
            <p className="text-base leading-relaxed text-zinc-700 mb-4">
              {result.explanation}
            </p>

            <div className="bg-white border-l-4 border-bauhaus-yellow p-3">
              <p className="text-sm font-bold uppercase tracking-wider text-amber-800 mb-1">
                💡 Tip
              </p>
              <p className="text-sm text-amber-900">{result.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 p-3 bg-rose-50 border-2 border-bauhaus-red text-bauhaus-red text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}

export default ExplainWrongButton;

