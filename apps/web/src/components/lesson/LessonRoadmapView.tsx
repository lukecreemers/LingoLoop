import type { SectionedLesson } from "@shared";
import {
  useSectionedLessonStore,
  useTotalScore,
  useLessonProgress,
  type NodeStatus,
} from "../../stores/useSectionedLessonStore";
import ProgressBar from "../ui/ProgressBar";

// Unit type icons and labels
const UNIT_TYPE_CONFIG: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  context: { icon: "📋", label: "Overview", color: "bg-emerald-500" },
  flashcard: { icon: "🃏", label: "Flashcards", color: "bg-amber-500" },
  explanation: { icon: "📖", label: "Learn", color: "bg-yellow-500" },
  fill_in_blanks: {
    icon: "✏️",
    label: "Fill In Blanks",
    color: "bg-blue-500",
  },
  word_match: { icon: "🔗", label: "Matching", color: "bg-purple-500" },
  write_in_blanks: { icon: "⌨️", label: "Write", color: "bg-indigo-500" },
  translation: { icon: "🌐", label: "Translate", color: "bg-teal-500" },
  conversation: { icon: "💬", label: "Conversation", color: "bg-pink-500" },
  writing_practice: { icon: "📝", label: "Writing", color: "bg-rose-500" },
  word_order: { icon: "🔀", label: "Unscramble", color: "bg-cyan-500" },
};

function getUnitConfig(type: string) {
  return (
    UNIT_TYPE_CONFIG[type] ?? {
      icon: "❓",
      label: type,
      color: "bg-zinc-500",
    }
  );
}

// Status-dependent styles
function getNodeStyles(status: NodeStatus): {
  ring: string;
  bg: string;
  text: string;
  opacity: string;
  cursor: string;
} {
  switch (status) {
    case "completed":
      return {
        ring: "ring-2 ring-emerald-500 ring-offset-2",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        opacity: "opacity-100",
        cursor: "cursor-pointer hover:scale-105",
      };
    case "unlocked":
      return {
        ring: "ring-2 ring-bauhaus-blue ring-offset-2 animate-pulse",
        bg: "bg-blue-50",
        text: "text-bauhaus-blue",
        opacity: "opacity-100",
        cursor: "cursor-pointer hover:scale-105",
      };
    case "active":
      return {
        ring: "ring-2 ring-bauhaus-blue ring-offset-2",
        bg: "bg-blue-100",
        text: "text-bauhaus-blue",
        opacity: "opacity-100",
        cursor: "cursor-pointer hover:scale-105",
      };
    case "locked":
      return {
        ring: "ring-1 ring-zinc-200",
        bg: "bg-zinc-50",
        text: "text-zinc-300",
        opacity: "opacity-50",
        cursor: "cursor-not-allowed",
      };
  }
}

interface NodeProps {
  unitType: string;
  unitName: string;
  status: NodeStatus;
  isLast: boolean;
  onClick: () => void;
}

function RoadmapNode({ unitType, unitName, status, isLast, onClick }: NodeProps) {
  const config = getUnitConfig(unitType);
  const styles = getNodeStyles(status);

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <button
        onClick={onClick}
        disabled={status === "locked"}
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          border-2 border-black transition-all duration-200
          ${styles.bg} ${styles.ring} ${styles.opacity} ${styles.cursor}
        `}
      >
        {/* Completion checkmark overlay */}
        {status === "completed" && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white z-10">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        {/* Lock icon for locked */}
        {status === "locked" ? (
          <svg
            className="w-6 h-6 text-zinc-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        ) : (
          <span className="text-2xl">{config.icon}</span>
        )}
      </button>

      {/* Label */}
      <div className={`mt-2 text-center max-w-[120px] ${styles.text}`}>
        <p className="text-xs font-bold uppercase tracking-wider">
          {config.label}
        </p>
        <p
          className={`text-[10px] mt-0.5 truncate ${
            status === "locked" ? "text-zinc-300" : "text-zinc-500"
          }`}
          title={unitName}
        >
          {unitName}
        </p>
      </div>

      {/* Connector line to next node */}
      {!isLast && (
        <div className="w-0.5 h-8 bg-zinc-200 mt-2" />
      )}
    </div>
  );
}

const SECTION_COLORS = [
  { accent: "border-bauhaus-blue", badge: "bg-bauhaus-blue" },
  { accent: "border-bauhaus-red", badge: "bg-bauhaus-red" },
  { accent: "border-bauhaus-green", badge: "bg-bauhaus-green" },
  { accent: "border-amber-500", badge: "bg-amber-500" },
];

interface LessonRoadmapViewProps {
  lessonData: SectionedLesson;
  onClose?: () => void;
}

export default function LessonRoadmapView({
  lessonData,
  onClose,
}: LessonRoadmapViewProps) {
  const goToUnit = useSectionedLessonStore((s) => s.goToUnit);
  const getNodeStatus = useSectionedLessonStore((s) => s.getNodeStatus);
  const { score, total } = useTotalScore();
  const progress = useLessonProgress();

  const handleNodeClick = (
    sectionIndex: number,
    unitIndex: number,
    status: NodeStatus
  ) => {
    if (status === "locked") return;
    goToUnit(sectionIndex, unitIndex);
  };

  return (
    <div className="h-full flex flex-col bg-bauhaus-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b-2 border-zinc-100">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-zinc-100 transition-colors"
                aria-label="Close lesson"
              >
                <span className="text-xl font-bold">×</span>
              </button>
            )}

            <h2 className="text-2xl font-black tracking-tighter">
              Lesson Map<span className="text-bauhaus-blue">.</span>
            </h2>

            {/* Score */}
            {total > 0 && (
              <div className="text-right">
                <div className="text-lg font-black font-mono tracking-tight">
                  <span className="text-bauhaus-green">{score}</span>
                  <span className="text-zinc-300 mx-1">/</span>
                  <span>{total}</span>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <ProgressBar current={progress.current} total={progress.total} />
        </div>
      </div>

      {/* Scrollable roadmap content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-lg mx-auto space-y-8">
          {lessonData.sections.map((section, sectionIndex) => {
            const colors =
              SECTION_COLORS[sectionIndex % SECTION_COLORS.length];

            return (
              <div key={sectionIndex} className="relative">
                {/* Section header */}
                <div
                  className={`border-l-4 ${colors.accent} pl-4 mb-6`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`${colors.badge} text-white text-xs font-bold px-2 py-0.5 border border-black`}
                    >
                      {sectionIndex + 1}
                    </span>
                    <h3 className="text-lg font-black tracking-tight uppercase">
                      {section.sectionInstruction}
                    </h3>
                  </div>
                </div>

                {/* Unit nodes */}
                <div className="flex flex-col items-center gap-0">
                  {section.units.map((unit, unitIndex) => {
                    const status = getNodeStatus(sectionIndex, unitIndex);
                    const isLast = unitIndex === section.units.length - 1;

                    return (
                      <RoadmapNode
                        key={`${sectionIndex}-${unitIndex}`}
                        unitType={unit.type}
                        unitName={
                          unit.plan?.instructions?.slice(0, 40) ?? unit.type
                        }
                        status={status}
                        isLast={isLast}
                        onClick={() =>
                          handleNodeClick(sectionIndex, unitIndex, status)
                        }
                      />
                    );
                  })}
                </div>

                {/* Section connector */}
                {sectionIndex < lessonData.sections.length - 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-1 h-3 bg-zinc-300" />
                      <div className="w-3 h-3 bg-zinc-300 rotate-45" />
                      <div className="w-1 h-3 bg-zinc-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* End of lesson marker */}
          <div className="flex justify-center pt-4 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-bauhaus-red" />
              <div className="w-3 h-3 bg-bauhaus-blue" />
              <div className="w-3 h-3 bg-bauhaus-green" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

