import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore, useIsAuthenticated } from "./stores/useAuthStore";

// Auth pages
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";

// App pages
import OnboardingChat from "./features/onboarding/OnboardingChat";
import DailyLoopHome from "./features/daily-loop/DailyLoopHome";
import DailyTaskPlayer from "./features/daily-loop/DailyTaskPlayer";
import Roadmap from "./features/roadmap/Roadmap";
import { LessonPlayer } from "./components/lesson";

// Stores
import { useSectionedLessonStore } from "./stores/useSectionedLessonStore";
import { useRoadmapStore } from "./stores/useRoadmapStore";
import { useDailyLoopStore } from "./stores/useDailyLoopStore";

// ============================================================================
// PROTECTED ROUTE
// ============================================================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bauhaus-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-bauhaus-blue border-2 border-black bauhaus-shadow flex items-center justify-center text-white font-black text-2xl mx-auto mb-4">
            L
          </div>
          <h1 className="font-black text-2xl tracking-tight mb-2">
            Lingo<span className="text-bauhaus-blue">Loop</span>
          </h1>
          <div className="flex items-center gap-1 justify-center mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-bauhaus-blue rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// HOME PAGE — checks onboarding status
// ============================================================================

function HomePage() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const dailyLoopStore = useDailyLoopStore();
  const sectionedStore = useSectionedLessonStore();
  const roadmapStore = useRoadmapStore();

  // If not onboarded, redirect
  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      navigate("/onboarding", { replace: true });
    }
  }, [profile, navigate]);

  if (!profile?.onboardingCompleted) {
    return null;
  }

  // Check if the daily loop store says we're in a task
  const dailyView = dailyLoopStore.view;
  const currentTask = dailyLoopStore.getCurrentTask();

  if (dailyView === "task" && currentTask) {
    return <DailyTaskPlayer task={currentTask} />;
  }

  const handleOpenRoadmap = () => {
    navigate("/roadmap");
  };

  const handleBackToDailyLoop = () => {
    sectionedStore.reset();
    roadmapStore.clearSelectedLesson();
    dailyLoopStore.goHome();
  };

  return (
    <DailyLoopHome
      onOpenRoadmap={handleOpenRoadmap}
    />
  );
}

// ============================================================================
// ONBOARDING PAGE
// ============================================================================

function OnboardingPage() {
  const navigate = useNavigate();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const handleOnboardingComplete = async (_data: {
    courseId: string;
    userId: string;
  }) => {
    // Refresh profile to get updated onboardingCompleted status
    await fetchProfile();
    navigate("/", { replace: true });
  };

  return <OnboardingChat onComplete={handleOnboardingComplete} />;
}

// ============================================================================
// ROADMAP PAGE
// ============================================================================

function RoadmapPage() {
  const navigate = useNavigate();
  const roadmapStore = useRoadmapStore();
  const sectionedStore = useSectionedLessonStore();

  const handleBackToDailyLoop = () => {
    sectionedStore.reset();
    roadmapStore.clearSelectedLesson();
    navigate("/");
  };

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
    navigate("/roadmap/lesson");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${apiUrl}/lessons/create-structured-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
      navigate("/roadmap");
    }
  };

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

// ============================================================================
// ROADMAP LESSON PAGE
// ============================================================================

function RoadmapLessonPage() {
  const navigate = useNavigate();
  const roadmapStore = useRoadmapStore();
  const sectionedStore = useSectionedLessonStore();

  const handleBackToRoadmap = () => {
    roadmapStore.clearSelectedLesson();
    sectionedStore.reset();
    navigate("/roadmap");
  };

  const handleRoadmapLessonComplete = () => {
    const selectedData = roadmapStore.getSelectedLessonData();
    if (selectedData) {
      roadmapStore.markLessonComplete(selectedData.lesson.globalLessonIndex);
    }
    roadmapStore.clearSelectedLesson();
    sectionedStore.reset();
    navigate("/roadmap");
  };

  return (
    <div className="h-full">
      <LessonPlayer
        onClose={handleBackToRoadmap}
        onLessonComplete={handleRoadmapLessonComplete}
      />
    </div>
  );
}

// ============================================================================
// APP
// ============================================================================

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roadmap"
        element={
          <ProtectedRoute>
            <RoadmapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roadmap/lesson"
        element={
          <ProtectedRoute>
            <RoadmapLessonPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
