import { useMemo, useState, useRef, useEffect } from "react";
import type { EXOutput, LessonPlanUnit } from "@shared";
import { useExplanationChat } from "../../hooks/useExplanationChat";
import { renderMarkdown } from "../../utils/renderMarkdown";

interface ExplanationProps {
  data: EXOutput;
  plan: LessonPlanUnit;
  onComplete: () => void;
}
export default function Explanation({
  data,
  plan: _plan,
  onComplete,
}: ExplanationProps) {
  const [inputValue, setInputValue] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // data is now just a string (the markdown content directly)
  const renderedContent = useMemo(() => {
    return renderMarkdown(data);
  }, [data]);

  const { messages, isStreaming, error, sendMessage } = useExplanationChat({
    explanationContext: data,
    targetLanguage: "Spanish",
    nativeLanguage: "English",
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (contentRef.current && messages.length > 0) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  const handleContinue = () => {
    onComplete();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;
    const question = inputValue;
    setInputValue("");
    await sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full bg-bauhaus-white text-black font-sans flex flex-col selection:bg-yellow-200 overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-8 pb-4 w-full shrink-0">
        <div className="flex items-end justify-between mb-4 border-b-4 border-black pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              LEARN<span className="text-bauhaus-yellow">.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-bauhaus-yellow" />
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
              Concept Explanation
            </span>
          </div>
        </div>
      </header>

      {/* Explanation Content with integrated chat */}
      <main className="flex-1 w-full px-8 flex flex-col min-h-0 py-4 overflow-hidden">
        <div className="flex-1 bg-white border-2 border-black bauhaus-shadow flex flex-col overflow-hidden">
          {/* Scrollable Content Area */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto p-8"
          >
            {/* Decorative element */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-1 bg-bauhaus-yellow" />
              <div className="w-4 h-4 bg-bauhaus-blue rotate-45" />
            </div>

            {/* Main Explanation */}
            <article className="prose-custom text-start">
              {renderedContent}
            </article>

            {/* End marker */}
            <div className="flex justify-center mt-8 pt-6 border-t border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-bauhaus-yellow" />
                <div className="w-8 h-0.5 bg-black" />
                <div className="w-2 h-2 bg-bauhaus-blue" />
                <div className="w-8 h-0.5 bg-black" />
                <div className="w-2 h-2 bg-bauhaus-red" />
              </div>
            </div>

            {/* Chat Q&A Section - rendered inline below explanation */}
            {messages.length > 0 && (
              <div className="mt-8 space-y-6">
                {messages.map((msg, i) => {
                  const isLastAssistant =
                    msg.role === "assistant" && i === messages.length - 1;
                  const showCursor =
                    isStreaming && isLastAssistant && msg.content.length > 0;

                  return (
                    <div
                      key={i}
                      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      {msg.role === "user" ? (
                        // User question - styled as a callout
                        <div className="flex items-start gap-3 p-4 bg-bauhaus-blue/5 border-l-4 border-bauhaus-blue">
                          <div className="shrink-0 w-8 h-8 bg-bauhaus-blue text-white flex items-center justify-center font-bold text-sm">
                            Q
                          </div>
                          <p className="text-lg font-medium text-bauhaus-blue pt-1">
                            {msg.content}
                          </p>
                        </div>
                      ) : msg.content.length > 0 ? (
                        // Assistant answer - rendered in same style as explanation
                        <div className="pl-11">
                          <article className="prose-custom text-start">
                            {renderMarkdown(msg.content)}
                            {showCursor && (
                              <span className="inline-block w-2 h-5 bg-bauhaus-blue ml-1 animate-pulse" />
                            )}
                          </article>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Typing indicator — waiting for first streamed token */}
                {isStreaming &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role === "assistant" &&
                  messages[messages.length - 1].content === "" && (
                    <div className="pl-11 flex items-center gap-1 py-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  )}

                {error && (
                  <div className="text-red-500 text-sm pl-11">{error}</div>
                )}
              </div>
            )}
          </div>

          {/* Chat Input - Fixed at bottom of content box */}
          <div className="shrink-0 p-4 border-t-2 border-zinc-200 bg-zinc-50">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up question about this concept..."
                disabled={isStreaming}
                className="flex-1 px-4 py-3 border-2 border-black text-base focus:outline-none focus:ring-2 focus:ring-bauhaus-blue disabled:bg-zinc-100 disabled:text-zinc-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isStreaming}
                className="px-6 py-3 bg-bauhaus-blue text-white font-bold text-sm uppercase tracking-wider border-2 border-black
                  hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed
                  transition-colors flex items-center gap-2"
              >
                {isStreaming ? (
                  <svg
                    className="w-5 h-5 animate-spin"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                    </svg>
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="w-full flex justify-between items-center">
          <p className="text-sm text-zinc-400 italic">
            Ask questions above if anything is unclear
          </p>
          <button
            onClick={handleContinue}
            className="px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-bauhaus-yellow text-black hover:bg-amber-400 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Got It →
          </button>
        </div>
      </footer>
    </div>
  );
}
