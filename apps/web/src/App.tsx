import { useState } from "react";
import "./App.css";
import type { SectionedLesson } from "@shared";
import { LessonPlayer } from "./components/lesson";
import { useSectionedLessonStore } from "./stores/useSectionedLessonStore";
import { useRoadmapStore } from "./stores/useRoadmapStore";
import { useDailyLoopStore } from "./stores/useDailyLoopStore";
import Roadmap from "./features/roadmap/Roadmap";
import DailyLoopHome from "./features/daily-loop/DailyLoopHome";
import DailyTaskPlayer from "./features/daily-loop/DailyTaskPlayer";

type AppView = "daily-loop" | "daily-task" | "roadmap" | "roadmap-lesson";

function App() {
  const [view, setView] = useState<AppView>("daily-loop");

  // Stores
  const sectionedStore = useSectionedLessonStore();
  const roadmapStore = useRoadmapStore();
  const dailyLoopStore = useDailyLoopStore();

  // ====================================================================
  // DAILY LOOP HANDLERS
  // ====================================================================

  const handleOpenRoadmap = () => {
    setView("roadmap");
  };

  const handleBackToDailyLoop = () => {
    sectionedStore.reset();
    roadmapStore.clearSelectedLesson();
    dailyLoopStore.goHome();
    setView("daily-loop");
  };

  // ====================================================================
  // ROADMAP HANDLERS
  // ====================================================================

  const handleRoadmapLessonSelect = async (
    monthIndex: number,
    weekIndex: number,
    lessonIndex: number
  ) => {
    roadmapStore.selectLesson(monthIndex, weekIndex, lessonIndex);

    const lessonContext = roadmapStore.buildStructuredLessonContext();
    if (!lessonContext) return;

    sectionedStore.setStatus("generating");
    sectionedStore.setGenerationProgress(null);
    setView("roadmap-lesson");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/lessons/create-structured-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lessonContext),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate lesson");
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
          if (payload === "[DONE]") continue;

          try {
            const event = JSON.parse(payload);

            if (event.type === "progress") {
              sectionedStore.setGenerationProgress({
                stage: event.stage,
                message: event.message,
                current: event.current,
                total: event.total,
              });
            }

            if (event.type === "result") {
              const data = event.data;
              sectionedStore.setLesson(data.lesson ?? data);
            }

            if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate lesson:", error);
      sectionedStore.setStatus("idle");
      sectionedStore.setGenerationProgress(null);
      setView("roadmap");
    }
  };

  const handleRoadmapLessonComplete = () => {
    const selectedData = roadmapStore.getSelectedLessonData();
    if (selectedData) {
      roadmapStore.markLessonComplete(selectedData.lesson.globalLessonIndex);
    }
    roadmapStore.clearSelectedLesson();
    sectionedStore.reset();
    setView("roadmap");
  };

  const handleBackToRoadmap = () => {
    roadmapStore.clearSelectedLesson();
    sectionedStore.reset();
    setView("roadmap");
  };

  // ====================================================================
  // RENDER
  // ====================================================================

  // Daily loop home screen (default)
  if (view === "daily-loop") {
    // Check if the daily loop store says we're in a task
    const dailyView = dailyLoopStore.view;
    const currentTask = dailyLoopStore.getCurrentTask();

    if (dailyView === "task" && currentTask) {
      return <DailyTaskPlayer task={currentTask} />;
    }

    return <DailyLoopHome onOpenRoadmap={handleOpenRoadmap} />;
  }

  // Roadmap
  if (view === "roadmap") {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 left-4 z-20">
          <button
            onClick={handleBackToDailyLoop}
            className="px-4 py-2 bg-white border-2 border-black font-bold text-sm hover:bg-zinc-100 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Daily Loop
          </button>
        </div>
        <Roadmap onLessonSelect={handleRoadmapLessonSelect} />
      </div>
    );
  }

  // Roadmap lesson player
  if (view === "roadmap-lesson") {
    return (
      <div className="h-full">
        <LessonPlayer
          onClose={handleBackToRoadmap}
          onLessonComplete={handleRoadmapLessonComplete}
        />
      </div>
    );
  }

  // Fallback - daily loop
  return <DailyLoopHome onOpenRoadmap={handleOpenRoadmap} />;
}

export default App;
