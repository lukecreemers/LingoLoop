import { useRef, useEffect } from "react";

type SlotStatus = "empty" | "filled" | "correct" | "incorrect";

interface TextInputSlotProps {
  value: string;
  clue: string;
  status: SlotStatus;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function TextInputSlot({
  value,
  clue,
  status,
  onChange,
  disabled = false,
  autoFocus = false,
}: TextInputSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getSlotStyles = () => {
    if (status === "correct") {
      return "border-bauhaus-green bg-emerald-50 text-bauhaus-green";
    }
    if (status === "incorrect") {
      return "border-bauhaus-red bg-rose-50 text-bauhaus-red";
    }
    if (value) {
      return "border-bauhaus-blue bg-blue-50 text-bauhaus-black";
    }
    return "border-zinc-300 bg-zinc-50 text-bauhaus-black hover:border-zinc-400 focus-within:border-bauhaus-blue";
  };

  return (
    <div className="inline-flex flex-col items-center mx-2 align-bottom">
      {/* Input Field */}
      <div
        className={`
          inline-flex items-center justify-center min-w-[120px] h-12 px-3
          transition-all duration-200 border-b-4
          ${getSlotStyles()}
        `}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="..."
          className={`
            w-full bg-transparent text-center font-bold text-lg outline-none
            placeholder:text-zinc-300 placeholder:font-normal
            ${disabled ? "cursor-not-allowed" : ""}
          `}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
      
      {/* Clue Label */}
      <span className="text-xs font-mono text-zinc-400 mt-1 select-none">
        {clue}
      </span>
    </div>
  );
}

