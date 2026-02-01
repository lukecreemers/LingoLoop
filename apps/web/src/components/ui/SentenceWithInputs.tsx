import { useMemo } from "react";
import TextInputSlot from "./TextInputSlot";
import SelectableText from "./SelectableText";
import { DEMO_KNOWN_VOCAB } from "../../constants/vocab";

type SlotStatus = "empty" | "filled" | "correct" | "incorrect";

interface BlankInfo {
  correctAnswer: string;
  clue: string;
  acceptedAlternates: string[];
}

interface SentenceWithInputsProps {
  template: string;
  blanks: BlankInfo[];
  filledAnswers: string[];
  slotStatuses: SlotStatus[];
  onChange: (slotIndex: number, value: string) => void;
  disabled?: boolean;
}

type SegmentPart =
  | { type: "text"; content: string }
  | { type: "slot"; slotIndex: number };

export default function SentenceWithInputs({
  template,
  blanks,
  filledAnswers,
  slotStatuses,
  onChange,
  disabled = false,
}: SentenceWithInputsProps) {
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
    <div className="text-3xl leading-loose font-medium text-black flex flex-wrap items-end justify-start gap-y-4 font-sans tracking-tight">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return (
            <SelectableText
              key={index}
              text={segment.content}
              knownVocab={DEMO_KNOWN_VOCAB}
              sourceLanguage="Spanish"
              targetLanguage="English"
              textSize="text-3xl"
              className="whitespace-pre-wrap"
            />
          );
        }

        const { slotIndex } = segment;
        const blank = blanks[slotIndex];
        
        return (
          <TextInputSlot
            key={index}
            value={filledAnswers[slotIndex] || ""}
            clue={blank?.clue || ""}
            status={slotStatuses[slotIndex]}
            onChange={(value) => onChange(slotIndex, value)}
            disabled={disabled}
            autoFocus={slotIndex === 0}
          />
        );
      })}
    </div>
  );
}

