import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { CGOutput, LessonPlanUnit } from "@shared";
import SelectableText from "../../components/ui/SelectableText";
import { DEMO_KNOWN_VOCAB } from "../../constants/vocab";
import { RedoButton } from "../../components/ui/RedoButton";
import {
  useTTS,
  getVoiceForCharacter,
  preloadTTS,
  type TTSVoice,
} from "../../hooks/useTTS";

interface Message {
  speaker: string;
  text: string;
}

interface ConversationProps {
  data: CGOutput;
  plan: LessonPlanUnit;
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

// Speaker icon for replay button
function SpeakerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

// Loading spinner
function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function Conversation({
  data,
  plan,
  onComplete,
}: ConversationProps) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [preloadProgress, setPreloadProgress] = useState({
    loaded: 0,
    total: 0,
  });
  const { speak, stop, isPlaying, isLoading } = useTTS();

  // Parse conversation string into messages
  const messages = useMemo((): Message[] => {
    const lines = data.conversation.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      // Format: **Name**: Dialogue or Name: Dialogue
      // First strip any leading ** and match the pattern
      const cleanLine = line.replace(/^\*\*/, "");
      const match = cleanLine.match(/^([^*:]+?)(?:\*\*)?:\s*(.+)$/);
      if (match) {
        // Also clean any remaining ** from the text
        const text = match[2]
          .trim()
          .replace(/^\*\*\s*/, "")
          .replace(/\s*\*\*$/, "");
        return { speaker: match[1].trim(), text };
      }
      // Fallback for lines without speaker format
      return { speaker: "Unknown", text: line.trim().replace(/\*\*/g, "") };
    });
  }, [data.conversation]);

  // Map speakers to voices
  const speakerVoiceMap = useMemo(() => {
    const map = new Map<string, TTSVoice>();
    data.characters.forEach((char) => {
      map.set(char.name, getVoiceForCharacter(char));
    });
    return map;
  }, [data.characters]);

  // Map speakers to colors
  const speakerColorMap = useMemo(() => {
    const map = new Map<string, (typeof SPEAKER_COLORS)[0]>();
    const uniqueSpeakers = [...new Set(messages.map((m) => m.speaker))];
    uniqueSpeakers.forEach((speaker, index) => {
      map.set(speaker, SPEAKER_COLORS[index % SPEAKER_COLORS.length]);
    });
    return map;
  }, [messages]);

  // Preload TTS for all messages on mount
  useEffect(() => {
    const messagesWithVoices = messages.map((msg) => ({
      text: msg.text,
      voice: speakerVoiceMap.get(msg.speaker) || ("ef_dora" as TTSVoice),
    }));
    setPreloadProgress({ loaded: 0, total: messagesWithVoices.length });
    preloadTTS(messagesWithVoices, (loaded, total) => {
      setPreloadProgress({ loaded, total });
    });
  }, [messages, speakerVoiceMap]);

  const isPreloading =
    preloadProgress.total > 0 && preloadProgress.loaded < preloadProgress.total;

  // Get the first speaker for left-alignment reference
  const firstSpeaker = messages[0]?.speaker;

  // Track last played message to prevent double-plays
  const lastPlayedRef = useRef<number>(-1);
  const isPlayingRef = useRef(false);

  // Play TTS for a specific message
  const playMessage = useCallback(
    async (index: number, force = false) => {
      const msg = messages[index];
      if (!msg) return;

      // Prevent duplicate plays of the same message (unless forced)
      if (!force && lastPlayedRef.current === index && isPlayingRef.current) {
        return;
      }

      // Stop any currently playing audio first
      stop();

      const voice = speakerVoiceMap.get(msg.speaker) || "ef_dora";
      lastPlayedRef.current = index;
      isPlayingRef.current = true;
      setPlayingIndex(index);

      try {
        await speak(msg.text, { voice });
      } finally {
        isPlayingRef.current = false;
        setPlayingIndex(null);
      }
    },
    [messages, speakerVoiceMap, speak, stop]
  );

  // Auto-play the newest message when revealed
  useEffect(() => {
    if (visibleCount > 0) {
      const latestIndex = visibleCount - 1;
      // Only auto-play if this is a new message we haven't played yet
      if (lastPlayedRef.current !== latestIndex) {
        playMessage(latestIndex);
      }
    }
  }, [visibleCount, playMessage]);

  const handleRevealNext = () => {
    if (visibleCount < messages.length) {
      stop();
      setVisibleCount((prev) => prev + 1);
    }
  };

  const handleReplay = (index: number) => {
    // Force replay even if it's the same message
    playMessage(index, true);
  };

  const handleContinue = () => {
    stop();
    onComplete();
  };

  const handleRedo = () => {
    stop();
    setVisibleCount(1);
  };

  const allRevealed = visibleCount >= messages.length;
  const isCurrentlyPlaying = isPlaying || isLoading;

  return (
    <div className="h-[calc(100vh-50px)] bg-bauhaus-white text-black font-sans flex flex-col selection:bg-rose-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              CONVO<span className="text-bauhaus-blue">.</span>
            </h1>
            {/* Preloading indicator */}
            {isPreloading && (
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                <LoadingSpinner className="w-3 h-3" />
                <span>
                  Loading audio... {preloadProgress.loaded}/
                  {preloadProgress.total}
                </span>
              </div>
            )}
          </div>

          {/* Character avatars with voice indicators */}
          <div className="flex gap-2">
            {data.characters.map((char, index) => {
              const colors = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
              const voice = speakerVoiceMap.get(char.name);
              return (
                <div
                  key={char.name}
                  className={`${colors.bg} ${colors.text} px-3 py-1 border-2 border-black text-sm font-bold flex items-center gap-1`}
                  title={`${char.name} (${char.age}, ${char.gender}) - Voice: ${voice}`}
                >
                  {char.name}
                  <SpeakerIcon className="w-3 h-3 opacity-70" />
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
              const isThisPlaying =
                playingIndex === index && isCurrentlyPlaying;
              const isThisLoading = playingIndex === index && isLoading;

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

                    {/* Message bubble with replay button */}
                    <div
                      className={`
                        p-4 border-2 ${colors.border} ${
                        colors.bubble
                      } relative group
                        ${isLeft ? "border-l-4" : "border-r-4"}
                        ${
                          isThisPlaying
                            ? "ring-2 ring-bauhaus-blue ring-offset-1"
                            : ""
                        }
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

                      {/* Replay button */}
                      <button
                        onClick={() => handleReplay(index)}
                        disabled={isThisLoading}
                        className={`
                          absolute -bottom-3 ${isLeft ? "right-2" : "left-2"}
                          w-7 h-7 rounded-full border-2 border-black
                          flex items-center justify-center
                          transition-all duration-150
                          ${
                            isThisPlaying
                              ? "bg-bauhaus-blue text-white"
                              : "bg-white text-black hover:bg-zinc-100"
                          }
                          ${isThisLoading ? "cursor-wait" : "cursor-pointer"}
                          opacity-0 group-hover:opacity-100 focus:opacity-100
                          shadow-sm hover:shadow-md
                        `}
                        title="Replay audio"
                      >
                        {isThisLoading ? (
                          <LoadingSpinner className="w-4 h-4" />
                        ) : (
                          <SpeakerIcon className="w-4 h-4" />
                        )}
                      </button>
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
                onRedo={handleRedo}
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
