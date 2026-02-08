import { useState, useRef, useEffect, useCallback } from "react";
import { renderMarkdown } from "../../utils/renderMarkdown";
import { useAuthStore } from "../../stores/useAuthStore";

// ============================================================================
// TYPES
// ============================================================================

interface RoadmapOverviewTopic {
  title: string;
  description: string;
  concepts: string[];
}

interface RoadmapOverview {
  currentSnapshot: string;
  endGoalSnapshot: string;
  topicAreas: RoadmapOverviewTopic[];
  note?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  statusMessage?: string;
  roadmapOverview?: RoadmapOverview;
}

interface OnboardingChatProps {
  onComplete: (data: { courseId: string; userId: string }) => void;
}

// ============================================================================
// TOPIC COLORS
// ============================================================================

const TOPIC_COLORS = [
  { bg: "bg-rose-50", border: "border-rose-200", accent: "bg-rose-500", accentLight: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-400" },
  { bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500", accentLight: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" },
  { bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", accentLight: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-400" },
  { bg: "bg-sky-50", border: "border-sky-200", accent: "bg-sky-500", accentLight: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-400" },
  { bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-500", accentLight: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-400" },
  { bg: "bg-pink-50", border: "border-pink-200", accent: "bg-pink-500", accentLight: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-400" },
  { bg: "bg-teal-50", border: "border-teal-200", accent: "bg-teal-500", accentLight: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-400" },
  { bg: "bg-orange-50", border: "border-orange-200", accent: "bg-orange-500", accentLight: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-400" },
];

// ============================================================================
// ROADMAP OVERVIEW CARD
// ============================================================================

function RoadmapOverviewCard({ overview }: { overview: RoadmapOverview }) {
  return (
    <div className="my-4 border-2 border-black bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center">
            <span className="text-xl">🗺️</span>
          </div>
          <div>
            <h3 className="font-black text-lg tracking-tight">
              Your Learning Roadmap
            </h3>
            <p className="text-zinc-300 text-xs">
              Overview of topics &amp; concepts
            </p>
          </div>
        </div>
      </div>

      {/* Where you are now → Where you'll be */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-zinc-200">
        {/* Current */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center">
              <span className="text-xs">📍</span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Where you are now
            </h4>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {overview.currentSnapshot}
          </p>
        </div>

        {/* End goal */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🎯</span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              What you'll know by the end
            </h4>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {overview.endGoalSnapshot}
          </p>
        </div>
      </div>

      {/* Topic areas */}
      <div className="p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
          Topics &amp; Concepts You'll Cover
        </h4>

        <div className="space-y-3">
          {overview.topicAreas.map((topic, idx) => {
            const colors = TOPIC_COLORS[idx % TOPIC_COLORS.length];

            return (
              <div
                key={idx}
                className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
              >
                {/* Topic header */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-7 h-7 ${colors.accent} text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-sm`}
                  >
                    {idx + 1}
                  </div>
                  <h5 className={`font-bold ${colors.text}`}>
                    {topic.title}
                  </h5>
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-600 mb-3 ml-[38px]">
                  {topic.description}
                </p>

                {/* Concepts as pills */}
                <div className="flex flex-wrap gap-1.5 ml-[38px]">
                  {topic.concepts.map((concept) => (
                    <span
                      key={concept}
                      className={`text-xs ${colors.accentLight} ${colors.text} px-2.5 py-1 rounded-full font-medium`}
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      {overview.note && (
        <div className="px-5 pb-4">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="text-sm shrink-0">💡</span>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {overview.note}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnboardingChat({ onComplete }: OnboardingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingRef = useRef(false);
  const hasInitialized = useRef(false);

  // Track userId/courseId across the session
  const sessionRef = useRef<{ userId?: string; courseId?: string }>({});

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  // Shared SSE streaming logic
  const streamMessage = useCallback(
    async (userMessage: string, chatHistory: ChatMessage[]) => {
      if (streamingRef.current) return;
      streamingRef.current = true;

      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);

      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000";

        const history = chatHistory
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
          .filter((m) => m.content.length > 0);

        const token = useAuthStore.getState().token;
        const response = await fetch(`${apiUrl}/onboarding/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userMessage,
            chatHistory: history,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`${response.status} ${errText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (!reader) throw new Error("No response body");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const event = JSON.parse(payload);

              if (event.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: m.content + event.content,
                          statusMessage: undefined,
                        }
                      : m
                  )
                );
              }

              if (event.status) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, statusMessage: event.status }
                      : m
                  )
                );
              }

              if (event.roadmap_overview) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, roadmapOverview: event.overview, statusMessage: undefined }
                      : m
                  )
                );
              }

              if (event.onboarding_complete) {
                sessionRef.current.courseId = event.courseId;
                sessionRef.current.userId = event.userId;
                // Small delay so the user sees the final message
                setTimeout(() => {
                  onComplete({
                    courseId: event.courseId,
                    userId: event.userId,
                  });
                }, 3000);
              }

              if (event.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content:
                            m.content + `\n\nSomething went wrong: ${event.error}`,
                        }
                      : m
                  )
                );
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, I couldn't connect to the server. Please try again.",
                }
              : m
          )
        );
        console.error("Onboarding chat error:", error);
      } finally {
        streamingRef.current = false;
        setIsStreaming(false);
        setIsInitializing(false);
      }
    },
    [onComplete]
  );

  // Auto-send initial greeting on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Trigger the first agent response with a greeting
    streamMessage("Hello! I'd like to start learning a new language.", []);
  }, [streamMessage]);

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || streamingRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Pass current messages + new user message as history
    const currentMessages = [...messages, userMsg];
    await streamMessage(userMessage, currentMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bauhaus-white">
      {/* Header */}
      <div className="border-b-2 border-black bg-white px-6 py-4 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-bauhaus-red border-2 border-black bauhaus-shadow flex items-center justify-center text-white font-black text-lg">
          M
        </div>
        <div>
          <h1 className="font-black text-lg tracking-tight leading-none">
            Meet <span className="text-bauhaus-red">Maestro</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Your personal language coach
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bauhaus-red/10 border border-bauhaus-red/20 rounded-full">
            <div className="w-2 h-2 bg-bauhaus-red rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-bauhaus-red">
              Setting up your journey
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isInitializing && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center py-2 mb-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-bauhaus-red rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <p className="text-zinc-500 text-sm">
                Maestro is preparing your welcome...
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isLastAssistant =
            msg.role === "assistant" &&
            msg.id === messages[messages.length - 1]?.id;
          const showCursor =
            isStreaming && isLastAssistant && msg.content.length > 0;

          return (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex items-start gap-3 p-4 bg-bauhaus-blue/5 border-l-4 border-bauhaus-blue">
                  <div className="shrink-0 w-8 h-8 bg-bauhaus-blue text-white flex items-center justify-center font-bold text-sm">
                    U
                  </div>
                  <p className="text-lg font-medium text-bauhaus-blue pt-1">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {msg.content ? (
                    <article className="prose-custom text-start">
                      {renderMarkdown(msg.content)}
                      {showCursor && (
                        <span className="inline-block w-2 h-5 bg-bauhaus-red ml-1 animate-pulse" />
                      )}
                    </article>
                  ) : msg.statusMessage ? (
                    <div className="flex items-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 rounded">
                      <svg
                        className="w-4 h-4 animate-spin text-amber-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-amber-700">
                        {msg.statusMessage}
                      </span>
                    </div>
                  ) : isStreaming && isLastAssistant ? (
                    <div className="flex items-center gap-1 py-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {/* Roadmap overview custom component */}
                  {msg.roadmapOverview && (
                    <RoadmapOverviewCard overview={msg.roadmapOverview} />
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end bg-white border-2 border-black bauhaus-shadow">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              rows={1}
              className="flex-1 resize-none bg-transparent pl-4 pr-2 py-3 text-sm leading-6 focus:outline-none placeholder:text-zinc-400 min-h-[44px] max-h-[200px] overflow-y-auto"
              disabled={isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className={`m-1.5 p-2 border-2 border-black transition-all shrink-0 ${
                input.trim() && !isStreaming
                  ? "bg-bauhaus-red text-white hover:bg-red-700 active:translate-x-[1px] active:translate-y-[1px]"
                  : "bg-zinc-100 text-zinc-300 border-zinc-300 cursor-not-allowed"
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




