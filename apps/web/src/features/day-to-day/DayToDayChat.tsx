import { useState, useRef, useEffect, useCallback } from "react";
import { renderMarkdown } from "../../utils/renderMarkdown";

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCall?: {
    name: string;
    input: Record<string, unknown>;
  };
  /** Transient status message shown during internal tool execution */
  statusMessage?: string;
}

// ============================================================================
// TOOL DISPLAY CONFIG
// ============================================================================

const TOOL_META: Record<
  string,
  { label: string; color: string; icon: string; description: string }
> = {
  create_custom_lesson: {
    label: "Create Custom Lesson",
    color: "bg-bauhaus-blue",
    icon: "📚",
    description: "Full structured lesson with exercises",
  },
  custom_drill_segment: {
    label: "Custom Drill",
    color: "bg-bauhaus-green",
    icon: "🎯",
    description: "Single focused exercise",
  },
  custom_drill_series: {
    label: "Drill Series",
    color: "bg-emerald-600",
    icon: "🔄",
    description: "Series of varied exercises",
  },
  restructure_roadmap: {
    label: "Restructure Roadmap",
    color: "bg-bauhaus-yellow",
    icon: "🗺️",
    description: "Change your learning curriculum",
  },
  restructure_daily_loop: {
    label: "Restructure Daily Loop",
    color: "bg-amber-500",
    icon: "📅",
    description: "Change daily practice activities (future)",
  },
  user_preferences: {
    label: "Update Preferences",
    color: "bg-bauhaus-red",
    icon: "⚙️",
    description: "Change learning preferences",
  },
};

// ============================================================================
// TOOL CALL CARD
// ============================================================================

function ToolCallCard({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}) {
  const meta = TOOL_META[name] ?? {
    label: name,
    color: "bg-zinc-600",
    icon: "🔧",
    description: "Tool call",
  };

  return (
    <div className="mt-3 border-2 border-black bauhaus-shadow bg-white overflow-hidden">
      {/* Header */}
      <div
        className={`${meta.color} text-white px-4 py-2 flex items-center gap-2`}
      >
        <span className="text-xl">{meta.icon}</span>
        <div>
          <div className="font-bold text-sm uppercase tracking-wide">
            Tool Call: {meta.label}
          </div>
          <div className="text-xs opacity-80">{meta.description}</div>
        </div>
      </div>

      {/* Body — render input fields */}
      <div className="p-4 space-y-3">
        {Object.entries(input).map(([key, value]) => (
          <div key={key}>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              {formatKey(key)}
            </div>
            <div className="text-sm bg-zinc-50 border border-zinc-200 rounded px-3 py-2 font-mono break-words whitespace-pre-wrap">
              {formatValue(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-100 border-t border-zinc-200 text-xs text-zinc-500 italic">
        ⚡ Tool not connected — displaying raw input from agent
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  return key.replace(/_/g, " ").replace(/([A-Z])/g, " $1");
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value, null, 2);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DayToDayChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Ref-based lock — prevents double-fire from React StrictMode or rapid clicks
  const streamingRef = useRef(false);

  // User context (hardcoded for testing — in production comes from user profile)
  const userContext = {
    userLevel: "beginner",
    targetLanguage: "Spanish",
    nativeLanguage: "English",
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea — grows upward as you type, caps at max
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || streamingRef.current) return;

    // Lock immediately via ref (synchronous — not batched like setState)
    streamingRef.current = true;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      // Build chat history — ensure no empty content messages (Anthropic rejects them)
      const chatHistory = messages
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content:
            m.content ||
            (m.toolCall ? `[Called tool: ${m.toolCall.name}]` : ""),
        }))
        .filter((m) => m.content.length > 0);

      const response = await fetch(`${apiUrl}/day-to-day/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          chatHistory,
          ...userContext,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status} ${errText}`);
      }

      // Read SSE stream
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
                        statusMessage: undefined, // clear status once content flows
                      }
                    : m,
                ),
              );
            }

            if (event.status) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, statusMessage: event.status }
                    : m,
                ),
              );
            }

            if (event.tool_call) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        toolCall: { name: event.name, input: event.input },
                      }
                    : m,
                ),
              );
            }

            if (event.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: m.content + `\n\n⚠️ Error: ${event.error}`,
                      }
                    : m,
                ),
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
          m.id === (Date.now() + 1).toString() || // fallback
          (m.role === "assistant" && m === prev[prev.length - 1])
            ? {
                ...m,
                content:
                  "Sorry, I couldn't connect to the server. Please try again.",
              }
            : m,
        ),
      );
      console.error("Chat error:", error);
    } finally {
      streamingRef.current = false;
      setIsStreaming(false);
    }
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
        <div className="w-10 h-10 bg-bauhaus-blue border-2 border-black bauhaus-shadow flex items-center justify-center text-white font-black text-lg">
          L
        </div>
        <div>
          <h1 className="font-black text-lg tracking-tight leading-none">
            Lingo<span className="text-bauhaus-blue">Loop</span>
          </h1>
          <p className="text-xs text-zinc-400">Your learning assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          <span className="px-2 py-1 border border-zinc-200 rounded font-mono">
            {userContext.targetLanguage}
          </span>
          <span className="px-2 py-1 border border-zinc-200 rounded font-mono">
            {userContext.userLevel}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-black mb-2">Hey there!</h2>
              <p className="text-zinc-500 mb-6">
                I'm your LingoLoop assistant. Chat with me about your learning,
                ask for practice, or tell me if something's not working for you.
              </p>
              <div className="grid grid-cols-2 gap-2 text-left">
                {[
                  { text: "Quiz me on verb conjugations", icon: "🎯" },
                  { text: "I want to learn food vocabulary", icon: "📚" },
                  { text: "My lessons are too easy", icon: "🗺️" },
                  { text: "Be less strict with accents", icon: "⚙️" },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => {
                      setInput(suggestion.text);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-2 text-xs border-2 border-zinc-200 rounded hover:border-black hover:bauhaus-shadow transition-all text-left flex items-center gap-2"
                  >
                    <span>{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
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
                /* User message — callout style matching Explanation */
                <div className="flex items-start gap-3 p-4 bg-bauhaus-blue/5 border-l-4 border-bauhaus-blue">
                  <div className="shrink-0 w-8 h-8 bg-bauhaus-blue text-white flex items-center justify-center font-bold text-sm">
                    U
                  </div>
                  <p className="text-lg font-medium text-bauhaus-blue pt-1">
                    {msg.content}
                  </p>
                </div>
              ) : (
                /* Assistant message */
                <div className="py-2">
                  {msg.content ? (
                    <article className="prose-custom text-start">
                      {renderMarkdown(msg.content)}
                      {showCursor && (
                        <span className="inline-block w-2 h-5 bg-bauhaus-blue ml-1 animate-pulse" />
                      )}
                    </article>
                  ) : msg.statusMessage ? (
                    /* Status indicator for internal tool execution */
                    <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                      <svg
                        className="w-4 h-4 animate-spin text-bauhaus-blue"
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
                      <span className="italic">{msg.statusMessage}</span>
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

                  {/* Tool call display */}
                  {msg.toolCall && (
                    <ToolCallCard
                      name={msg.toolCall.name}
                      input={msg.toolCall.input}
                    />
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
              placeholder="Ask me anything about your learning..."
              rows={1}
              className="flex-1 resize-none bg-transparent pl-4 pr-2 py-3 text-sm leading-6 focus:outline-none placeholder:text-zinc-400 min-h-[44px] max-h-[200px] overflow-y-auto"
              disabled={isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className={`m-1.5 p-2 border-2 border-black transition-all shrink-0 ${
                input.trim() && !isStreaming
                  ? "bg-bauhaus-blue text-white hover:bg-blue-700 active:translate-x-[1px] active:translate-y-[1px]"
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
