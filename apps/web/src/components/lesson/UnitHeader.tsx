import { useLessonProgress, useTotalScore } from "../../stores/useLessonStore";
import ProgressBar from "../ui/ProgressBar";

interface UnitHeaderProps {
  title: string;
  accentColor?: "red" | "blue" | "green";
  showScore?: boolean;
  showProgress?: boolean;
  onClose?: () => void;
}

const ACCENT_COLORS = {
  red: "text-bauhaus-red",
  blue: "text-bauhaus-blue",
  green: "text-bauhaus-green",
};

export default function UnitHeader({
  title,
  accentColor = "red",
  showScore = true,
  showProgress = true,
  onClose,
}: UnitHeaderProps) {
  const progress = useLessonProgress();
  const { score, total } = useTotalScore();

  return (
    <header className="px-8 pt-8 pb-4 max-w-3xl mx-auto w-full shrink-0">
      <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
        {/* Title */}
        <div className="flex items-center gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-zinc-100 transition-colors"
              aria-label="Close lesson"
            >
              <span className="text-xl font-bold">×</span>
            </button>
          )}
          <h1 className="text-4xl font-black tracking-tighter leading-none">
            {title}
            <span className={ACCENT_COLORS[accentColor]}>.</span>
          </h1>
        </div>

        {/* Score */}
        {showScore && total > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
              Total Score
            </span>
            <div className="text-2xl font-black font-mono tracking-tight">
              <span className="text-bauhaus-green">
                {score.toString().padStart(2, "0")}
              </span>
              <span className="text-zinc-300 mx-1">/</span>
              <span className="text-black">
                {total.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && progress.total > 0 && (
        <ProgressBar current={progress.current} total={progress.total} />
      )}
    </header>
  );
}

