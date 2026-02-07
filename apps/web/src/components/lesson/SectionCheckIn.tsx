import { useState, useRef, useEffect, useMemo } from "react";
import { useSectionChat } from "../../hooks/useSectionChat";
import {
  useSectionedLessonStore,
  type UnitResult,
} from "../../stores/useSectionedLessonStore";
import type { SectionedLesson } from "@shared";
import { renderMarkdown } from "../../utils/renderMarkdown";
import MaestroLoading from "./MaestroLoading";

interface SectionCheckInProps {
  sectionName: string;
  sectionIndex: number;
  lessonData: SectionedLesson;
  onContinue: () => void;
  onOpenMap: () => void;
}

// ============================================================================
// Theme config
// ============================================================================

const SECTION_THEMES = [
  {
    bg: "bg-bauhaus-blue",
    text: "text-bauhaus-blue",
    hover: "hover:bg-blue-700",
    light: "bg-blue-50",
    lightBorder: "border-blue-200",
    border: "border-bauhaus-blue",
    gradient: "from-blue-500 to-blue-600",
    accent: "#3B82F6",
  },
  {
    bg: "bg-bauhaus-red",
    text: "text-bauhaus-red",
    hover: "hover:bg-red-700",
    light: "bg-red-50",
    lightBorder: "border-red-200",
    border: "border-bauhaus-red",
    gradient: "from-red-500 to-red-600",
    accent: "#EF4444",
  },
  {
    bg: "bg-bauhaus-green",
    text: "text-bauhaus-green",
    hover: "hover:bg-emerald-700",
    light: "bg-emerald-50",
    lightBorder: "border-emerald-200",
    border: "border-bauhaus-green",
    gradient: "from-emerald-500 to-emerald-600",
    accent: "#10B981",
  },
  {
    bg: "bg-amber-500",
    text: "text-amber-500",
    hover: "hover:bg-amber-600",
    light: "bg-amber-50",
    lightBorder: "border-amber-200",
    border: "border-amber-500",
    gradient: "from-amber-500 to-amber-600",
    accent: "#F59E0B",
  },
];

const UNIT_TYPE_ICONS: Record<string, string> = {
  context: "📋",
  flashcard: "🃏",
  explanation: "📖",
  fill_in_blanks: "✏️",
  word_match: "🔗",
  write_in_blanks: "⌨️",
  translation: "🌐",
  conversation: "💬",
  writing_practice: "📝",
  word_order: "🔀",
};

// ============================================================================
// Typing indicator
// ============================================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="shrink-0 w-8 h-8 bg-zinc-300 text-white flex items-center justify-center text-sm border border-black rounded-sm">
        🎓
      </div>
      <div className="flex gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function buildLessonPlanContext(
  lessonData: SectionedLesson,
  upToSectionIndex: number
): string {
  const lines: string[] = [
    `Lesson: ${lessonData.input.instructions}`,
    `Level: ${lessonData.input.userLevel}`,
    `Target language: ${lessonData.input.targetLanguage}`,
    "",
  ];

  for (
    let si = 0;
    si <= upToSectionIndex && si < lessonData.sections.length;
    si++
  ) {
    const section = lessonData.sections[si];
    lines.push(`Section ${si + 1}: ${section.sectionInstruction}`);
    for (const unit of section.units) {
      lines.push(`  - [${unit.type}] ${unit.plan?.instructions ?? ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildSectionContext(
  lessonData: SectionedLesson,
  sectionIndex: number
): string {
  const section = lessonData.sections[sectionIndex];
  if (!section) return "";

  const parts: string[] = [`Section: ${section.sectionInstruction}`];

  for (const unit of section.units) {
    if (typeof unit.output === "string") {
      parts.push(unit.output.slice(0, 600));
    } else {
      parts.push(`[${unit.type}] ${unit.plan?.instructions ?? ""}`);
    }
  }

  return parts.join("\n\n");
}

// ============================================================================
// Learning summary checklist renderer
// ============================================================================

function LearningSummaryChecklist({
  summary,
  accent,
  themeBg,
}: {
  summary: string;
  accent: string;
  themeBg: string;
}) {
  // Parse the summary into intro line + checklist items
  const lines = summary.split("\n").filter((l) => l.trim().length > 0);

  // Find lines that start with ✓, -, *, •  (checklist items)
  const checkPattern = /^[\s]*(✓|✔|[-*•])\s*/;
  const introLines: string[] = [];
  const checkItems: string[] = [];

  for (const line of lines) {
    if (checkPattern.test(line)) {
      checkItems.push(line.replace(checkPattern, "").trim());
    } else {
      // If we haven't hit any check items yet, it's an intro line
      if (checkItems.length === 0) {
        introLines.push(line.trim());
      } else {
        // Trailing text after checklist — treat as an item
        checkItems.push(line.trim());
      }
    }
  }

  // If no checklist items were detected, fall back to rendering the whole text
  if (checkItems.length === 0) {
    return (
      <div className="text-sm leading-relaxed text-zinc-700 text-left">
        {renderMarkdown(summary)}
      </div>
    );
  }

  return (
    <div className="text-left">
      {introLines.length > 0 && (
        <p className="text-sm text-zinc-600 mb-3 leading-relaxed">
          {introLines.join(" ")}
        </p>
      )}
      <div className="space-y-2">
        {checkItems.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-sm"
          >
            <div
              className={`shrink-0 w-5 h-5 ${themeBg} text-white flex items-center justify-center mt-0.5 border border-black/20`}
              style={{ backgroundColor: accent }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-zinc-700 leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function SectionCheckIn({
  sectionName,
  sectionIndex,
  lessonData,
  onContinue,
  onOpenMap,
}: SectionCheckInProps) {
  const theme = SECTION_THEMES[sectionIndex % SECTION_THEMES.length];

  const [inputValue, setInputValue] = useState("");
  const [showChat, setShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Store data
  const results = useSectionedLessonStore((s) => s.results);
  const completedUnits = useSectionedLessonStore((s) => s.completedUnits);
  const insertSectionsAfterCurrent = useSectionedLessonStore(
    (s) => s.insertSectionsAfterCurrent
  );

  // Section data
  const section = lessonData.sections[sectionIndex];
  const sectionResults: UnitResult[] = results.filter(
    (r) => r.sectionIndex === sectionIndex
  );

  // Compute section score
  const sectionScore = useMemo(() => {
    const scored = sectionResults.filter(
      (r) => r.totalPossible !== undefined && r.totalPossible > 0
    );
    const got = scored.reduce((sum, r) => sum + (r.score ?? 0), 0);
    const total = scored.reduce((sum, r) => sum + (r.totalPossible ?? 0), 0);
    return { got, total, count: scored.length };
  }, [sectionResults]);

  const scorePct =
    sectionScore.total > 0
      ? Math.round((sectionScore.got / sectionScore.total) * 100)
      : null;

  // AI-generated learning summary (from backend) or fallback
  const learningSummary = useMemo(() => {
    if (section?.learningSummary) return section.learningSummary;
    // Fallback: generate from unit instructions
    if (!section) return "";
    const topics = section.units
      .map((u) => u.plan?.instructions ?? "")
      .filter(Boolean)
      .map((instr) => {
        const first = instr
          .split(/[.!]\s/)[0]
          .replace(
            /^(Explain|Teach|Practice|Review|Cover|Introduce|Help the user learn|Help the user practice)\s*/i,
            ""
          )
          .trim();
        return first.charAt(0).toLowerCase() + first.slice(1);
      })
      .filter((s) => s.length > 5);
    const unique = [...new Set(topics)];
    if (unique.length === 0)
      return `You completed the "${sectionName}" section!`;
    if (unique.length === 1) return `You learned about ${unique[0]}.`;
    if (unique.length === 2)
      return `You learned about ${unique[0]} and ${unique[1]}.`;
    const last = unique.pop();
    return `You learned about ${unique.join(", ")}, and ${last}.`;
  }, [section, sectionName]);

  // Per-unit scores for breakdown
  const unitScores = useMemo(() => {
    if (!section) return [];
    return section.units.map((unit, unitIdx) => {
      const result = sectionResults.find((r) => r.unitIndex === unitIdx);
      return {
        type: unit.type,
        icon: UNIT_TYPE_ICONS[unit.type] ?? "❓",
        score: result?.score,
        total: result?.totalPossible,
        hasPractice: result?.totalPossible !== undefined && result.totalPossible > 0,
      };
    });
  }, [section, sectionResults]);

  // Lesson progress
  const totalUnits = lessonData.sections.reduce(
    (sum, s) => sum + s.units.length,
    0
  );
  const completedCount = completedUnits.size;
  const progressPct = totalUnits > 0 ? (completedCount / totalUnits) * 100 : 0;

  // Is this the last section?
  const isLastSection = sectionIndex >= lessonData.sections.length - 1;

  // Chat
  const sectionContext = buildSectionContext(lessonData, sectionIndex);
  const lessonPlanContext = buildLessonPlanContext(lessonData, sectionIndex);

  const {
    messages,
    isStreaming,
    isGeneratingUnits,
    generationProgress,
    error,
    extraSections,
    sendMessage,
    clearExtraSections,
  } = useSectionChat({
    sectionContext,
    lessonPlanContext,
    targetLanguage: lessonData.input.targetLanguage ?? "Spanish",
    nativeLanguage: lessonData.input.nativeLanguage ?? "English",
    userLevel: lessonData.input.userLevel ?? "beginner",
  });

  const advanceFromCheckIn = useSectionedLessonStore(
    (s) => s.advanceFromCheckIn
  );

  // Insert extra sections on arrival, then navigate to the new section intro
  useEffect(() => {
    if (extraSections && extraSections.length > 0) {
      insertSectionsAfterCurrent(extraSections);
      clearExtraSections();
      // Navigate to the newly inserted section (it's now right after the current one)
      advanceFromCheckIn();
    }
  }, [extraSections, insertSectionsAfterCurrent, clearExtraSections, advanceFromCheckIn]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const chatAnchorRef = useRef<HTMLDivElement>(null);

  // Focus input when chat opens & scroll to chat area
  useEffect(() => {
    if (showChat) {
      // Small delay to let the DOM update before scrolling
      requestAnimationFrame(() => {
        chatAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        inputRef.current?.focus();
      });
    }
  }, [showChat]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;
    const msg = inputValue;
    setInputValue("");
    if (!showChat) setShowChat(true);
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isWaitingForResponse =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  const hasChat = messages.length > 0 || showChat;

  // ── LOADING SCREEN (tool call generating extra practice) ──
  if (isGeneratingUnits) {
    return <MaestroLoading progress={generationProgress} />;
  }

  return (
    <div className="h-full bg-bauhaus-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 px-6 pt-4 pb-3 bg-white border-b-2 border-zinc-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onOpenMap}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold tracking-wider uppercase
              border-2 border-black hover:bg-zinc-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0020 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Map
          </button>

          <div className="text-center">
            <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-400 uppercase">
              Section {sectionIndex + 1} of {lessonData.sections.length}
            </p>
          </div>

          {/* Progress mini */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-zinc-200 border border-zinc-300 overflow-hidden">
              <div
                className={`h-full ${theme.bg} transition-all duration-500`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {completedCount}/{totalUnits}
            </span>
          </div>
        </div>
      </header>

      {/* Main scrollable content */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* ══════════════════════════════════════════════
              CELEBRATION HEADER
              ══════════════════════════════════════════════ */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 relative">
              <div
                className={`w-full h-full ${theme.bg} text-white flex items-center justify-center
                  text-4xl border-2 border-black bauhaus-shadow`}
              >
                🎉
              </div>
              {/* Decorative sparks */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rotate-45 border border-black" />
              <div className="absolute -bottom-1 -left-2 w-3 h-3 bg-bauhaus-red rotate-12 border border-black" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-1">
              Section Complete<span className={theme.text}>!</span>
            </h1>
            <p className="text-sm text-zinc-400">
              Nice work finishing "{sectionName}"
            </p>
          </div>

          {/* ══════════════════════════════════════════════
              WHAT YOU LEARNED (AI Summary — checklist)
              ══════════════════════════════════════════════ */}
          <div className="bg-white border-2 border-black p-5 bauhaus-shadow mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 ${theme.bg} text-white flex items-center justify-center text-sm border border-black shrink-0`}>
                📚
              </div>
              <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
                What you learned
              </h3>
            </div>
            <LearningSummaryChecklist summary={learningSummary} accent={theme.accent} themeBg={theme.bg} />
          </div>

          {/* ══════════════════════════════════════════════
              SCORE CARD
              ══════════════════════════════════════════════ */}
          {sectionScore.total > 0 && (
            <div className="bg-white border-2 border-black p-5 bauhaus-shadow mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  Section Score
                </h3>
                {scorePct !== null && (
                  <div
                    className={`px-3 py-1 text-sm font-black border-2 border-black ${
                      scorePct >= 80
                        ? "bg-bauhaus-green text-white"
                        : scorePct >= 50
                          ? "bg-amber-400 text-black"
                          : "bg-bauhaus-red text-white"
                    }`}
                  >
                    {scorePct}%
                  </div>
                )}
              </div>

              {/* Big score */}
              <div className="flex items-end gap-1 mb-4">
                <span className="text-5xl font-black font-mono text-emerald-600 leading-none">
                  {sectionScore.got}
                </span>
                <span className="text-2xl font-black font-mono text-zinc-300 mb-1">
                  /{sectionScore.total}
                </span>
              </div>

              {/* Score bar */}
              <div className="w-full h-3 bg-zinc-100 border border-zinc-200 overflow-hidden mb-4">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{
                    width: `${sectionScore.total > 0 ? (sectionScore.got / sectionScore.total) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Per-unit breakdown */}
              <div className="flex flex-wrap gap-2">
                {unitScores
                  .filter((u) => u.hasPractice)
                  .map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 text-xs"
                    >
                      <span>{u.icon}</span>
                      <span className="font-bold text-zinc-600">
                        {u.score ?? 0}/{u.total ?? 0}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            STICKY CONTINUE (sticks to top when scrolling down into chat)
            ══════════════════════════════════════════════════ */}
        <div
          ref={chatAnchorRef}
          className="sticky top-0 z-10 px-6 py-3 bg-white/95 backdrop-blur-sm border-b-2 border-zinc-100"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={onContinue}
              disabled={isStreaming || isGeneratingUnits}
              className={`flex-1 px-6 py-3 text-base font-bold uppercase tracking-widest border-2 border-black
                ${theme.bg} text-white ${theme.hover} bauhaus-shadow
                disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
            >
              {isLastSection ? "Finish Lesson →" : "Next Section →"}
            </button>
            {!hasChat && (
              <button
                onClick={() => setShowChat(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-3 border-2 border-zinc-300 text-sm font-bold
                  text-zinc-500 hover:border-black hover:text-black transition-colors"
              >
                <span>💬</span>
                Ask tutor
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            TUTOR CHAT (expands to fill remaining space)
            ══════════════════════════════════════════════════ */}
        {hasChat && (
          <div className="max-w-2xl mx-auto px-6 pb-6" style={{ minHeight: "calc(100vh - 220px)" }}>
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-6 h-6 ${theme.bg} text-white flex items-center justify-center text-xs border border-black`}>
                  🎓
                </div>
                <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                  Tutor Chat
                </p>
              </div>

              {/* Messages */}
              <div className="space-y-3 mb-4">
                {/* Initial tutor message */}
                {messages.length === 0 && (
                  <div className="flex items-start gap-3 p-3">
                    <div
                      className={`shrink-0 w-8 h-8 ${theme.bg} text-white flex items-center justify-center text-sm border border-black`}
                    >
                      🎓
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-600 pt-1">
                      What would you like to go over? I can explain anything from this section or create extra practice for you.
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isLastAssistant =
                    msg.role === "assistant" && i === messages.length - 1;
                  const showCursor =
                    isStreaming && isLastAssistant && msg.content.length > 0;

                  return (
                    <div key={i}>
                      {msg.role === "user" ? (
                        <div className="flex items-start gap-3 p-3 bg-zinc-50 border-l-4 border-zinc-300">
                          <div className="shrink-0 w-8 h-8 bg-zinc-700 text-white flex items-center justify-center font-bold text-sm">
                            Q
                          </div>
                          <p className="text-sm font-medium pt-1 text-left">
                            {msg.content}
                          </p>
                        </div>
                      ) : (
                        msg.content.length > 0 && (
                          <div className="flex items-start gap-3 p-3">
                            <div
                              className={`shrink-0 w-8 h-8 ${theme.bg} text-white flex items-center justify-center text-sm border border-black`}
                            >
                              🎓
                            </div>
                            <div className="flex-1 text-left">
                              <article className="prose-custom text-start">
                                {renderMarkdown(msg.content)}
                                {showCursor && (
                                  <span className="inline-block w-2 h-5 bg-bauhaus-blue ml-1 animate-pulse" />
                                )}
                              </article>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}

                {isWaitingForResponse && <TypingIndicator />}
              </div>

              {error && (
                <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              {/* Chat input */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about anything from this section..."
                  disabled={isStreaming || isGeneratingUnits}
                  className="flex-1 px-4 py-2.5 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-bauhaus-blue disabled:bg-zinc-100 disabled:text-zinc-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={
                    !inputValue.trim() || isStreaming || isGeneratingUnits
                  }
                  className={`px-4 py-2.5 ${theme.bg} text-white font-bold text-xs uppercase tracking-wider border-2 border-black
                    ${theme.hover} disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed
                    transition-colors`}
                >
                  {isStreaming ? (
                    <svg
                      className="w-4 h-4 animate-spin"
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
