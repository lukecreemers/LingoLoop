import { useState } from "react";
import "./App.css";
import type { SectionedLesson } from "@shared";
import { LessonPlayer, LessonCreator } from "./components/lesson";
import { useSectionedLessonStore } from "./stores/useSectionedLessonStore";

// Demo lesson data for testing the lesson player (now in sectioned format)
const demoLessonData: SectionedLesson = {
  input: {
    instructions: "Learn basic Spanish introductions and greetings",
    userLevel: "beginner",
    targetLanguage: "Spanish",
    nativeLanguage: "English",
  },
  sectionInstructions: [
    "Section 1: Introduction to Spanish greetings with a sample conversation and vocabulary",
    "Section 2: Practice using greeting phrases with exercises",
  ],
  sections: [
    {
      sectionInstruction:
        "Section 1: Introduction to Spanish greetings with a sample conversation and vocabulary",
      sectionIndex: 0,
      unitPlans: [
        {
          type: "conversation",
          instructions:
            "Create a conversation about two people meeting and introducing themselves. conversationLength: medium",
        },
        {
          type: "flashcard",
          instructions:
            "Basic greeting vocabulary for introductions. cardCount: 6",
        },
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
        "Section 2: Practice using greeting phrases with exercises",
      sectionIndex: 1,
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

type AppView = "home" | "creator" | "player";

function App() {
  const [view, setView] = useState<AppView>("home");
  const setLesson = useSectionedLessonStore((s) => s.setLesson);
  const reset = useSectionedLessonStore((s) => s.reset);

  const handleStartDemo = () => {
    setLesson(demoLessonData);
    setView("player");
  };

  const handleCreateLesson = () => {
    setView("creator");
  };

  const handleLessonCreated = () => {
    setView("player");
  };

  const handleClose = () => {
    reset();
    setView("home");
  };

  // Render based on current view
  if (view === "creator") {
    return <LessonCreator onLessonCreated={handleLessonCreated} />;
  }

  if (view === "player") {
    return (
      <div className="h-screen">
        <LessonPlayer
          onClose={handleClose}
          onLessonComplete={handleClose}
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
