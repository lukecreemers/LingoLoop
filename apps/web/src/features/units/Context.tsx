import { useMemo } from "react";
import type { EXOutput, LessonPlanUnit } from "@shared";

interface ContextProps {
  data: EXOutput;
  plan: LessonPlanUnit;
  onComplete: () => void;
}

// Simple markdown renderer for context introductions
function renderContextMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") continue;

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold tracking-tight mt-4 mb-2 text-bauhaus-blue">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-black tracking-tight mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-black tracking-tighter mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Bullet list
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <li key={`li-${i}`} className="text-lg ml-4 list-disc list-inside my-1">
          {renderInline(line.slice(2))}
        </li>
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-lg leading-relaxed my-2">
        {renderInline(line)}
      </p>
    );
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold
    const match = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/s);
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

    parts.push(remaining);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default function Context({ data, plan: _plan, onComplete }: ContextProps) {
  const renderedContent = useMemo(() => renderContextMarkdown(data), [data]);

  return (
    <div className="h-full bg-bauhaus-white text-black font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              OVERVIEW<span className="text-bauhaus-green">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-bauhaus-green" />
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
              Lesson Introduction
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-hidden">
        <div className="flex-1 bg-white border-2 border-black bauhaus-shadow flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            {/* Decorative */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-1 bg-bauhaus-green" />
              <div className="w-4 h-4 bg-bauhaus-blue rotate-45" />
            </div>

            <article className="text-start">{renderedContent}</article>

            {/* End marker */}
            <div className="flex justify-center mt-8 pt-6 border-t border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bauhaus-green" />
                <div className="w-8 h-0.5 bg-black" />
                <div className="w-2 h-2 bg-bauhaus-blue" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-end">
          <button
            onClick={onComplete}
            className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Let's Go! →
          </button>
        </div>
      </footer>
    </div>
  );
}

