import { useMemo } from "react";
import type { SectionedLesson } from "@shared";
import type { UnitResult } from "../../stores/useSectionedLessonStore";

interface LessonReviewProps {
  lessonData: SectionedLesson;
  results: UnitResult[];
  score: number;
  total: number;
  onViewMap: () => void;
  onClose?: () => void;
}

// Unit type to friendly name
function unitTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    translation: "Translation",
    "fill-in-blanks": "Fill in Blanks",
    "write-in-blanks": "Write in Blanks",
    "word-meaning-match": "Vocabulary",
    "writing-practice": "Writing",
    conversation: "Conversation",
    context: "Context",
    explanation: "Explanation",
    story: "Story",
  };
  return labels[type] || type;
}

function getScorePct(s: number, t: number): number {
  return t > 0 ? Math.round((s / t) * 100) : -1;
}

function getScoreColor(pct: number): string {
  if (pct < 0) return "text-zinc-400";
  if (pct >= 80) return "text-bauhaus-green";
  if (pct >= 55) return "text-amber-500";
  return "text-bauhaus-red";
}

function getScoreBg(pct: number): string {
  if (pct < 0) return "bg-zinc-100";
  if (pct >= 80) return "bg-emerald-50 border-emerald-200";
  if (pct >= 55) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
}

function getOverallEmoji(pct: number): string {
  if (pct >= 90) return "🏆";
  if (pct >= 75) return "🌟";
  if (pct >= 55) return "👍";
  return "💪";
}

function getOverallMessage(pct: number): string {
  if (pct >= 90) return "Outstanding work!";
  if (pct >= 75) return "Great job!";
  if (pct >= 55) return "Good effort!";
  return "Keep practicing!";
}

export default function LessonReview({
  lessonData,
  results,
  score,
  total,
  onViewMap,
  onClose,
}: LessonReviewProps) {
  const overallPct = getScorePct(score, total);

  // Build per-section stats
  const sectionStats = useMemo(() => {
    return lessonData.sections.map((section, sIdx) => {
      const sectionResults = results.filter((r) => r.sectionIndex === sIdx);
      const sectionScore = sectionResults.reduce(
        (acc, r) => acc + (r.score ?? 0),
        0
      );
      const sectionTotal = sectionResults.reduce(
        (acc, r) => acc + (r.totalPossible ?? 0),
        0
      );
      const pct = getScorePct(sectionScore, sectionTotal);

      return {
        section,
        sectionIndex: sIdx,
        results: sectionResults,
        score: sectionScore,
        total: sectionTotal,
        pct,
        learningSummary: section.learningSummary,
      };
    });
  }, [lessonData, results]);

  // Count scored/non-scored sections
  const scoredSections = sectionStats.filter((s) => s.total > 0);

  return (
    <div className="h-full bg-bauhaus-white text-black flex flex-col overflow-hidden">
      {/* Sticky header with overall score */}
      <div className="shrink-0 border-b-4 border-black bg-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none">
              LESSON COMPLETE
              <span className="text-bauhaus-green">.</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {lessonData.sections.length} sections •{" "}
              {lessonData.sections.reduce(
                (acc, s) => acc + s.units.length,
                0
              )}{" "}
              units
            </p>
          </div>

          {total > 0 && (
            <div className="text-right">
              <div className="text-4xl font-black font-mono">
                <span className={getScoreColor(overallPct)}>
                  {overallPct}%
                </span>
              </div>
              <p className="text-sm font-bold text-zinc-500">
                {score}/{total}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          {/* Overall celebration card */}
          <div className="bg-white border-2 border-black p-8 bauhaus-shadow text-center">
            <div className="text-5xl mb-4">
              {getOverallEmoji(overallPct >= 0 ? overallPct : 75)}
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">
              {getOverallMessage(overallPct >= 0 ? overallPct : 75)}
            </h2>
            {total > 0 && (
              <div className="mt-4 flex justify-center gap-1">
                {/* Score bar */}
                <div className="w-64 h-3 bg-zinc-100 border border-zinc-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      overallPct >= 80
                        ? "bg-bauhaus-green"
                        : overallPct >= 55
                        ? "bg-amber-400"
                        : "bg-bauhaus-red"
                    }`}
                    style={{ width: `${Math.max(overallPct, 0)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section breakdown */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-4">
              Section Breakdown
            </h3>
            <div className="space-y-4">
              {sectionStats.map((stat) => (
                <div
                  key={stat.sectionIndex}
                  className={`bg-white border-2 border-black p-5 ${
                    stat.total > 0 ? "bauhaus-shadow" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-black text-white text-xs font-bold shrink-0">
                          {stat.sectionIndex + 1}
                        </span>
                        <h4 className="font-bold text-sm truncate">
                          {stat.section.sectionInstruction}
                        </h4>
                      </div>

                      {/* Learning summary */}
                      {stat.learningSummary && (
                        <div className="mt-2 text-sm text-zinc-600 leading-relaxed text-left pl-8">
                          {stat.learningSummary
                            .split("\n")
                            .filter((l) => l.trim())
                            .map((line, i) => {
                              const cleaned = line
                                .replace(/^[\s✓•\-*]+/, "")
                                .trim();
                              if (!cleaned) return null;
                              return (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 mb-1"
                                >
                                  <span className="text-bauhaus-green mt-0.5 shrink-0">
                                    ✓
                                  </span>
                                  <span>{cleaned}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Unit badges */}
                      <div className="flex flex-wrap gap-1 mt-2 pl-8">
                        {stat.results.map((r, ri) => {
                          const unitPct = getScorePct(
                            r.score ?? 0,
                            r.totalPossible ?? 0
                          );
                          return (
                            <span
                              key={ri}
                              className={`text-xs px-2 py-0.5 border font-mono font-bold ${getScoreBg(
                                unitPct
                              )} ${getScoreColor(unitPct)}`}
                            >
                              {unitTypeLabel(r.unitType)}
                              {r.totalPossible
                                ? ` ${r.score}/${r.totalPossible}`
                                : ""}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section score badge */}
                    {stat.total > 0 && (
                      <div
                        className={`shrink-0 text-right px-3 py-2 border ${getScoreBg(
                          stat.pct
                        )}`}
                      >
                        <div
                          className={`text-xl font-black font-mono ${getScoreColor(
                            stat.pct
                          )}`}
                        >
                          {stat.pct}%
                        </div>
                        <div className="text-xs text-zinc-400">
                          {stat.score}/{stat.total}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats row */}
          {scoredSections.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border-2 border-black p-4 text-center">
                <div className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1">
                  Best Section
                </div>
                <div className="text-lg font-black text-bauhaus-green">
                  {Math.max(...scoredSections.map((s) => s.pct))}%
                </div>
              </div>
              <div className="bg-white border-2 border-black p-4 text-center">
                <div className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1">
                  Total Units
                </div>
                <div className="text-lg font-black">
                  {results.length}
                </div>
              </div>
              <div className="bg-white border-2 border-black p-4 text-center">
                <div className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-1">
                  Time
                </div>
                <div className="text-lg font-black">
                  {Math.round(
                    results.reduce((a, r) => a + r.timeSpentMs, 0) / 60000
                  )}
                  m
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 bg-white border-t-4 border-black p-4">
        <div className="max-w-2xl mx-auto flex gap-4 justify-between">
          <button
            onClick={onViewMap}
            className="px-6 py-3 text-sm font-bold uppercase tracking-widest border-2 border-black
              bg-white text-black hover:bg-zinc-100 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            View Map
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 text-sm font-bold uppercase tracking-widest border-2 border-black
              bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Finish →
          </button>
        </div>
      </div>
    </div>
  );
}


