import { useMemo } from "react";
import type { EXOutput, ExplanationUnit } from "@shared";

interface ExplanationProps {
  data: EXOutput;
  plan: ExplanationUnit;
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

    // Block LaTeX $$...$$
    if (line.trim().startsWith("$$") && line.trim().endsWith("$$")) {
      flushList();
      const latex = line.trim().slice(2, -2).trim();
      elements.push(
        <div
          key={`latex-${i}`}
          className="my-6 py-4 px-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-bauhaus-blue text-center"
        >
          <span className="font-mono text-lg tracking-wide text-zinc-800">
            {parseLatexText(latex)}
          </span>
        </div>
      );
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-zinc-900 text-zinc-100 p-4 my-4 overflow-x-auto font-mono text-sm border-l-4 border-bauhaus-blue"
          >
            <code>{codeContent.join("\n")}</code>
          </pre>
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
    // Inline LaTeX $...$ (but not $$)
    let match = remaining.match(/^(.*?)\$([^$]+)\$(.*)$/s);
    if (match && !match[1].endsWith("$") && !match[3].startsWith("$")) {
      if (match[1]) parts.push(renderInline(match[1]));
      parts.push(
        <span
          key={keyIndex++}
          className="inline-block px-2 py-0.5 bg-indigo-50 border border-indigo-200 font-mono text-indigo-800 text-base"
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

    // Inline code `code`
    match = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
    if (match) {
      if (match[1]) parts.push(match[1]);
      parts.push(
        <code
          key={keyIndex++}
          className="bg-amber-100 text-amber-900 px-1.5 py-0.5 font-mono text-base border border-amber-200"
        >
          {match[2]}
        </code>
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
  // data is now just a string (the markdown content directly)
  const renderedContent = useMemo(() => {
    return renderMarkdown(data);
  }, [data]);

  const handleContinue = () => {
    onComplete();
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

      {/* Explanation Content */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-hidden">
        <div className="flex-1 bg-white border-2 border-black bauhaus-shadow flex flex-col overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Decorative element */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-1 bg-bauhaus-yellow" />
              <div className="w-4 h-4 bg-bauhaus-blue rotate-45" />
            </div>

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
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-between items-center">
          <p className="text-sm text-zinc-400 italic">
            Take your time to understand before continuing
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
