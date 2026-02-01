import { useState, useMemo } from "react";
import type { CGOutput, ConversationUnit } from "@shared";
import SelectableText from "../../components/ui/SelectableText";
import { DEMO_KNOWN_VOCAB } from "../../constants/vocab";
import { RedoButton } from "../../components/ui/RedoButton";

interface Message {
  speaker: string;
  text: string;
}

interface ConversationProps {
  data: CGOutput;
  plan: ConversationUnit;
  onComplete: () => void;
}

// Assign consistent colors to speakers
const SPEAKER_COLORS = [
  {
    bg: "bg-bauhaus-blue",
    text: "text-white",
    bubble: "bg-blue-50",
    border: "border-bauhaus-blue",
  },
  {
    bg: "bg-bauhaus-red",
    text: "text-white",
    bubble: "bg-rose-50",
    border: "border-bauhaus-red",
  },
  {
    bg: "bg-bauhaus-green",
    text: "text-white",
    bubble: "bg-emerald-50",
    border: "border-bauhaus-green",
  },
  {
    bg: "bg-zinc-700",
    text: "text-white",
    bubble: "bg-zinc-100",
    border: "border-zinc-700",
  },
];

export default function Conversation({
  data,
  plan,
  onComplete,
}: ConversationProps) {
  const [visibleCount, setVisibleCount] = useState(1);

  // Parse conversation string into messages
  const messages = useMemo((): Message[] => {
    const lines = data.conversation.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      // Format: **Name**: Dialogue or Name: Dialogue
      const match = line.match(/^\*?\*?([^*:]+)\*?\*?:\s*(.+)$/);
      if (match) {
        return { speaker: match[1].trim(), text: match[2].trim() };
      }
      // Fallback for lines without speaker format
      return { speaker: "Unknown", text: line.trim() };
    });
  }, [data.conversation]);

  // Map speakers to colors
  const speakerColorMap = useMemo(() => {
    const map = new Map<string, (typeof SPEAKER_COLORS)[0]>();
    const uniqueSpeakers = [...new Set(messages.map((m) => m.speaker))];
    uniqueSpeakers.forEach((speaker, index) => {
      map.set(speaker, SPEAKER_COLORS[index % SPEAKER_COLORS.length]);
    });
    return map;
  }, [messages]);

  // Get the first speaker for left-alignment reference
  const firstSpeaker = messages[0]?.speaker;

  const handleRevealNext = () => {
    if (visibleCount < messages.length) {
      setVisibleCount((prev) => prev + 1);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  const allRevealed = visibleCount >= messages.length;

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-rose-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              CONVO<span className="text-bauhaus-blue">.</span>
            </h1>
          </div>

          {/* Character avatars */}
          <div className="flex gap-2">
            {data.characters.map((char, index) => {
              const colors = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
              return (
                <div
                  key={char.name}
                  className={`${colors.bg} ${colors.text} px-3 py-1 border-2 border-black text-sm font-bold`}
                  title={`${char.name} (${char.age}, ${char.gender})`}
                >
                  {char.name}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-hidden">
        <div className="flex-1 bg-white border-2 border-black bauhaus-shadow flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.slice(0, visibleCount).map((msg, index) => {
              const colors = speakerColorMap.get(msg.speaker)!;
              const isLeft = msg.speaker === firstSpeaker;

              return (
                <div
                  key={index}
                  className={`flex ${
                    isLeft ? "justify-start" : "justify-end"
                  } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`max-w-[75%] ${isLeft ? "" : ""}`}>
                    {/* Speaker name */}
                    <div
                      className={`text-xs font-bold tracking-widest uppercase mb-1 ${
                        isLeft ? "text-left" : "text-right"
                      }`}
                    >
                      <span
                        className={`${colors.bg} ${colors.text} px-2 py-0.5 inline-block`}
                      >
                        {msg.speaker}
                      </span>
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`
                        p-4 border-2 ${colors.border} ${colors.bubble}
                        ${isLeft ? "border-l-4" : "border-r-4"}
                      `}
                    >
                      <SelectableText
                        text={msg.text}
                        knownVocab={DEMO_KNOWN_VOCAB}
                        sourceLanguage="Spanish"
                        targetLanguage="English"
                        textSize="text-base"
                        className="text-start"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator when more messages to reveal */}
            {!allRevealed && (
              <div
                className={`flex ${
                  messages[visibleCount]?.speaker === firstSpeaker
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div className="px-4 py-3 border-2 border-zinc-300 bg-zinc-50">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-zinc-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-end gap-4">
          {!allRevealed ? (
            <button
              onClick={handleRevealNext}
              className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow
                transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Next Message →
            </button>
          ) : (
            <>
              <RedoButton
                unitPlan={plan}
                onRedo={() => setVisibleCount(1)}
              />
              <button
                onClick={handleContinue}
                className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
                  bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
                  transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Continue →
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
