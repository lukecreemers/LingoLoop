import { useDrag } from "react-dnd";

export const WORD_CHIP_TYPE = "WORD_CHIP";

interface WordChipProps {
  word: string;
  isUsed?: boolean;
  isInSlot?: boolean;
  onRemove?: () => void;
}

export default function WordChip({
  word,
  isUsed = false,
  isInSlot = false,
  onRemove,
}: WordChipProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: WORD_CHIP_TYPE,
      item: { word },
      canDrag: !isUsed,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [word, isUsed]
  );

  // Ghost placeholder for used words
  if (isUsed && !isInSlot) {
    return (
      <div className="px-6 py-3 bg-zinc-100 text-zinc-300 border-2 border-zinc-200 select-none font-bold opacity-50">
        {word}
      </div>
    );
  }

  if (isInSlot) return null;

  return (
    <div
      ref={
        isUsed
          ? undefined
          : (drag as unknown as React.LegacyRef<HTMLDivElement>)
      }
      className={`
        px-6 py-3 font-bold text-lg select-none transition-all duration-200
        border-2 border-bauhaus-black bg-white text-bauhaus-black
        hover:bg-zinc-50 cursor-grab active:cursor-grabbing bauhaus-shadow 
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
    >
      {word}
    </div>
  );
}
