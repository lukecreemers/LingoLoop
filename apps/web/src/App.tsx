import { useState } from "react";
import "./App.css";
import type { SectionedLesson } from "@shared";
import { LessonPlayer, LessonCreator } from "./components/lesson";
import type { CreateLessonFormData } from "./components/lesson/LessonCreator";
import { useSectionedLessonStore } from "./stores/useSectionedLessonStore";
import { useRoadmapStore } from "./stores/useRoadmapStore";
import Roadmap from "./features/roadmap/Roadmap";
import DayToDayChat from "./features/day-to-day/DayToDayChat";

// Demo lesson data for testing the lesson player (now in sectioned format)
const demoLessonData: SectionedLesson = {
  input: {
    instructions: "Learn basic Spanish introductions and greetings",
    userLevel: "beginner",
    targetLanguage: "Spanish",
    nativeLanguage: "English",
  },
  sectionInstructions: [
    "Introduction",
    "Learning Greetings & Introductions",
    "Practice & Review",
  ],
  sections: [
    {
      sectionInstruction: "Introduction",
      sectionIndex: 0,
      unitPlans: [
        {
          type: "context",
          instructions:
            "Introduce a lesson about basic Spanish greetings and introductions.",
        },
      ],
      units: [
        {
          type: "context",
          plan: {
            type: "context",
            instructions:
              "Introduce a lesson about basic Spanish greetings and introductions.",
          },
          output: `## Welcome to Your First Greetings Lesson!

Today, we're going to learn how to **introduce yourself in Spanish** and use common **greeting phrases**.

By the end of this lesson you'll be able to:
- Say hello and goodbye in Spanish
- Introduce yourself using **"Me llamo"** and **"Soy de"**
- Have a simple conversation when meeting someone new

We'll start with some vocabulary flashcards, then read an explanation, and finish with fun practice exercises. Let's get started!`,
        },
      ],
    },
    {
      sectionInstruction: "Learning Greetings & Introductions",
      sectionIndex: 1,
      unitPlans: [
        {
          type: "explanation",
          instructions:
            "Explain how to introduce yourself in Spanish, including key phrases like 'Me llamo', 'Soy de', and 'Mucho gusto'. Cover the reflexive verb 'llamarse'.",
        },
      ],
      units: [
        //         {
        //           type: "conversation",
        //           plan: {
        //             type: "conversation",
        //             instructions:
        //               "Create a conversation about two people meeting and introducing themselves. conversationLength: medium",
        //           },
        //           output: {
        //             characters: [
        //               { name: "María", age: "adult", gender: "female" },
        //               { name: "Juan", age: "adult", gender: "male" },
        //             ],
        //             conversation: `**María:** ¡Hola! Me llamo María. ¿Cómo te llamas?
        // **Juan:** Hola, María. Me llamo Juan. Mucho gusto.
        // **María:** Mucho gusto, Juan. Soy de México. ¿De dónde eres tú?
        // **Juan:** Soy de España, de Barcelona. ¿Vives aquí en la ciudad?
        // **María:** Sí, vivo aquí desde hace tres años. Trabajo en una empresa de tecnología.
        // **Juan:** ¡Qué interesante! Yo soy profesor de español en la universidad.`,
        //           },
        //         },
        //         {
        //           type: "flashcard",
        //           plan: {
        //             type: "flashcard",
        //             instructions:
        //               "Basic greeting vocabulary for introductions. cardCount: 6",
        //           },
        //           output: {
        //             theme: "Greetings & Introductions",
        //             cards: [
        //               {
        //                 term: "Hola",
        //                 definition: "Hello / Hi",
        //                 example: "¡Hola! ¿Cómo estás?",
        //                 exampleTranslation: "Hello! How are you?",
        //               },
        //               {
        //                 term: "Me llamo",
        //                 definition: "My name is (lit. I call myself)",
        //                 example: "Me llamo María.",
        //                 exampleTranslation: "My name is María.",
        //               },
        //               {
        //                 term: "Mucho gusto",
        //                 definition: "Nice to meet you (lit. Much pleasure)",
        //                 example: "Mucho gusto, Juan.",
        //                 exampleTranslation: "Nice to meet you, Juan.",
        //               },
        //               {
        //                 term: "¿Cómo te llamas?",
        //                 definition: "What's your name? (informal)",
        //                 example: "¡Hola! ¿Cómo te llamas?",
        //                 exampleTranslation: "Hello! What's your name?",
        //               },
        //             ],
        //           },
        //         },
        {
          type: "explanation",
          plan: {
            type: "explanation",
            instructions:
              "Explain how to introduce yourself in Spanish, including key phrases like 'Me llamo', 'Soy de', and 'Mucho gusto'. Cover the reflexive verb 'llamarse'.",
          },
          output: `## Introducing Yourself in Spanish

When meeting someone new in Spanish, you'll need to know how to say your name and ask about theirs.

### Key Phrases

- **Me llamo...** — "My name is..." (literally: "I call myself...")
- **Soy de...** — "I'm from..."
- **Mucho gusto** — "Nice to meet you"

### The Verb "Llamarse"

This is a **reflexive verb**, which means it includes a pronoun that refers back to the subject:

\`\`\`
Yo me llamo María
Tú te llamas Juan
Él/Ella se llama Pedro
\`\`\`

### Example Conversation

> **A:** ¡Hola! Me llamo María. ¿Cómo te llamas?
> **B:** Hola, María. Me llamo Juan. Mucho gusto.
> **A:** Mucho gusto, Juan. Soy de México. ¿Y tú?

Now let's practice these phrases!`,
        },
      ],
    },
    {
      sectionInstruction:
        "Practice & Review",
      sectionIndex: 2,
      unitPlans: [
        {
          type: "fill_in_blanks",
          instructions:
            "Practice using 'me llamo' and 'soy' for self-introduction.",
        },
        {
          type: "word_match",
          instructions:
            "Match Spanish greetings to English. Theme: Basic greetings. 3 pairs, 2 distractors.",
        },
        {
          type: "word_order",
          instructions: "Daily routine sentences with reflexive verbs",
        },
        {
          type: "write_in_blanks",
          instructions:
            "Practice conjugating verbs in context with daily activities.",
        },
        {
          type: "writing_practice",
          instructions:
            "Practice introducing yourself and describing your daily routine",
        },
      ],
      units: [
        {
          type: "fill_in_blanks",
          plan: {
            type: "fill_in_blanks",
            instructions:
              "Practice using 'me llamo' and 'soy' for self-introduction.",
          },
          output: {
            exercises: [
              {
                template: "Hola, me [*] María y soy de México.",
                answers: ["llamo"],
                distractors: ["llamamos", "llamar", "soy"],
              },
              {
                template: "Yo [*] ingeniero y trabajo en una oficina.",
                answers: ["soy"],
                distractors: ["somos", "ser", "estoy"],
              },
            ],
          },
        },
        {
          type: "word_match",
          plan: {
            type: "word_match",
            instructions:
              "Match Spanish greetings to English. Theme: Basic greetings. 3 pairs, 2 distractors.",
          },
          output: {
            exercises: [
              {
                columnLabels: {
                  a: "Spanish",
                  b: "English",
                },
                pairs: [
                  ["Hola", "Hello"],
                  ["Gracias", "Thank you"],
                  ["Buenos días", "Good morning"],
                ],
                distractors: ["Goodbye", "Good night"],
                instruction:
                  "Match the Spanish words with their English translations.",
              },
            ],
          },
        },
        {
          type: "word_order",
          plan: {
            type: "word_order",
            instructions: "Daily routine sentences with reflexive verbs",
          },
          output: {
            sentences: [
              {
                sentence: "Me levanto a las siete.",
                translation: "I get up at seven.",
              },
              {
                sentence: "¿Dónde vives tú?",
                translation: "Where do you live?",
              },
              {
                sentence: "El gato negro duerme.",
                translation: "The black cat sleeps.",
              },
            ],
          },
        },
        {
          type: "write_in_blanks",
          plan: {
            type: "write_in_blanks",
            instructions:
              "Practice conjugating verbs in context with daily activities.",
          },
          output: {
            exercises: [
              {
                template: "Yo [*] con mis amigos todos los días.",
                blanks: [
                  {
                    correctAnswer: "hablo",
                    clue: "(hablar)",
                    acceptedAlternates: [],
                  },
                ],
              },
              {
                template: "María [*] en una empresa grande.",
                blanks: [
                  {
                    correctAnswer: "trabaja",
                    clue: "(trabajar)",
                    acceptedAlternates: [],
                  },
                ],
              },
            ],
          },
        },
        {
          type: "writing_practice",
          plan: {
            type: "writing_practice",
            instructions:
              "Practice introducing yourself and describing your daily routine",
          },
          output: {
            topic: "Introductions & Daily Life",
            prompts: [
              {
                prompt:
                  "Preséntate. ¿Cómo te llamas? ¿De dónde eres? ¿Qué haces?",
                promptTranslation:
                  "Introduce yourself. What is your name? Where are you from? What do you do?",
                hints: ["Me llamo...", "Soy de...", "Trabajo como..."],
                expectedLength: "medium",
              },
              {
                prompt: "¿Qué haces por la mañana normalmente?",
                promptTranslation: "What do you normally do in the morning?",
                hints: [
                  "despertarse",
                  "desayunar",
                  "ducharse",
                  "ir al trabajo",
                ],
                expectedLength: "medium",
              },
            ],
          },
        },
      ],
    },
  ],
};

type AppView = "home" | "creator" | "player" | "roadmap" | "roadmap-lesson" | "day-to-day";

// ============================================================================
// Pipeline logging helper — logs full lesson pipeline to browser console
// ============================================================================
function logLessonPipeline(data: {
  pipeline?: {
    structurePrompt: string;
    rawXmlResponse: string;
    extractedXml: string;
    parsedSections: Array<{
      name: string;
      units: Array<{ type: string; name: string; instructions: string }>;
    }>;
    unitExecutions?: Array<{
      sectionIndex: number;
      unitIndex: number;
      unitType: string;
      unitName: string;
      prompt: string;
      output: unknown;
    }>;
  };
  lesson?: {
    sections?: Array<{
      sectionInstruction: string;
      learningSummary?: string;
      units: Array<{
        type: string;
        plan?: { instructions: string };
        output: unknown;
      }>;
    }>;
  };
}) {
  if (!data.pipeline) return;

  console.group("🔧 Lesson Pipeline Debug");
  console.log("📝 Structure Prompt:", data.pipeline.structurePrompt);
  console.log("📄 Raw XML Response:", data.pipeline.rawXmlResponse);
  console.log("🏷️ Extracted XML:", data.pipeline.extractedXml);
  console.log("📦 Parsed Sections:", data.pipeline.parsedSections);

  // Log unit executions with FULL inputs and outputs
  console.group("⚙️ Unit Executions (inputs + outputs)");
  data.pipeline.unitExecutions?.forEach((unit) => {
    console.group(
      `S${unit.sectionIndex + 1} U${unit.unitIndex + 1}: [${unit.unitType}] ${unit.unitName}`
    );
    console.log("📥 Full Prompt (input):", unit.prompt);
    console.log("📤 Full Output:", unit.output);
    console.groupEnd();
  });
  console.groupEnd();

  // Log the final lesson with section summaries
  if (data.lesson?.sections) {
    console.group("📚 Final Lesson Sections");
    data.lesson.sections.forEach((section, i) => {
      console.group(`Section ${i + 1}: ${section.sectionInstruction}`);
      if (section.learningSummary) {
        console.log("✨ Learning Summary:", section.learningSummary);
      }
      section.units.forEach((unit, j) => {
        console.log(
          `  Unit ${j + 1} [${unit.type}]:`,
          unit.plan?.instructions?.slice(0, 80) ?? "",
          "→",
          unit.output
        );
      });
      console.groupEnd();
    });
    console.groupEnd();
  }

  console.groupEnd();
}

function App() {
  const [view, setView] = useState<AppView>("day-to-day");

  const setLesson = useSectionedLessonStore((s) => s.setLesson);
  const reset = useSectionedLessonStore((s) => s.reset);
  const setStatus = useSectionedLessonStore((s) => s.setStatus);

  const roadmapStore = useRoadmapStore();

  const handleStartDemo = () => {
    setLesson(demoLessonData);
    setView("player");
  };

  const handleCreateLesson = () => {
    setView("creator");
  };

  const setGenerationProgress = useSectionedLessonStore(
    (s) => s.setGenerationProgress
  );

  const handleLessonFormSubmit = async (formData: CreateLessonFormData) => {
    // Switch to player view immediately so the loading screen shows
    setStatus("generating");
    setGenerationProgress(null);
    setView("player");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/lessons/create-structured-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create lesson");
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
              setGenerationProgress({
                stage: event.stage,
                message: event.message,
                current: event.current,
                total: event.total,
              });
            }

            if (event.type === "result") {
              const data = event.data;

              // ─── Frontend console logs ───
              logLessonPipeline(data);

              setLesson(data.lesson ?? data);
            }

            if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            // Ignore malformed lines
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate lesson:", error);
      setStatus("idle");
      setGenerationProgress(null);
      setView("creator");
    }
  };

  const handleClose = () => {
    reset();
    setView("home");
  };

  const handleOpenRoadmap = () => {
    setView("roadmap");
  };

  const handleRoadmapLessonSelect = async (
    monthIndex: number,
    weekIndex: number,
    lessonIndex: number
  ) => {
    // Store the selection
    roadmapStore.selectLesson(monthIndex, weekIndex, lessonIndex);

    // Build context for new structured lesson endpoint
    const lessonContext = roadmapStore.buildStructuredLessonContext();
    if (!lessonContext) return;

    // Show loading state
    setStatus("generating");
    setGenerationProgress(null);
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
              setGenerationProgress({
                stage: event.stage,
                message: event.message,
                current: event.current,
                total: event.total,
              });
            }

            if (event.type === "result") {
              const data = event.data;
              logLessonPipeline(data);
              setLesson(data.lesson ?? data);
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
      setStatus("idle");
      setGenerationProgress(null);
      setView("roadmap");
    }
  };

  const handleRoadmapLessonComplete = () => {
    // Mark the lesson as complete
    const selectedData = roadmapStore.getSelectedLessonData();
    if (selectedData) {
      roadmapStore.markLessonComplete(selectedData.lesson.globalLessonIndex);
    }

    // Go back to roadmap
    roadmapStore.clearSelectedLesson();
    reset();
    setView("roadmap");
  };

  // Reset the roadmap to generate a new curriculum
  const handleResetRoadmap = () => {
    roadmapStore.reset();
  };

  const handleBackToRoadmap = () => {
    roadmapStore.clearSelectedLesson();
    reset();
    setView("roadmap");
  };

  // Render based on current view
  if (view === "day-to-day") {
    return <DayToDayChat />;
  }

  if (view === "creator") {
    return <LessonCreator onSubmit={handleLessonFormSubmit} />;
  }

  if (view === "player") {
    return (
      <div className="h-full">
        <LessonPlayer
          onClose={handleClose}
          onLessonComplete={handleClose}
        />
      </div>
    );
  }

  if (view === "roadmap") {
    return (
      <div className="min-h-screen">
        {/* Back button */}
        <div className="fixed top-4 left-4 z-20">
          <button
            onClick={handleClose}
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
            Back
          </button>
        </div>
        <Roadmap onLessonSelect={handleRoadmapLessonSelect} />
      </div>
    );
  }

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

  // Home view
  return (
    <div className="min-h-screen bg-bauhaus-white flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <h1 className="text-6xl font-black tracking-tighter mb-2">
          Lingo<span className="text-bauhaus-blue">Loop</span>
        </h1>
        <p className="text-zinc-500 mb-12">
          AI-powered language learning, tailored to you
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleOpenRoadmap}
            className="w-full px-10 py-5 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-bauhaus-green text-white hover:bg-emerald-700 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            My Roadmap
          </button>

          <button
            onClick={handleCreateLesson}
            className="w-full px-10 py-5 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-bauhaus-blue text-white hover:bg-blue-700 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Create New Lesson
          </button>

          <button
            onClick={handleStartDemo}
            className="w-full px-10 py-5 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-white text-black hover:bg-zinc-100 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Try Demo Lesson
          </button>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex justify-center gap-4">
          <div className="w-4 h-4 bg-bauhaus-red" />
          <div className="w-4 h-4 bg-bauhaus-blue" />
          <div className="w-4 h-4 bg-bauhaus-green" />
        </div>
      </div>
    </div>
  );
}

export default App;
