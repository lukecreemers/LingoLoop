import { useState } from "react";
import { useSectionedLessonStore } from "../../stores/useSectionedLessonStore";
import type { SectionedLesson } from "@shared";

interface LessonCreatorProps {
  onLessonCreated: () => void;
}

export default function LessonCreator({ onLessonCreated }: LessonCreatorProps) {
  const setLesson = useSectionedLessonStore((s) => s.setLesson);
  const setStatus = useSectionedLessonStore((s) => s.setStatus);

  const [formData, setFormData] = useState({
    userLevel: "beginner",
    targetLanguage: "Spanish",
    nativeLanguage: "English",
    instructions: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatus("generating");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/lessons/create-sectioned`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create lesson");
      }

      const result = await response.json();
      const lessonData = result.data as SectionedLesson;

      setLesson(lessonData);
      onLessonCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bauhaus-white flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Create Lesson<span className="text-bauhaus-blue">.</span>
          </h1>
          <p className="text-zinc-500">
            Tell Maestro what you want to learn today
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Level Select */}
          <div className="bg-white border-2 border-black p-4 bauhaus-shadow">
            <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">
              Your Level
            </label>
            <select
              value={formData.userLevel}
              onChange={(e) =>
                setFormData({ ...formData, userLevel: e.target.value })
              }
              className="w-full p-3 border-2 border-zinc-300 focus:border-black focus:outline-none text-lg"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Language Selects */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border-2 border-black p-4 bauhaus-shadow">
              <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">
                Learning
              </label>
              <select
                value={formData.targetLanguage}
                onChange={(e) =>
                  setFormData({ ...formData, targetLanguage: e.target.value })
                }
                className="w-full p-3 border-2 border-zinc-300 focus:border-black focus:outline-none"
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
              </select>
            </div>

            <div className="bg-white border-2 border-black p-4 bauhaus-shadow">
              <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">
                Native Language
              </label>
              <select
                value={formData.nativeLanguage}
                onChange={(e) =>
                  setFormData({ ...formData, nativeLanguage: e.target.value })
                }
                className="w-full p-3 border-2 border-zinc-300 focus:border-black focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white border-2 border-black p-4 bauhaus-shadow">
            <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">
              What do you want to learn?
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder="e.g., Common greetings and introductions, how to order food at a restaurant, past tense verbs..."
              rows={4}
              className="w-full p-3 border-2 border-zinc-300 focus:border-black focus:outline-none resize-none"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-50 border-2 border-bauhaus-red text-bauhaus-red">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !formData.instructions.trim()}
            className={`
              w-full px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              ${
                isLoading || !formData.instructions.trim()
                  ? "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                  : "bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow"
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-white animate-bounce" />
                <span
                  className="w-2 h-2 bg-white animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-white animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            ) : (
              "Generate Lesson →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

