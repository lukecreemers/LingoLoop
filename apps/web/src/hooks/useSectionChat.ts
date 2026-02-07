import { useState, useCallback, useRef } from "react";
import type { CompiledSection } from "@shared";
import type { GenerationProgress } from "../stores/useSectionedLessonStore";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseSectionChatOptions {
  sectionContext: string;
  lessonPlanContext: string;
  targetLanguage?: string;
  nativeLanguage?: string;
  userLevel?: string;
}

interface UseSectionChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isGeneratingUnits: boolean;
  generationProgress: GenerationProgress | null;
  error: string | null;
  extraSections: CompiledSection[] | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  clearExtraSections: () => void;
}

export function useSectionChat({
  sectionContext,
  lessonPlanContext,
  targetLanguage = "Spanish",
  nativeLanguage = "English",
  userLevel = "beginner",
}: UseSectionChatOptions): UseSectionChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingUnits, setIsGeneratingUnits] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extraSections, setExtraSections] = useState<CompiledSection[] | null>(
    null
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isStreaming) return;

      // Cancel any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setError(null);
      setIsStreaming(true);
      setIsGeneratingUnits(false);
      setGenerationProgress(null);

      // Add user message immediately
      const userMessage: ChatMessage = { role: "user", content: message };
      setMessages((prev) => [...prev, userMessage]);

      // Add empty assistant message that we'll stream into
      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/ai-assist/section-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userMessage: message,
              targetLanguage,
              nativeLanguage,
              userLevel,
              sectionContext,
              lessonPlanContext,
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

                // Regular streamed text content
                if (parsed.content) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (
                      lastIndex >= 0 &&
                      updated[lastIndex].role === "assistant"
                    ) {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: updated[lastIndex].content + parsed.content,
                      };
                    }
                    return updated;
                  });
                }

                // Tool call notification — units are being generated
                if (parsed.tool_call) {
                  setIsGeneratingUnits(true);
                  setGenerationProgress({ stage: 'structure', message: 'Starting...' });
                }

                // Generation progress updates
                if (parsed.generation_progress) {
                  setGenerationProgress(parsed.generation_progress as GenerationProgress);
                }

                // Extra sections received from the pipeline
                if (parsed.extra_sections) {
                  const sections = parsed.extra_sections as CompiledSection[];
                  console.group("🔄 Extra Sections Generated (lesson-update-structure)");
                  sections.forEach((section: CompiledSection, i: number) => {
                    console.group(`Section ${i + 1}: ${section.sectionInstruction}`);
                    if (section.learningSummary) {
                      console.log("✨ Learning Summary:", section.learningSummary);
                    }
                    section.units.forEach((unit, j) => {
                      console.group(`Unit ${j + 1} [${unit.type}]`);
                      console.log("📥 Instructions:", unit.plan?.instructions);
                      console.log("📤 Output:", unit.output);
                      console.groupEnd();
                    });
                    console.groupEnd();
                  });
                  console.groupEnd();
                  setExtraSections(sections);
                  setIsGeneratingUnits(false);
                  setGenerationProgress(null);
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
          setError(
            err instanceof Error ? err.message : "Failed to send message"
          );
          // Remove the empty assistant message on error
          setMessages((prev) => prev.slice(0, -1));
        }
        setIsGeneratingUnits(false);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      sectionContext,
      lessonPlanContext,
      targetLanguage,
      nativeLanguage,
      userLevel,
      messages,
      isStreaming,
    ]
  );

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setIsGeneratingUnits(false);
    setGenerationProgress(null);
  }, []);

  const clearExtraSections = useCallback(() => {
    setExtraSections(null);
  }, []);

  return {
    messages,
    isStreaming,
    isGeneratingUnits,
    generationProgress,
    error,
    extraSections,
    sendMessage,
    clearChat,
    clearExtraSections,
  };
}

