import { useState } from "react";

export interface CreateLessonFormData {
  userLevel: string;
  targetLanguage: string;
  nativeLanguage: string;
  lessonTitle: string;
  lessonDescription: string;
}

interface LessonCreatorProps {
  onSubmit: (formData: CreateLessonFormData) => void;
}

export default function LessonCreator({ onSubmit }: LessonCreatorProps) {
  const [formData, setFormData] = useState<CreateLessonFormData>({
    userLevel: "beginner",
    targetLanguage: "Spanish",
    nativeLanguage: "English",
    lessonTitle: "",
    lessonDescription: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

          {/* Lesson Title */}
          <div className="bg-white border-2 border-black p-4 bauhaus-shadow">
            <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">
              Lesson Title
            </label>
            <input
              type="text"
              value={formData.lessonTitle}
              onChange={(e) =>
                setFormData({ ...formData, lessonTitle: e.target.value })
              }
              placeholder="e.g., Common Greetings, Ordering Food, Past Tense Verbs..."
              className="w-full p-3 border-2 border-zinc-300 focus:border-black focus:outline-none"
              required
            />
          </div>

          {/* Lesson Description */}
          <div className="bg-white border-2 border-black p-4 bauhaus-shadow">
            <label className="block text-xs font-bold tracking-widest text-zinc-400 uppercase mb-2">
              What do you want to learn?
            </label>
            <textarea
              value={formData.lessonDescription}
              onChange={(e) =>
                setFormData({ ...formData, lessonDescription: e.target.value })
              }
              placeholder="Describe the focus of this lesson in detail. e.g., Learn how to greet people formally and informally, introduce yourself, and ask about someone's wellbeing..."
              rows={4}
              className="w-full p-3 border-2 border-zinc-300 focus:border-black focus:outline-none resize-none"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!formData.lessonTitle.trim() || !formData.lessonDescription.trim()}
            className={`
              w-full px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              ${
                !formData.lessonTitle.trim() || !formData.lessonDescription.trim()
                  ? "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                  : "bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow"
              }
            `}
          >
            Generate Lesson →
          </button>
        </form>
      </div>
    </div>
  );
}

