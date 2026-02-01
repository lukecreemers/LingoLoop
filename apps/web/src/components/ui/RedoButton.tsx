import { useState } from "react";
import { useRedoUnit } from "../../hooks/useRedoUnit";
import type { LessonPlanUnit } from "@shared";

interface RedoButtonProps {
  /** The unit plan to regenerate with */
  unitPlan: LessonPlanUnit;
  /** Called after successful regeneration */
  onRedo?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button to regenerate the current unit with different content
 */
export function RedoButton({ unitPlan, onRedo, className = "" }: RedoButtonProps) {
  const { redoUnit, isLoading, error } = useRedoUnit();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (showConfirm) {
      handleConfirm();
    } else {
      setShowConfirm(true);
    }
  };

  const handleConfirm = async () => {
    const result = await redoUnit(unitPlan);
    if (result) {
      setShowConfirm(false);
      onRedo?.();
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (error) {
    return (
      <div className={`text-sm text-bauhaus-red ${className}`}>
        {error}
        <button
          onClick={() => setShowConfirm(false)}
          className="ml-2 underline hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={`
          px-6 py-4 text-lg font-bold uppercase tracking-widest border-2 border-zinc-300
          bg-zinc-100 text-zinc-400 cursor-wait
          ${className}
        `}
      >
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          Generating...
        </span>
      </button>
    );
  }

  if (showConfirm) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-zinc-500">New exercises?</span>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 border-black
            bg-bauhaus-blue text-white hover:bg-blue-700
            transition-colors"
        >
          Yes
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-bold uppercase tracking-wider border-2 border-zinc-300
            bg-white text-zinc-600 hover:bg-zinc-100
            transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        px-6 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
        bg-white text-black hover:bg-zinc-100 bauhaus-shadow
        transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        ${className}
      `}
    >
      ↻ Try Different
    </button>
  );
}

export default RedoButton;

