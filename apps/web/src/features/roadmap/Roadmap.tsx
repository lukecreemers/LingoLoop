import { useEffect, useState } from "react";
import {
  useRoadmapStore,
  useCurriculumMonths,
  useRoadmapProgress,
  type CurriculumMonth,
  type CurriculumWeek,
  type CurriculumLesson,
} from "../../stores/useRoadmapStore";

// Month colors for visual distinction
const MONTH_COLORS = [
  {
    bg: "bg-rose-50",
    border: "border-rose-300",
    accent: "bg-rose-500",
    text: "text-rose-700",
    light: "bg-rose-100",
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-300",
    accent: "bg-amber-500",
    text: "text-amber-700",
    light: "bg-amber-100",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    accent: "bg-emerald-500",
    text: "text-emerald-700",
    light: "bg-emerald-100",
  },
  {
    bg: "bg-sky-50",
    border: "border-sky-300",
    accent: "bg-sky-500",
    text: "text-sky-700",
    light: "bg-sky-100",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-300",
    accent: "bg-violet-500",
    text: "text-violet-700",
    light: "bg-violet-100",
  },
  {
    bg: "bg-pink-50",
    border: "border-pink-300",
    accent: "bg-pink-500",
    text: "text-pink-700",
    light: "bg-pink-100",
  },
];

interface RoadmapProps {
  onLessonSelect: (
    monthIndex: number,
    weekIndex: number,
    lessonIndex: number
  ) => void;
}

function LessonNodeComponent({
  lesson,
  isCompleted,
  monthColors,
  onSelect,
}: {
  lesson: CurriculumLesson;
  isCompleted: boolean;
  monthColors: (typeof MONTH_COLORS)[0];
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        group relative w-full p-3 rounded-lg border-2 transition-all duration-200
        hover:scale-[1.02] hover:shadow-md active:scale-[0.98] text-left
        ${
          isCompleted
            ? `${monthColors.light} ${monthColors.border} opacity-70`
            : `bg-white ${monthColors.border} hover:${monthColors.bg}`
        }
      `}
    >
      {/* Completion indicator */}
      {isCompleted && (
        <div
          className={`absolute -top-1 -right-1 w-5 h-5 ${monthColors.accent} rounded-full flex items-center justify-center`}
        >
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Lesson number badge */}
      <div
        className={`absolute -left-2 -top-2 w-6 h-6 ${monthColors.accent} text-white text-xs font-bold rounded-full flex items-center justify-center`}
      >
        {lesson.lessonIndex + 1}
      </div>

      {/* Lesson name */}
      <p
        className={`text-sm font-medium ${monthColors.text} pl-4 line-clamp-2`}
      >
        {lesson.name}
      </p>

      {/* Hover arrow */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg
          className={`w-4 h-4 ${monthColors.text}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}

function WeekCard({
  week,
  monthIndex,
  monthColors,
  isLessonCompleted,
  onLessonSelect,
}: {
  week: CurriculumWeek;
  monthIndex: number;
  monthColors: (typeof MONTH_COLORS)[0];
  isLessonCompleted: (idx: number) => boolean;
  onLessonSelect: (
    monthIndex: number,
    weekIndex: number,
    lessonIndex: number
  ) => void;
}) {
  const completedCount = week.lessons.filter((lesson) =>
    isLessonCompleted(lesson.globalLessonIndex)
  ).length;

  return (
    <div
      className={`${monthColors.bg} border-2 ${monthColors.border} rounded-xl p-4 shadow-sm`}
    >
      {/* Week Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 ${monthColors.accent} text-white font-bold rounded-lg flex items-center justify-center text-sm`}
          >
            W{week.weekIndex + 1}
          </div>
          <div>
            <h3 className={`font-bold ${monthColors.text}`}>{week.name}</h3>
            <p className="text-xs text-zinc-500">
              {completedCount}/{week.lessons.length} lessons
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-zinc-200"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(completedCount / week.lessons.length) * 100} 100`}
              className={monthColors.text}
              strokeLinecap="round"
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${monthColors.text}`}
          >
            {Math.round((completedCount / week.lessons.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Week description */}
      <p className="text-xs text-zinc-600 mb-3 line-clamp-2">
        {week.description}
      </p>

      {/* Lessons Grid */}
      <div className="grid gap-2">
        {week.lessons.map((lesson) => (
          <LessonNodeComponent
            key={lesson.globalLessonIndex}
            lesson={lesson}
            isCompleted={isLessonCompleted(lesson.globalLessonIndex)}
            monthColors={monthColors}
            onSelect={() =>
              onLessonSelect(monthIndex, week.weekIndex, lesson.lessonIndex)
            }
          />
        ))}
      </div>
    </div>
  );
}

function MonthSection({
  month,
  isLessonCompleted,
  onLessonSelect,
}: {
  month: CurriculumMonth;
  isLessonCompleted: (idx: number) => boolean;
  onLessonSelect: (
    monthIndex: number,
    weekIndex: number,
    lessonIndex: number
  ) => void;
}) {
  const colors = MONTH_COLORS[month.monthIndex % MONTH_COLORS.length];

  return (
    <div className="mb-12">
      {/* Month Header */}
      <div
        className={`mb-6 p-4 rounded-xl ${colors.bg} border-2 ${colors.border}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-12 h-12 ${colors.accent} text-white font-black text-lg rounded-xl flex items-center justify-center`}
          >
            M{month.monthIndex + 1}
          </div>
          <div>
            <h2 className={`text-2xl font-black ${colors.text}`}>
              {month.name}
            </h2>
            <p className="text-sm text-zinc-600">
              {month.weeks.length} weeks •{" "}
              {month.weeks.reduce((acc, w) => acc + w.lessons.length, 0)}{" "}
              lessons
            </p>
          </div>
        </div>
        <p className="text-sm text-zinc-600 mt-2">{month.description}</p>
      </div>

      {/* Weeks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {month.weeks.map((week) => (
          <WeekCard
            key={week.globalWeekIndex}
            week={week}
            monthIndex={month.monthIndex}
            monthColors={colors}
            isLessonCompleted={isLessonCompleted}
            onLessonSelect={onLessonSelect}
          />
        ))}
      </div>
    </div>
  );
}

function CurriculumGenerator() {
  const [userGoal, setUserGoal] = useState("");
  const generateCurriculum = useRoadmapStore((s) => s.generateCurriculum);
  const status = useRoadmapStore((s) => s.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGoal.trim()) return;
    await generateCurriculum(userGoal);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Create Your <span className="text-bauhaus-blue">Learning Path</span>
          </h1>
          <p className="text-zinc-500">
            Tell us your goal and we'll create a personalized curriculum
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border-2 border-black p-6 rounded-xl shadow-lg">
            <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">
              What's your language learning goal?
            </label>
            <textarea
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="e.g., I am currently B1 and want to get to B2 Spanish in around 3 months. I want it to be fun and interesting. I am using this with the goal to move to Spain and be able to talk to people..."
              rows={6}
              className="w-full p-4 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none resize-none text-base"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "generating" || !userGoal.trim()}
            className={`
              w-full px-10 py-5 text-lg font-bold uppercase tracking-widest border-2 border-black rounded-xl
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              ${
                status === "generating" || !userGoal.trim()
                  ? "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                  : "bg-bauhaus-green text-white hover:bg-emerald-700 shadow-lg"
              }
            `}
          >
            {status === "generating" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="ml-2">Generating your curriculum...</span>
              </span>
            ) : (
              "Generate My Curriculum →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Roadmap({ onLessonSelect }: RoadmapProps) {
  const fetchCurriculum = useRoadmapStore((s) => s.fetchCurriculum);
  const status = useRoadmapStore((s) => s.status);
  const error = useRoadmapStore((s) => s.error);
  const curriculum = useRoadmapStore((s) => s.curriculum);
  const isLessonCompleted = useRoadmapStore((s) => s.isLessonCompleted);
  const months = useCurriculumMonths();
  const progress = useRoadmapProgress();

  // Fetch curriculum on mount
  useEffect(() => {
    if (status === "idle") {
      fetchCurriculum();
    }
  }, [status, fetchCurriculum]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-bauhaus-blue rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-zinc-500">Loading your curriculum...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-2">Oops!</h2>
          <p className="text-zinc-500 mb-4">{error}</p>
          <button
            onClick={() => fetchCurriculum()}
            className="px-6 py-2 bg-bauhaus-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No curriculum - show generator
  if (!curriculum || months.length === 0) {
    return <CurriculumGenerator />;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b-2 border-zinc-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Your <span className="text-bauhaus-blue">Curriculum</span>
              </h1>
              <p className="text-zinc-500 text-sm line-clamp-1 max-w-md">
                {curriculum.userGoal.slice(0, 60)}...
              </p>
            </div>

            {/* Progress Overview */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-black text-bauhaus-blue">
                  {progress.percentage}%
                </p>
                <p className="text-xs text-zinc-500">
                  {progress.completed}/{progress.total} lessons
                </p>
              </div>
              <div className="w-32 h-3 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-bauhaus-blue to-bauhaus-green transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {months.map((month) => (
          <MonthSection
            key={month.monthIndex}
            month={month}
            isLessonCompleted={isLessonCompleted}
            onLessonSelect={onLessonSelect}
          />
        ))}
      </main>
    </div>
  );
}
