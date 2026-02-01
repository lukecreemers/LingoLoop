import { useDrop } from "react-dnd";
import WordChip, { WORD_CHIP_TYPE } from "./WordChip";

type SlotStatus = "empty" | "filled" | "correct" | "incorrect";

interface DropSlotProps {
  filledWord: string | null;
  status: SlotStatus;
  onDrop: (word: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export default function DropSlot({
  filledWord,
  status,
  onDrop,
  onRemove,
  disabled = false,
}: DropSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: WORD_CHIP_TYPE,
      canDrop: () => !filledWord && !disabled,
      drop: (item: { word: string }) => {
        onDrop(item.word);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [filledWord, disabled, onDrop]
  );

  const getSlotStyles = () => {
    // Correct Answer
    if (status === "correct") {
      return "border-bauhaus-green bg-emerald-100 text-bauhaus-green";
    }
    // Incorrect Answer
    if (status === "incorrect") {
      return "border-bauhaus-red bg-rose-100 text-bauhaus-red";
    }
    // Drag Hover
    if (isOver && canDrop) {
      return "border-bauhaus-blue bg-blue-50";
    }
    // Default Empty/Filled state
    return "border-zinc-300 bg-zinc-50 hover:border-zinc-400";
  };

  return (
    <div
      ref={drop}
      className={`
        inline-flex items-center justify-center min-w-[120px] h-14 mx-2 px-4
        transition-all duration-200 align-middle
        border-b-4
        ${getSlotStyles()}
      `}
    >
      {filledWord ? (
        <div className="relative w-full text-center font-bold text-lg">
          <span 
            className={`cursor-pointer ${disabled ? '' : 'hover:opacity-70'}`}
            onClick={disabled ? undefined : onRemove}
          >
            {filledWord}
          </span>
        </div>
      ) : (
        <span className="text-zinc-300 font-bold select-none text-2xl tracking-widest">
          ...
        </span>
      )}
    </div>
  );
}
