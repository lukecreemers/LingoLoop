import type { CompiledUnit } from "@shared";

// Import all unit components
import Flashcard from "../../features/units/Flashcard";
import Explanation from "../../features/units/Explanation";
import FillInBlanks from "../../features/units/FillInBlanks";
import WriteInBlanks from "../../features/units/WriteInBlanks";
import WordMeaningMatch from "../../features/units/WordMeaningMatch";
import Translation from "../../features/units/Translation";
import Conversation from "../../features/units/Conversation";

interface UnitDispatcherProps {
  unit: CompiledUnit;
  onComplete: (result?: { score?: number; totalPossible?: number }) => void;
}

export default function UnitDispatcher({
  unit,
  onComplete,
}: UnitDispatcherProps) {
  // Dispatch based on unit type
  switch (unit.type) {
    case "flashcard":
      return (
        <Flashcard
          data={unit.output}
          plan={unit.plan}
          onComplete={() => onComplete()}
        />
      );

    case "explanation":
      return (
        <Explanation
          data={unit.output}
          plan={unit.plan}
          onComplete={() => onComplete()}
        />
      );

    case "fill in the blanks":
      return (
        <FillInBlanks
          data={unit.output}
          plan={unit.plan}
          onComplete={() => onComplete()}
        />
      );

    case "write in the blanks":
      return (
        <WriteInBlanks
          data={unit.output}
          plan={unit.plan}
          onComplete={() => onComplete()}
        />
      );

    case "word meaning match":
      return (
        <WordMeaningMatch
          data={unit.output}
          plan={unit.plan}
          onComplete={() => onComplete()}
        />
      );

    case "translation":
      return (
        <Translation
          data={unit.output}
          plan={unit.plan}
          onComplete={() => onComplete()}
        />
      );

    case "conversation":
      return (
        <Conversation
          data={unit.output}
          plan={unit.plan}
          onComplete={() => onComplete()}
        />
      );

    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-zinc-500">Unknown unit type</p>
        </div>
      );
  }
}
