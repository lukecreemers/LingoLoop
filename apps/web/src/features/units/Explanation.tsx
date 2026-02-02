import { useMemo, useState, useRef, useEffect } from "react";
import type { EXOutput, LessonPlanUnit } from "@shared";
import { useExplanationChat } from "../../hooks/useExplanationChat";

interface ExplanationProps {
  data: EXOutput;
  plan: LessonPlanUnit;
  onComplete: () => void;
}

// Render LaTeX \text{} commands to plain text
function parseLatexText(latex: string): string {
  return latex
    .replace(/\\text\{([^}]*)\}/g, "$1") // \text{word} -> word
    .replace(/\\textbf\{([^}]*)\}/g, "$1") // \textbf{word} -> word
    .replace(/\\textit\{([^}]*)\}/g, "$1") // \textit{word} -> word
    .replace(/\\mathbf\{([^}]*)\}/g, "$1") // \mathbf{word} -> word
    .replace(/\\,/g, " ") // thin space
    .replace(/\\;/g, " ") // medium space
    .replace(/\\quad/g, "  ") // quad space
    .replace(/\\qquad/g, "    ") // double quad
    .replace(/\\rightarrow/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\Leftarrow/g, "⇐")
    .replace(/\\neq/g, "≠")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\infty/g, "∞")
    .replace(/\\sum/g, "Σ")
    .replace(/\\prod/g, "∏")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\_/g, "_")
    .replace(/\\{/g, "{")
    .replace(/\\}/g, "}")
    .trim();
}

// Parse a table row into cells
function parseTableRow(line: string): string[] {
  return line
    .slice(1, -1) // Remove leading and trailing |
    .split("|")
    .map((cell) => cell.trim());
}

// Check if a line is a table separator (e.g., |---|---|)
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
  // A separator row contains only |, -, :, and spaces
  return trimmed.replace(/[\s|:-]/g, "").length === 0;
}

// Simple markdown renderer for pedagogical explanations
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let tableRows: string[][] = [];
  let inTable = false;
  let tableHasHeader = false;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag
          key={`list-${elements.length}`}
          className={`${
            listType === "ol" ? "list-decimal" : "list-disc"
          } list-inside space-y-1 my-4 text-lg`}
        >
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headerRow = tableHasHeader ? tableRows[0] : null;
      const bodyRows = tableHasHeader ? tableRows.slice(1) : tableRows;

      elements.push(
        <div
          key={`table-${elements.length}`}
          className="my-6 overflow-x-auto"
        >
          <table className="w-full border-collapse border-2 border-black">
            {headerRow && (
              <thead className="bg-zinc-100">
                <tr>
                  {headerRow.map((cell, ci) => (
                    <th
                      key={ci}
                      className="border-2 border-black px-4 py-2 text-left font-bold text-sm uppercase tracking-wider"
                    >
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri % 2 === 0 ? "bg-white" : "bg-zinc-50"}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border border-zinc-300 px-4 py-2 text-base"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
      tableHasHeader = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Block LaTeX $$...$$ - styled as a highlighted example
    if (line.trim().startsWith("$$") && line.trim().endsWith("$$")) {
      flushList();
      const latex = line.trim().slice(2, -2).trim();
      elements.push(
        <div
          key={`latex-${i}`}
          className="my-6 py-4 px-6 bg-gradient-to-r from-blue-50 to-sky-50 border-l-4 border-bauhaus-blue text-center rounded-r-sm"
        >
          <span className="text-xl font-semibold tracking-wide text-blue-900">
            {parseLatexText(latex)}
          </span>
        </div>
      );
      continue;
    }

    // Code block - styled as language examples, not programming code
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${i}`}
            className="my-6 p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200 rounded-sm shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200/60">
              <div className="w-2 h-2 bg-bauhaus-yellow rotate-45" />
              <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">
                Example
              </span>
            </div>
            <div className="space-y-1 text-lg leading-relaxed">
              {codeContent.map((codeLine, idx) => (
                <p key={idx} className="text-zinc-800">
                  {codeLine || "\u00A0"}
                </p>
              ))}
            </div>
          </div>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Empty line - flush list/table and add spacing
    if (line.trim() === "") {
      flushList();
      flushTable();
      continue;
    }

    // Table row (starts and ends with |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList();

      // Check if this is a separator row
      if (isTableSeparator(line)) {
        // Mark that we have a header (previous row was header)
        tableHasHeader = true;
        continue;
      }

      // Parse the row
      const cells = parseTableRow(line.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    }

    // If we were in a table but this line isn't a table row, flush
    if (inTable) {
      flushTable();
    }

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-xl font-black tracking-tight mt-6 mb-3 text-bauhaus-blue"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-2xl font-black tracking-tight mt-8 mb-4 border-b-2 border-black pb-2"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-3xl font-black tracking-tighter mt-8 mb-4"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Bullet list
    if (line.match(/^[-*]\s/)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(line.slice(2));
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(line.replace(/^\d+\.\s/, ""));
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p
        key={`p-${i}`}
        className="text-lg leading-relaxed my-3"
      >
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  flushTable();

  return elements;
}

// Render inline markdown (bold, italic, code, inline latex)
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Inline LaTeX $...$ (but not $$) - styled as highlighted phrases
    let match = remaining.match(/^(.*?)\$([^$]+)\$(.*)$/s);
    if (match && !match[1].endsWith("$") && !match[3].startsWith("$")) {
      if (match[1]) parts.push(renderInline(match[1]));
      parts.push(
        <span
          key={keyIndex++}
          className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 font-semibold rounded-sm border-b-2 border-blue-300"
        >
          {parseLatexText(match[2])}
        </span>
      );
      remaining = match[3];
      continue;
    }

    // Bold **text** or __text__
    match = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/s);
    if (match) {
      if (match[1]) parts.push(match[1]);
      parts.push(
        <strong
          key={keyIndex++}
          className="font-bold text-black"
        >
          {match[3]}
        </strong>
      );
      remaining = match[4];
      continue;
    }

    // Italic *text* or _text_
    match = remaining.match(/^(.*?)(\*|_)(.+?)\2(.*)$/s);
    if (match && !match[1].endsWith("*") && !match[1].endsWith("_")) {
      if (match[1]) parts.push(match[1]);
      parts.push(
        <em
          key={keyIndex++}
          className="italic"
        >
          {match[3]}
        </em>
      );
      remaining = match[4];
      continue;
    }

    // Inline code - styled as highlighted phrases, not programming code
    match = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
    if (match) {
      if (match[1]) parts.push(match[1]);
      parts.push(
        <span
          key={keyIndex++}
          className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded-sm border-b-2 border-amber-300"
        >
          {match[2]}
        </span>
      );
      remaining = match[3];
      continue;
    }

    // No more matches, add remaining text
    parts.push(remaining);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
export default function Explanation({
  data,
  plan: _plan,
  onComplete,
}: ExplanationProps) {
  const [inputValue, setInputValue] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // data is now just a string (the markdown content directly)
  const renderedContent = useMemo(() => {
    return renderMarkdown(data);
  }, [data]);

  const { messages, isStreaming, error, sendMessage } = useExplanationChat({
    explanationContext: data,
    targetLanguage: "Spanish",
    nativeLanguage: "English",
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (contentRef.current && messages.length > 0) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  const handleContinue = () => {
    onComplete();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;
    const question = inputValue;
    setInputValue("");
    await sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-yellow-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              LEARN<span className="text-bauhaus-yellow">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-bauhaus-yellow" />
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
              Concept Explanation
            </span>
          </div>
        </div>
      </header>

      {/* Explanation Content with integrated chat */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-hidden">
        <div className="flex-1 bg-white border-2 border-black bauhaus-shadow flex flex-col overflow-hidden">
          {/* Scrollable Content Area */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto p-8"
          >
            {/* Decorative element */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-1 bg-bauhaus-yellow" />
              <div className="w-4 h-4 bg-bauhaus-blue rotate-45" />
            </div>

            {/* Main Explanation */}
            <article className="prose-custom text-start">
              {renderedContent}
            </article>

            {/* End marker */}
            <div className="flex justify-center mt-8 pt-6 border-t border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bauhaus-yellow" />
                <div className="w-8 h-0.5 bg-black" />
                <div className="w-2 h-2 bg-bauhaus-blue" />
                <div className="w-8 h-0.5 bg-black" />
                <div className="w-2 h-2 bg-bauhaus-red" />
              </div>
            </div>

            {/* Chat Q&A Section - rendered inline below explanation */}
            {messages.length > 0 && (
              <div className="mt-8 space-y-6">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {msg.role === "user" ? (
                      // User question - styled as a callout
                      <div className="flex items-start gap-3 p-4 bg-bauhaus-blue/5 border-l-4 border-bauhaus-blue">
                        <div className="shrink-0 w-8 h-8 bg-bauhaus-blue text-white flex items-center justify-center font-bold text-sm">
                          Q
                        </div>
                        <p className="text-lg font-medium text-bauhaus-blue pt-1">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      // Assistant answer - rendered in same style as explanation
                      <div className="pl-11">
                        <article className="prose-custom text-start">
                          {renderMarkdown(msg.content)}
                          {isStreaming && i === messages.length - 1 && (
                            <span className="inline-block w-2 h-5 bg-bauhaus-blue ml-1 animate-pulse" />
                          )}
                        </article>
                      </div>
                    )}
                  </div>
                ))}
                {error && (
                  <div className="text-red-500 text-sm pl-11">{error}</div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input - Fixed at bottom of content box */}
          <div className="shrink-0 p-4 border-t-2 border-zinc-200 bg-zinc-50">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up question about this concept..."
                disabled={isStreaming}
                className="flex-1 px-4 py-3 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-bauhaus-blue disabled:bg-zinc-100 disabled:text-zinc-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isStreaming}
                className="px-6 py-3 bg-bauhaus-blue text-white font-bold text-sm uppercase tracking-wider border-2 border-black
                  hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed
                  transition-colors flex items-center gap-2"
              >
                {isStreaming ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                    </svg>
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-between items-center">
          <p className="text-sm text-zinc-400 italic">
            Ask questions above if anything is unclear
          </p>
          <button
            onClick={handleContinue}
            className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-bauhaus-yellow text-black hover:bg-amber-400 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Got It →
          </button>
        </div>
      </footer>
    </div>
  );
}
