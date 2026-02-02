import { useState, useCallback, useRef } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseExplanationChatOptions {
  explanationContext: string;
  targetLanguage?: string;
  nativeLanguage?: string;
}

interface UseExplanationChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => void;
}

export function useExplanationChat({
  explanationContext,
  targetLanguage = "Spanish",
  nativeLanguage = "English",
}: UseExplanationChatOptions): UseExplanationChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isStreaming) return;

      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setError(null);
      setIsStreaming(true);

      // Add user message immediately
      const userMessage: ChatMessage = { role: "user", content: question };
      setMessages((prev) => [...prev, userMessage]);

      // Add empty assistant message that we'll stream into
      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/ai-assist/explanation-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              explanationContext,
              userQuestion: question,
              targetLanguage,
              nativeLanguage,
              chatHistory: messages, // Send previous messages for context
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process SSE events
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.done) {
                  continue;
                }

                if (parsed.content) {
                  // Update the last message (assistant) with new content
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: updated[lastIndex].content + parsed.content,
                      };
                    }
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Request was cancelled, remove the empty assistant message
          setMessages((prev) => prev.slice(0, -1));
        } else {
          setError(err instanceof Error ? err.message : "Failed to send message");
          // Remove the empty assistant message on error
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [explanationContext, targetLanguage, nativeLanguage, messages, isStreaming]
  );

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
  };
}

