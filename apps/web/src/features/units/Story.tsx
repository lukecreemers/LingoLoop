import { useMemo } from "react";
import type { SGOutput } from "@shared";
import SelectableText from "../../components/ui/SelectableText";
import { DEMO_KNOWN_VOCAB } from "../../constants/vocab";

interface StoryProps {
  data: SGOutput;
  onComplete: () => void;
}

export default function Story({ data, onComplete }: StoryProps) {
  // Split story into paragraphs (by double newline or just display as one block)
  const paragraphs = useMemo(() => {
    // Split by double newlines, or treat quoted dialogue as separate
    const parts = data.story
      .split(/\n\n+/)
      .filter((p) => p.trim())
      .map((p) => p.trim());

    // If no paragraph breaks, return as single block
    if (parts.length <= 1) {
      return [data.story.trim()];
    }
    return parts;
  }, [data.story]);

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-blue-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 max-w-3xl mx-auto w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              READ<span className="text-bauhaus-red">.</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 flex flex-col min-h-0 py-4 overflow-hidden">
        <div className="flex-1 bg-white border-2 border-black bauhaus-shadow flex flex-col overflow-hidden">
          {/* Story Text */}
          <div className="flex-1 overflow-y-auto p-8 text-start">
            {/* Decorative opening quote */}
            <div className="text-8xl text-bauhaus-red font-serif leading-none -mb-6 -ml-2 select-none">
              "
            </div>

            <article className="space-y-6">
              {paragraphs.map((paragraph, index) => (
                <div
                  key={index}
                  className="first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:leading-none"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <SelectableText
                    text={paragraph}
                    knownVocab={DEMO_KNOWN_VOCAB}
                    sourceLanguage="Spanish"
                    targetLanguage="English"
                    textSize="text-lg"
                  />
                </div>
              ))}
            </article>

            {/* Decorative closing quote */}
            <div className="text-8xl text-bauhaus-red font-serif leading-none -mt-4 text-right -mr-2 select-none">
              "
            </div>

            {/* End marker */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-black" />
                <div className="w-2 h-2 bg-bauhaus-red" />
                <div className="w-8 h-0.5 bg-black" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={handleContinue}
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
