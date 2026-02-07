import type { DailyTask } from "@shared";
import {
  useDailyLoopStore,
  useDailyTasks,
  useUserProfile,
  useDayNumber,
} from "../../stores/useDailyLoopStore";

// ============================================================================
// TASK CARD COLORS
// ============================================================================

const TASK_STYLES: Record<
  string,
  {
    gradient: string;
    border: string;
    iconBg: string;
    progressBar: string;
    tag: string;
    completedBg: string;
  }
> = {
  flashcards: {
    gradient: "from-purple-50 to-purple-100/50",
    border: "border-purple-200",
    iconBg: "bg-purple-500",
    progressBar: "bg-purple-500",
    tag: "bg-purple-100 text-purple-700",
    completedBg: "bg-purple-50",
  },
  custom_lesson: {
    gradient: "from-blue-50 to-blue-100/50",
    border: "border-blue-200",
    iconBg: "bg-blue-600",
    progressBar: "bg-blue-600",
    tag: "bg-blue-100 text-blue-700",
    completedBg: "bg-blue-50",
  },
  review: {
    gradient: "from-teal-50 to-teal-100/50",
    border: "border-teal-200",
    iconBg: "bg-teal-500",
    progressBar: "bg-teal-500",
    tag: "bg-teal-100 text-teal-700",
    completedBg: "bg-teal-50",
  },
  reading: {
    gradient: "from-amber-50 to-amber-100/50",
    border: "border-amber-200",
    iconBg: "bg-amber-500",
    progressBar: "bg-amber-500",
    tag: "bg-amber-100 text-amber-700",
    completedBg: "bg-amber-50",
  },
  writing: {
    gradient: "from-rose-50 to-rose-100/50",
    border: "border-rose-200",
    iconBg: "bg-rose-500",
    progressBar: "bg-rose-500",
    tag: "bg-rose-100 text-rose-700",
    completedBg: "bg-rose-50",
  },
};

// ============================================================================
// GREETING HELPER
// ============================================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ============================================================================
// TASK CARD
// ============================================================================

function TaskCard({
  task,
  isCompleted,
  onStart,
}: {
  task: DailyTask;
  isCompleted: boolean;
  onStart: () => void;
}) {
  const style = TASK_STYLES[task.type] ?? TASK_STYLES.custom_lesson;

  return (
    <button
      onClick={onStart}
      className={`
        w-full text-left transition-all duration-200
        border-2 ${style.border}
        ${
          isCompleted
            ? `${style.completedBg} opacity-80`
            : `bg-gradient-to-r ${style.gradient} hover:scale-[1.01] hover:shadow-md active:scale-[0.99]`
        }
      `}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Icon */}
        <div
          className={`w-12 h-12 ${style.iconBg} flex items-center justify-center shrink-0 ${
            isCompleted ? "opacity-60" : ""
          }`}
        >
          {isCompleted ? (
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <span className="text-2xl">{task.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3
              className={`font-bold text-base ${
                isCompleted ? "line-through text-zinc-400" : "text-zinc-900"
              }`}
            >
              {task.title}
            </h3>
            {isCompleted && (
              <span className="text-xs font-bold text-emerald-600">
                Done ✓
              </span>
            )}
          </div>
          <p
            className={`text-sm ${
              isCompleted ? "text-zinc-400" : "text-zinc-500"
            } truncate`}
          >
            {task.description}
          </p>
        </div>

        {/* Time estimate */}
        <div
          className={`text-right shrink-0 ${
            isCompleted ? "opacity-50" : ""
          }`}
        >
          <div className="text-sm font-bold text-zinc-600">
            {task.estimatedMinutes}m
          </div>
        </div>

        {/* Arrow */}
        {!isCompleted && (
          <svg
            className="w-5 h-5 text-zinc-400 shrink-0"
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
        )}
      </div>
    </button>
  );
}

// ============================================================================
// MAIN HOME SCREEN
// ============================================================================

interface DailyLoopHomeProps {
  onOpenRoadmap: () => void;
}

export default function DailyLoopHome({ onOpenRoadmap }: DailyLoopHomeProps) {
  const tasks = useDailyTasks();
  const userProfile = useUserProfile();
  const dayNumber = useDayNumber();
  const startTask = useDailyLoopStore((s) => s.startTask);
  const getTaskStatus = useDailyLoopStore((s) => s.getTaskStatus);
  const getCompletedCount = useDailyLoopStore((s) => s.getCompletedCount);
  const getTotalTasks = useDailyLoopStore((s) => s.getTotalTasks);
  const getProgressPercent = useDailyLoopStore((s) => s.getProgressPercent);

  const completedCount = getCompletedCount();
  const totalTasks = getTotalTasks();
  const progressPercent = getProgressPercent();
  const allCompleted = completedCount === totalTasks;

  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return (
    <div className="h-screen flex flex-col bg-bauhaus-white overflow-hidden">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <header className="shrink-0 bg-white border-b-2 border-zinc-200">
        <div className="max-w-2xl mx-auto px-6 pt-6 pb-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">
                Lingo<span className="text-bauhaus-blue">Loop</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-bold border border-zinc-200 rounded font-mono">
                {userProfile.targetLanguage}
              </span>
              <span className="px-2 py-1 text-xs font-bold border border-zinc-200 rounded font-mono">
                {userProfile.level}
              </span>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-4">
            <h2 className="text-3xl font-black tracking-tight">
              {getGreeting()}, {userProfile.name}
              <span className="text-bauhaus-blue">.</span>
            </h2>
            <p className="text-zinc-500 mt-1">
              Day {dayNumber} of your journey • ~{totalMinutes} min today
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Today's Progress
              </span>
              <span className="text-sm font-black">
                <span className="text-bauhaus-green">{completedCount}</span>
                <span className="text-zinc-300 mx-0.5">/</span>
                <span>{totalTasks}</span>
              </span>
            </div>
            <div className="h-3 bg-zinc-200 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-bauhaus-blue to-bauhaus-green transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {allCompleted && (
            <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-300 flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-emerald-700">
                  All tasks complete!
                </p>
                <p className="text-sm text-emerald-600">
                  Amazing work today. See you tomorrow!
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* TASK LIST */}
      {/* ============================================================ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {/* Section label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-bauhaus-blue" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Daily Tasks
            </span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Task cards */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const status = getTaskStatus(task.id);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleted={status === "completed"}
                  onStart={() => startTask(task.id)}
                />
              );
            })}
          </div>

          {/* ============================================================ */}
          {/* QUICK LINKS */}
          {/* ============================================================ */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-zinc-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Explore
              </span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onOpenRoadmap}
                className="p-4 border-2 border-zinc-200 bg-white hover:border-black hover:bauhaus-shadow
                  transition-all duration-150 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bauhaus-green flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">My Roadmap</h3>
                    <p className="text-xs text-zinc-500">
                      View full curriculum
                    </p>
                  </div>
                </div>
              </button>

              <button
                className="p-4 border-2 border-zinc-200 bg-white hover:border-black hover:bauhaus-shadow
                  transition-all duration-150 text-left group opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-400 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Settings</h3>
                    <p className="text-xs text-zinc-500">Coming soon</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}

