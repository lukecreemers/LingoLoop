import { useState, useCallback, useRef, useEffect } from "react";

interface TranslateOutput {
  translation: string;
  breakdown?: Array<{
    word: string;
    translation: string;
    note?: string;
  }>;
}

interface TranslatableTextProps {
  children: React.ReactNode;
  sourceLanguage: string;
  targetLanguage: string;
  className?: string;
}

export function useTranslateSelection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateSelection = async (
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslateOutput | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-assist/translate-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
      });

      if (!response.ok) {
        throw new Error("Failed to translate");
      }

      const data = await response.json();
      return data.data as TranslateOutput;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { translateSelection, isLoading, error };
}

export function TranslatableText({
  children,
  sourceLanguage,
  targetLanguage,
  className = "",
}: TranslatableTextProps) {
  const [selection, setSelection] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [translation, setTranslation] = useState<TranslateOutput | null>(null);
  const { translateSelection, isLoading, error } = useTranslateSelection();
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText && selectedText.length > 0 && selectedText.length < 200) {
      const range = window.getSelection()?.getRangeAt(0);
      if (
        range &&
        containerRef.current?.contains(range.commonAncestorContainer)
      ) {
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setSelection(selectedText);
        setPosition({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.bottom - containerRect.top + 8,
        });
        setTranslation(null);
      }
    }
  }, []);

  const handleTranslate = async () => {
    if (!selection) return;
    const result = await translateSelection(
      selection,
      sourceLanguage,
      targetLanguage
    );
    if (result) {
      setTranslation(result);
    }
  };

  const handleClose = () => {
    setSelection(null);
    setPosition(null);
    setTranslation(null);
    window.getSelection()?.removeAllRanges();
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    if (selection) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selection]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseUp={handleMouseUp}
    >
      {children}

      {/* Translation Popup */}
      {selection && position && (
        <div
          ref={popupRef}
          className="absolute z-50 animate-in fade-in zoom-in-95"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-black" />

          <div className="bg-white border-2 border-black bauhaus-shadow min-w-[200px] max-w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 bg-zinc-50">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                "
                {selection.length > 30
                  ? selection.slice(0, 30) + "..."
                  : selection}
                "
              </span>
              <button
                onClick={handleClose}
                className="text-zinc-400 hover:text-black text-lg leading-none ml-2"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-3">
              {!translation && !isLoading && (
                <button
                  onClick={handleTranslate}
                  className="w-full px-4 py-2 text-sm font-bold uppercase tracking-wider 
                    bg-bauhaus-blue text-white border-2 border-black hover:bg-blue-700
                    transition-colors"
                >
                  Translate to {targetLanguage}
                </button>
              )}

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-2 text-zinc-500">
                  <span className="w-4 h-4 border-2 border-bauhaus-blue border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Translating...</span>
                </div>
              )}

              {error && <p className="text-sm text-bauhaus-red">{error}</p>}

              {translation && (
                <div className="space-y-3">
                  {/* Main Translation */}
                  <div>
                    <p className="text-base font-medium">
                      {translation.translation}
                    </p>
                  </div>

                  {/* Word Breakdown */}
                  {translation.breakdown &&
                    translation.breakdown.length > 0 && (
                      <div className="border-t border-zinc-200 pt-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Breakdown
                        </p>
                        <div className="space-y-1">
                          {translation.breakdown.map((item, i) => (
                            <div
                              key={i}
                              className="text-sm"
                            >
                              <span className="font-mono text-bauhaus-blue">
                                {item.word}
                              </span>
                              <span className="text-zinc-400 mx-1">→</span>
                              <span>{item.translation}</span>
                              {item.note && (
                                <span className="text-xs text-zinc-400 ml-1">
                                  ({item.note})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TranslatableText;
