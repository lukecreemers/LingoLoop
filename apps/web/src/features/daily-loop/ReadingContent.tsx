import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

// ============================================================================
// READING CONTENT
// A rich markdown renderer with word-level interactivity (unknown-word
// underlining + click-to-translate). Supports two modes:
//   - "prose" for stories, articles, newsletters
//   - "conversation" for dialogue with chat bubbles
// ============================================================================

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

interface ReadingContentProps {
  /** The markdown text content to render */
  content: string;
  /** The type of reading — affects rendering style */
  type: "conversation" | "newsletter" | "story" | "article";
  /** Set of words the user already knows (lowercase) */
  knownVocab: Set<string>;
  /** The language of the text being displayed */
  sourceLanguage: string;
  /** The user's native language for translation */
  targetLanguage: string;
}

// ============================================================================
// TRANSLATION HOOK (shared with SelectableText)
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
        if (!response.ok) throw new Error("Failed to translate");
        const data = await response.json();
        const translation = data.data as TranslateOutput;
        setResult(translation);
        return translation;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return null;
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
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { translate, isLoading, error, result, reset };
}

// ============================================================================
// INLINE PARSING
// Splits text into segments with bold/italic/plain + word tokens
// ============================================================================

interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

/** Parse inline markdown (**bold**, *italic*) into segments */
function parseInlineMarkdown(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Match **bold** or *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        bold: false,
        italic: false,
      });
    }

    if (match[2]) {
      // **bold**
      segments.push({ text: match[2], bold: true, italic: false });
    } else if (match[3]) {
      // *italic*
      segments.push({ text: match[3], bold: false, italic: true });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      bold: false,
      italic: false,
    });
  }

  return segments;
}

// ============================================================================
// WORD TOKENIZATION (same as SelectableText)
// ============================================================================

interface WordToken {
  text: string;
  isWord: boolean;
  isUnknown: boolean;
}

function tokenizeWords(text: string, knownVocab: Set<string>): WordToken[] {
  const tokens: WordToken[] = [];
  const wordRegex = /[\p{L}\p{M}]+/gu;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, match.index),
        isWord: false,
        isUnknown: false,
      });
    }
    const word = match[0];
    tokens.push({
      text: word,
      isWord: true,
      isUnknown: !knownVocab.has(word.toLowerCase()),
    });
    lastIndex = match.index + word.length;
  }

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
// BLOCK PARSING
// ============================================================================

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "hr" }
  | { type: "blockquote"; text: string }
  | { type: "conversation_line"; speaker: string; text: string };

function parseBlocks(content: string, isConversation: boolean): Block[] {
  const rawLines = content.split("\n");
  const blocks: Block[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(" ").trim();
      if (text) {
        // For conversation: detect dialogue lines ("**Name:** text" or "**Name**: text")
        if (isConversation) {
          const convoMatch = text.match(
            /^\*\*([^*]+)\*\*:\s*(.+)$/
          );
          if (convoMatch) {
            blocks.push({
              type: "conversation_line",
              speaker: convoMatch[1].trim(),
              text: convoMatch[2].trim(),
            });
            paragraphBuffer = [];
            return;
          }
        }
        blocks.push({ type: "paragraph", text });
      }
      paragraphBuffer = [];
    }
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trimEnd();

    // Empty line => flush paragraph
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      flushParagraph();
      blocks.push({ type: "hr" });
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ type: "heading", level: 3, text: line.slice(4) });
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "heading", level: 2, text: line.slice(3) });
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "heading", level: 1, text: line.slice(2) });
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushParagraph();
      blocks.push({ type: "blockquote", text: line.slice(2) });
      continue;
    }

    // Regular text → accumulate into paragraph
    paragraphBuffer.push(line);
  }

  flushParagraph();
  return blocks;
}

// ============================================================================
// CONVERSATION BUBBLE COLORS
// ============================================================================

const CONVO_COLORS = [
  {
    bg: "bg-blue-600",
    text: "text-white",
    bubble: "bg-blue-50",
    border: "border-blue-600",
    accent: "text-blue-600",
  },
  {
    bg: "bg-rose-600",
    text: "text-white",
    bubble: "bg-rose-50",
    border: "border-rose-600",
    accent: "text-rose-600",
  },
  {
    bg: "bg-emerald-600",
    text: "text-white",
    bubble: "bg-emerald-50",
    border: "border-emerald-600",
    accent: "text-emerald-600",
  },
  {
    bg: "bg-amber-600",
    text: "text-white",
    bubble: "bg-amber-50",
    border: "border-amber-600",
    accent: "text-amber-600",
  },
  {
    bg: "bg-purple-600",
    text: "text-white",
    bubble: "bg-purple-50",
    border: "border-purple-600",
    accent: "text-purple-600",
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReadingContent({
  content,
  type,
  knownVocab,
  sourceLanguage,
  targetLanguage,
}: ReadingContentProps) {
  const [selection, setSelection] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [showAbove, setShowAbove] = useState(false);
  const { translate, isLoading, error, result, reset } = useAutoTranslate();
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isConversation = type === "conversation";

  // Parse content into blocks
  const blocks = useMemo(
    () => parseBlocks(content, isConversation),
    [content, isConversation]
  );

  // Collect unique speakers for conversation mode
  const speakerMap = useMemo(() => {
    const map = new Map<string, (typeof CONVO_COLORS)[0]>();
    let colorIndex = 0;
    for (const block of blocks) {
      if (block.type === "conversation_line" && !map.has(block.speaker)) {
        map.set(block.speaker, CONVO_COLORS[colorIndex % CONVO_COLORS.length]);
        colorIndex++;
      }
    }
    return map;
  }, [blocks]);

  const firstSpeaker = useMemo(() => {
    for (const block of blocks) {
      if (block.type === "conversation_line") return block.speaker;
    }
    return null;
  }, [blocks]);

  // ── Position helpers ──────────────────────────────────────────────────

  const calculatePosition = useCallback((rect: DOMRect) => {
    const popupWidth = 320;
    const popupHeight = 280;
    const halfPopup = popupWidth / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;

    let x = rect.left + rect.width / 2;
    if (x < halfPopup + margin) x = halfPopup + margin;
    else if (x > viewportWidth - halfPopup - margin)
      x = viewportWidth - halfPopup - margin;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldShowAbove =
      spaceBelow < popupHeight + margin && spaceAbove > spaceBelow;

    const y = shouldShowAbove ? rect.top - margin : rect.bottom + margin;
    return { x, y, showAbove: shouldShowAbove };
  }, []);

  // ── Selection + word click handlers ───────────────────────────────────

  const handleMouseUp = useCallback(() => {
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
        const pos = calculatePosition(rect);
        setSelection(selectedText);
        setPosition({ x: pos.x, y: pos.y });
        setShowAbove(pos.showAbove);
        translate(selectedText, sourceLanguage, targetLanguage);
      }
    }
  }, [sourceLanguage, targetLanguage, translate, calculatePosition]);

  const handleWordClick = useCallback(
    (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      const pos = calculatePosition(rect);
      window.getSelection()?.removeAllRanges();
      setSelection(word);
      setPosition({ x: pos.x, y: pos.y });
      setShowAbove(pos.showAbove);
      translate(word, sourceLanguage, targetLanguage);
    },
    [sourceLanguage, targetLanguage, translate, calculatePosition]
  );

  const handleClose = useCallback(() => {
    setSelection(null);
    setPosition(null);
    setShowAbove(false);
    reset();
    window.getSelection()?.removeAllRanges();
  }, [reset]);

  // Close popup on outside click / Escape
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
      if (e.key === "Escape") handleClose();
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

  // ── Render inline text with bold/italic + word tokens ─────────────────

  const renderInlineTokenized = useCallback(
    (text: string, keyPrefix: string): ReactNode[] => {
      const segments = parseInlineMarkdown(text);
      const nodes: ReactNode[] = [];

      segments.forEach((seg, segIdx) => {
        const tokens = tokenizeWords(seg.text, knownVocab);

        const wordNodes = tokens.map((token, tokIdx) => {
          const key = `${keyPrefix}-${segIdx}-${tokIdx}`;

          if (token.isWord && token.isUnknown) {
            return (
              <span
                key={key}
                className="underline decoration-purple-500 decoration-2 underline-offset-4 cursor-pointer hover:bg-purple-50 transition-colors rounded-sm"
                title="Click to translate"
                onClick={(e) => handleWordClick(token.text, e)}
              >
                {token.text}
              </span>
            );
          }
          return <span key={key}>{token.text}</span>;
        });

        if (seg.bold) {
          nodes.push(
            <strong
              key={`${keyPrefix}-seg-${segIdx}`}
              className="font-bold text-zinc-900"
            >
              {wordNodes}
            </strong>
          );
        } else if (seg.italic) {
          nodes.push(
            <em key={`${keyPrefix}-seg-${segIdx}`} className="italic">
              {wordNodes}
            </em>
          );
        } else {
          nodes.push(...wordNodes);
        }
      });

      return nodes;
    },
    [knownVocab, handleWordClick]
  );

  // ── Render a single block ─────────────────────────────────────────────

  const renderBlock = useCallback(
    (block: Block, index: number): ReactNode => {
      switch (block.type) {
        case "hr":
          return (
            <div key={index} className="flex justify-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-px bg-zinc-300" />
                <div className="w-1.5 h-1.5 bg-amber-500 rotate-45" />
                <div className="w-12 h-px bg-zinc-300" />
              </div>
            </div>
          );

        case "heading": {
          const headingClasses: Record<1 | 2 | 3, string> = {
            1: "text-2xl font-black tracking-tight mt-6 mb-3 text-zinc-900",
            2: "text-xl font-bold tracking-tight mt-5 mb-2 text-zinc-800",
            3: "text-lg font-bold mt-4 mb-2 text-zinc-700",
          };
          const Tag = `h${block.level}` as "h1" | "h2" | "h3";
          return (
            <Tag key={index} className={headingClasses[block.level]}>
              {renderInlineTokenized(block.text, `h-${index}`)}
            </Tag>
          );
        }

        case "blockquote":
          return (
            <blockquote
              key={index}
              className="my-3 pl-4 border-l-4 border-amber-400 italic text-zinc-600 text-lg leading-relaxed"
            >
              {renderInlineTokenized(block.text, `bq-${index}`)}
            </blockquote>
          );

        case "paragraph":
          return (
            <p
              key={index}
              className="text-lg leading-[1.9] text-zinc-800 my-3"
            >
              {renderInlineTokenized(block.text, `p-${index}`)}
            </p>
          );

        case "conversation_line": {
          const colors =
            speakerMap.get(block.speaker) || CONVO_COLORS[0];
          const isLeft = block.speaker === firstSpeaker;

          return (
            <div
              key={index}
              className={`flex ${isLeft ? "justify-start" : "justify-end"} my-2`}
            >
              <div className="max-w-[80%]">
                {/* Speaker tag */}
                <div
                  className={`text-xs font-bold tracking-widest uppercase mb-1 ${
                    isLeft ? "text-left" : "text-right"
                  }`}
                >
                  <span
                    className={`${colors.bg} ${colors.text} px-2 py-0.5 inline-block text-[10px]`}
                  >
                    {block.speaker}
                  </span>
                </div>
                {/* Bubble */}
                <div
                  className={`p-3 border-2 ${colors.border} ${colors.bubble} ${
                    isLeft ? "border-l-4" : "border-r-4"
                  }`}
                >
                  <span className="text-base leading-relaxed">
                    {renderInlineTokenized(
                      block.text,
                      `convo-${index}`
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        default:
          return null;
      }
    },
    [renderInlineTokenized, speakerMap, firstSpeaker]
  );

  // ── Prose wrapper (story / article / newsletter) ──────────────────────

  const renderProse = () => (
    <div className="bg-white border-2 border-black bauhaus-shadow">
      {/* Decorative header bar */}
      <div className="h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500" />

      <div className="p-8 md:p-10">
        {/* Decorative opening element for stories */}
        {type === "story" && (
          <div className="text-7xl text-amber-500/30 font-serif leading-none -mb-6 -ml-1 select-none pointer-events-none">
            "
          </div>
        )}

        <article
          className={`${
            type === "story"
              ? "first-of-type:[&>p:first-of-type]:first-letter:text-4xl first-of-type:[&>p:first-of-type]:first-letter:font-bold first-of-type:[&>p:first-of-type]:first-letter:text-amber-600 first-of-type:[&>p:first-of-type]:first-letter:mr-1 first-of-type:[&>p:first-of-type]:first-letter:float-left first-of-type:[&>p:first-of-type]:first-letter:leading-none"
              : ""
          }`}
        >
          {blocks.map(renderBlock)}
        </article>

        {/* Decorative closing element for stories */}
        {type === "story" && (
          <div className="text-7xl text-amber-500/30 font-serif leading-none -mt-4 text-right -mr-1 select-none pointer-events-none">
            "
          </div>
        )}

        {/* End marker */}
        <div className="flex justify-center mt-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-0.5 bg-zinc-300" />
            <div className="w-2 h-2 bg-amber-500 rotate-45" />
            <div className="w-10 h-0.5 bg-zinc-300" />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Conversation wrapper ──────────────────────────────────────────────

  const renderConversation = () => {
    // Separate narrative paragraphs from dialogue
    return (
      <div className="bg-white border-2 border-black bauhaus-shadow">
        {/* Header strip */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />

        <div className="p-6 md:p-8">
          {/* Speaker legend */}
          {speakerMap.size > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-zinc-200">
              {Array.from(speakerMap.entries()).map(
                ([speaker, colors]) => (
                  <span
                    key={speaker}
                    className={`${colors.bg} ${colors.text} px-2.5 py-1 text-xs font-bold tracking-wider uppercase`}
                  >
                    {speaker}
                  </span>
                )
              )}
            </div>
          )}

          <div className="space-y-1">{blocks.map(renderBlock)}</div>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative" onMouseUp={handleMouseUp}>
      {isConversation ? renderConversation() : renderProse()}

      {/* ── Translation Popup ─────────────────────────────────────── */}
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
          {/* Arrow */}
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
              {isLoading && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-purple-600 font-medium">
                    Translating...
                  </span>
                </div>
              )}

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

              {result && !isLoading && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                      Translation
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {result.translation}
                    </p>
                  </div>

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

