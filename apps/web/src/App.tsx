import { useState } from "react";
import "./App.css";
import type { CompiledLesson } from "@shared";
import { LessonPlayer, LessonCreator } from "./components/lesson";
import { useLessonStore } from "./stores/useLessonStore";

// Demo lesson data for testing the lesson player
const demoLessonData: CompiledLesson = {
  units: [
    {
      type: "flashcard",
      plan: {
        type: "flashcard",
        instructions: "Basic greeting vocabulary for introductions",
        cardCount: 6,
      },
      output: {
        theme: "Greetings & Introductions",
        cards: [
          {
            term: "Hola",
            definition: "Hello / Hi",
            example: "¡Hola! ¿Cómo estás?",
            exampleTranslation: "Hello! How are you?",
          },
          {
            term: "Me llamo",
            definition: "My name is (lit. I call myself)",
            example: "Me llamo María.",
            exampleTranslation: "My name is María.",
          },
          {
            term: "Mucho gusto",
            definition: "Nice to meet you (lit. Much pleasure)",
            example: "Mucho gusto, Juan.",
            exampleTranslation: "Nice to meet you, Juan.",
          },
          {
            term: "¿Cómo te llamas?",
            definition: "What's your name? (informal)",
            example: "¡Hola! ¿Cómo te llamas?",
            exampleTranslation: "Hello! What's your name?",
          },
          {
            term: "Soy de...",
            definition: "I'm from...",
            example: "Soy de México.",
            exampleTranslation: "I'm from Mexico.",
          },
          {
            term: "¿De dónde eres?",
            definition: "Where are you from? (informal)",
            example: "¿De dónde eres tú?",
            exampleTranslation: "Where are you from?",
          },
        ],
      },
    },
    {
      type: "conversation",
      plan: {
        type: "conversation",
        instructions:
          "Create a conversation about two people meeting and introducing themselves, discussing where they're from and what they do for work.",
        conversationLength: "medium",
      },
      output: {
        characters: [
          { name: "María", age: "adult", gender: "female" },
          { name: "Juan", age: "adult", gender: "male" },
        ],
        conversation: `**María:** ¡Hola! Me llamo María. ¿Cómo te llamas?
**Juan:** Hola, María. Me llamo Juan. Mucho gusto.
**María:** Mucho gusto, Juan. Soy de México. ¿De dónde eres tú?
**Juan:** Soy de España, de Barcelona. ¿Vives aquí en la ciudad?
**María:** Sí, vivo aquí desde hace tres años. Trabajo en una empresa de tecnología.
**Juan:** ¡Qué interesante! Yo soy profesor de español en la universidad.
**María:** ¡Qué bien! Entonces hablas muy bien el español, obviamente.
**Juan:** Jaja, sí, es mi lengua materna. ¿Te gusta vivir aquí?
**María:** Me encanta. La gente es muy amable y hay mucha cultura.`,
      },
    },
    {
      type: "explanation",
      plan: {
        type: "explanation",
        instructions:
          "Explain how to introduce yourself in Spanish, including key phrases like 'Me llamo', 'Soy de', and 'Mucho gusto'. Cover the reflexive verb 'llamarse'.",
      },
      output: {
        explanation: `## Introducing Yourself in Spanish

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
    },
    {
      type: "fill in the blanks",
      plan: {
        type: "fill in the blanks",
        instructions:
          "Practice using 'me llamo' and 'soy' for self-introduction.",
        blankAmount: 1,
        distractorInstructions: "Include similar verb forms as distractors.",
        distractorCount: 3,
      },
      output: {
        exercises: [
          {
            template: "Hola, me [*] María y soy de México.",
            answers: ["llamo"],
            distractors: ["llamamos", "llamar", "soy"],
          },
          {
            template: "Yo [*] ingeniero y estoy muy feliz.",
            answers: ["soy"],
            distractors: ["somos", "ser", "estoy"],
          },
        ],
      },
    },
    {
      type: "word meaning match",
      plan: {
        type: "word meaning match",
        matchType: "Spanish Word → English Translation",
        theme: "Basic greetings and common phrases",
        pairCount: 3,
        distractorCount: 2,
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
      type: "write in the blanks",
      plan: {
        type: "write in the blanks",
        instructions:
          "Practice conjugating verbs in context with daily activities.",
        blankAmount: 1,
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
        ],
      },
    },
  ],
};

type AppView = "home" | "creator" | "player";

function App() {
  const [view, setView] = useState<AppView>("home");
  const setLesson = useLessonStore((s) => s.setLesson);
  const reset = useLessonStore((s) => s.reset);

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
