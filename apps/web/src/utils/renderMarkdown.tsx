import React from "react";

// =============================================================================
// Shared markdown renderer for pedagogical language-learning content.
// Used by Explanation, SectionCheckIn, and any other chat/content views.
// =============================================================================

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
  return trimmed.replace(/[\s|:-]/g, "").length === 0;
}

// Render inline markdown (bold, italic, code, inline latex)
export function renderInline(text: string): React.ReactNode {
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
        <strong key={keyIndex++} className="font-bold text-black">
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
        <em key={keyIndex++} className="italic">
          {match[3]}
        </em>
      );
      remaining = match[4];
      continue;
    }

    // Inline code - styled as highlighted phrases
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

    // No more matches
    parts.push(remaining);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// Simple markdown renderer for pedagogical explanations
export function renderMarkdown(text: string): React.ReactNode[] {
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

    // Code block - styled as language examples
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

    // Empty line
    if (line.trim() === "") {
      flushList();
      flushTable();
      continue;
    }

    // Horizontal rule (---, ***, ___)
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      flushList();
      flushTable();
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-6 border-t-2 border-zinc-200"
        />
      );
      continue;
    }

    // Table row
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList();
      if (isTableSeparator(line)) {
        tableHasHeader = true;
        continue;
      }
      const cells = parseTableRow(line.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    }

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
      <p key={`p-${i}`} className="text-lg leading-relaxed my-3">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  flushTable();

  return elements;
}

