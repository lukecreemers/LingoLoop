import { useState, useCallback, useRef, useEffect, useMemo } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface TranslateOutput {
  translation: string;
  breakdown?: Array<{
    word: string;
    translation: string;
    note?: string;
  }>;
}

interface SelectableTextProps {
  /** The text content to render */
  text: string;
  /** Set of words the user already knows (lowercase) */
  knownVocab?: Set<string>;
  /** The language of the text being displayed */
  sourceLanguage: string;
  /** The user's native language for translation */
  targetLanguage: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Text size class (e.g., "text-lg", "text-base") */
  textSize?: string;
}

interface TokenSpan {
  text: string;
  isWord: boolean;
  isUnknown: boolean;
}

// ============================================================================
// TRANSLATION HOOK
// ============================================================================

function useAutoTranslate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslateOutput | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const translate = useCallback(
    async (
      text: string,
      sourceLanguage: string,
      targetLanguage: string
    ): Promise<TranslateOutput | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/ai-assist/translate-selection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to translate");
        }

        const data = await response.json();
        const translation = data.data as TranslateOutput;
        setResult(translation);
        return translation;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        const message =
          err instanceof Error ? err.message : "Translation failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { translate, isLoading, error, result, reset };
}

// ============================================================================
// TOKENIZATION UTILITIES
// ============================================================================

/**
 * Tokenize text into words and non-word segments
 * Preserves punctuation, whitespace, etc. as separate tokens
 */
function tokenizeText(text: string, knownVocab: Set<string>): TokenSpan[] {
  const tokens: TokenSpan[] = [];

  // Regex to match word characters (including accented characters)
  const wordRegex = /[\p{L}\p{M}]+/gu;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    // Add any non-word characters before this word
    if (match.index > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, match.index),
        isWord: false,
        isUnknown: false,
      });
    }

    // Add the word
    const word = match[0];
    const normalizedWord = word.toLowerCase();
    const isUnknown = !knownVocab.has(normalizedWord);

    tokens.push({
      text: word,
      isWord: true,
      isUnknown,
    });

    lastIndex = match.index + word.length;
  }

  // Add any remaining non-word characters
  if (lastIndex < text.length) {
    tokens.push({
      text: text.slice(lastIndex),
      isWord: false,
      isUnknown: false,
    });
  }

  return tokens;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SelectableText({
  text,
  knownVocab = new Set(),
  sourceLanguage,
  targetLanguage,
  className = "",
  textSize = "text-lg",
}: SelectableTextProps) {
  const [selection, setSelection] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [showAbove, setShowAbove] = useState(false);
  const { translate, isLoading, error, result, reset } = useAutoTranslate();
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Tokenize and mark unknown words
  const tokens = useMemo(
    () => tokenizeText(text, knownVocab),
    [text, knownVocab]
  );

  // Calculate popup position helper
  const calculatePosition = useCallback((rect: DOMRect) => {
    const popupWidth = 320;
    const popupHeight = 280;
    const halfPopup = popupWidth / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;

    // Calculate X position (centered on selection)
    let x = rect.left + rect.width / 2;
    if (x < halfPopup + margin) {
      x = halfPopup + margin;
    } else if (x > viewportWidth - halfPopup - margin) {
      x = viewportWidth - halfPopup - margin;
    }

    // Determine if we should show above or below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldShowAbove =
      spaceBelow < popupHeight + margin && spaceAbove > spaceBelow;

    let y: number;
    if (shouldShowAbove) {
      // Position above the text (bottom of popup at top of selection)
      y = rect.top - margin;
    } else {
      // Position below the text
      y = rect.bottom + margin;
    }

    return { x, y, showAbove: shouldShowAbove };
  }, []);

  // Handle text selection
  const handleMouseUp = useCallback(async () => {
    const selectedText = window.getSelection()?.toString().trim();

    if (
      selectedText &&
      selectedText.length > 0 &&
      selectedText.length < 500 &&
      containerRef.current
    ) {
      const range = window.getSelection()?.getRangeAt(0);
      if (
        range &&
        containerRef.current.contains(range.commonAncestorContainer)
      ) {
        const rect = range.getBoundingClientRect();
        const { x, y, showAbove: above } = calculatePosition(rect);

        setSelection(selectedText);
        setPosition({ x, y });
        setShowAbove(above);

        // Auto-trigger translation
        translate(selectedText, sourceLanguage, targetLanguage);
      }
    }
  }, [sourceLanguage, targetLanguage, translate, calculatePosition]);

  // Close popup
  const handleClose = useCallback(() => {
    setSelection(null);
    setPosition(null);
    setShowAbove(false);
    reset();
    window.getSelection()?.removeAllRanges();
  }, [reset]);

  // Handle click on unknown word
  const handleWordClick = useCallback(
    (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      const { x, y, showAbove: above } = calculatePosition(rect);

      // Clear any text selection
      window.getSelection()?.removeAllRanges();

      setSelection(word);
      setPosition({ x, y });
      setShowAbove(above);

      // Auto-trigger translation
      translate(word, sourceLanguage, targetLanguage);
    },
    [sourceLanguage, targetLanguage, translate, calculatePosition]
  );

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

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (selection) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selection, handleClose]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseUp={handleMouseUp}
    >
      {/* Rendered text with unknown words highlighted */}
      <span className={`${textSize} leading-relaxed`}>
        {tokens.map((token, index) =>
          token.isWord && token.isUnknown ? (
            <span
              key={index}
              className="underline decoration-purple-500 decoration-2 underline-offset-2 cursor-pointer hover:bg-purple-100 transition-colors"
              title="Click to translate"
              onClick={(e) => handleWordClick(token.text, e)}
            >
              {token.text}
            </span>
          ) : (
            <span key={index}>{token.text}</span>
          )
        )}
      </span>

      {/* Translation Popup - Fixed position to appear above everything */}
      {selection && position && (
        <div
          ref={popupRef}
          className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${position.x}px`,
            top: showAbove ? undefined : `${position.y}px`,
            bottom: showAbove
              ? `${window.innerHeight - position.y}px`
              : undefined,
            transform: "translateX(-50%)",
          }}
        >
          {/* Arrow - pointing up when below text, pointing down when above text */}
          {showAbove ? (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-600" />
          ) : (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-purple-600" />
          )}

          <div className="bg-white border-2 border-purple-600 shadow-2xl min-w-[240px] max-w-[320px] drop-shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-purple-200 bg-purple-50">
              <span className="text-sm font-bold text-purple-800 max-w-[250px] truncate">
                "
                {selection.length > 40
                  ? selection.slice(0, 40) + "..."
                  : selection}
                "
              </span>
              <button
                onClick={handleClose}
                className="text-purple-400 hover:text-purple-800 text-xl leading-none ml-2 font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-purple-600 font-medium">
                    Translating...
                  </span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="py-2">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={() =>
                      translate(selection, sourceLanguage, targetLanguage)
                    }
                    className="mt-2 text-sm text-purple-600 underline hover:text-purple-800"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Translation Result */}
              {result && !isLoading && (
                <div className="space-y-3">
                  {/* Main Translation */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                      Translation
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {result.translation}
                    </p>
                  </div>

                  {/* Word Breakdown */}
                  {result.breakdown && result.breakdown.length > 0 && (
                    <div className="border-t border-purple-100 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                        Word by Word
                      </p>
                      <div className="space-y-1.5">
                        {result.breakdown.map((item, i) => (
                          <div
                            key={i}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              {item.word}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-gray-700 flex-1 text-start">
                              {item.translation}
                              {item.note && (
                                <span className="text-xs text-gray-400 ml-1">
                                  ({item.note})
                                </span>
                              )}
                            </span>
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

export default SelectableText;
