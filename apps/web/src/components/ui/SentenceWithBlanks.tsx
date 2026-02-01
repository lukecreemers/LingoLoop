import { useMemo } from "react";
import DropSlot from "./DropSlot";

type SlotStatus = "empty" | "filled" | "correct" | "incorrect";

interface SentenceWithBlanksProps {
  template: string;
  filledAnswers: (string | null)[];
  slotStatuses: SlotStatus[];
  onDrop: (slotIndex: number, word: string) => void;
  onRemove: (slotIndex: number) => void;
  disabled?: boolean;
}

type SegmentPart = 
  | { type: "text"; content: string }
  | { type: "slot"; slotIndex: number };

export default function SentenceWithBlanks({
  template,
  filledAnswers,
  slotStatuses,
  onDrop,
  onRemove,
  disabled = false,
}: SentenceWithBlanksProps) {
  // Parse template into segments
  const segments = useMemo<SegmentPart[]>(() => {
    const parts = template.split("[*]");
    const result: SegmentPart[] = [];
    
    parts.forEach((part, index) => {
      if (part) {
        result.push({ type: "text", content: part });
      }
      if (index < parts.length - 1) {
        result.push({ type: "slot", slotIndex: index });
      }
    });
    
    return result;
  }, [template]);

  return (
    <div className="text-3xl leading-loose font-medium text-black flex flex-wrap items-center justify-start gap-y-4 font-sans tracking-tight">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {segment.content}
            </span>
          );
        }
        
        const { slotIndex } = segment;
        return (
          <DropSlot
            key={index}
            filledWord={filledAnswers[slotIndex]}
            status={slotStatuses[slotIndex]}
            onDrop={(word) => onDrop(slotIndex, word)}
            onRemove={() => onRemove(slotIndex)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}

