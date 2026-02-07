import type {
  DailyLoop,
  DailyVocab,
  CustomLessonTask,
  ReviewTask,
  FlashcardsTask,
  ReadingTask,
  WritingTask,
} from "@shared";

// ============================================================================
// STATIC DAILY LOOP DATA FOR TESTING
// Simulates Day 4 of a Spanish beginner's journey
// ============================================================================

// ============================================================================
// SHARED DAILY VOCAB
// These words are used by flashcards AND injected into reading + writing.
// ============================================================================

const dailyVocab: DailyVocab = {
  newWords: [
    {
      word: "la cuenta",
      definition: "the bill / the check",
      example: "La cuenta, por favor.",
      exampleTranslation: "The check, please.",
    },
    {
      word: "pedir",
      definition: "to order / to ask for",
      example: "Quiero pedir una ensalada.",
      exampleTranslation: "I want to order a salad.",
    },
    {
      word: "el mesero",
      definition: "the waiter",
      example: "El mesero es muy amable.",
      exampleTranslation: "The waiter is very kind.",
    },
    {
      word: "recomendar",
      definition: "to recommend",
      example: "¿Qué me recomienda?",
      exampleTranslation: "What do you recommend?",
    },
    {
      word: "la propina",
      definition: "the tip",
      example: "Voy a dejar una buena propina.",
      exampleTranslation: "I'm going to leave a good tip.",
    },
  ],
  reviewWords: [
    {
      word: "Hola",
      definition: "Hello / Hi",
      example: "¡Hola! ¿Cómo estás?",
      exampleTranslation: "Hello! How are you?",
    },
    {
      word: "Me llamo",
      definition: "My name is",
      example: "Me llamo María.",
      exampleTranslation: "My name is María.",
    },
    {
      word: "Mucho gusto",
      definition: "Nice to meet you",
      example: "Mucho gusto, Juan.",
      exampleTranslation: "Nice to meet you, Juan.",
    },
    {
      word: "Buenos días",
      definition: "Good morning",
      example: "Buenos días, señor.",
      exampleTranslation: "Good morning, sir.",
    },
    {
      word: "Gracias",
      definition: "Thank you",
      example: "Muchas gracias por su ayuda.",
      exampleTranslation: "Thank you very much for your help.",
    },
  ],
  grammarConcepts: [
    "Using 'quiero' and 'me gustaría' for polite ordering",
    "Numbers for prices",
    "Courtesy phrases in restaurant context",
    "Present tense conjugation of -ir verbs",
  ],
};

// --- TASK 1: FLASHCARDS (SRS) ---
// Uses the same dailyVocab words
const flashcardsTask: FlashcardsTask = {
  id: "daily-flashcards",
  type: "flashcards",
  title: "Vocabulary",
  description: "5 new words + 5 review words",
  icon: "🃏",
  estimatedMinutes: 5,
  order: 0,
  config: {
    newWordsPerDay: 5,
    reviewWordsPerDay: 5,
  },
  newCards: dailyVocab.newWords.map((w) => ({
    term: w.word,
    definition: w.definition,
    example: w.example,
    exampleTranslation: w.exampleTranslation,
  })),
  reviewCards: dailyVocab.reviewWords.map((w) => ({
    term: w.word,
    definition: w.definition,
    example: w.example,
    exampleTranslation: w.exampleTranslation,
  })),
};

// --- TASK 2: CUSTOM LESSON (from roadmap) ---
const customLessonTask: CustomLessonTask = {
  id: "daily-custom-lesson",
  type: "custom_lesson",
  title: "Today's Lesson",
  description: "Numbers 0-20 & Courtesy Phrases",
  icon: "📚",
  estimatedMinutes: 15,
  order: 1,
  lessonRef: {
    monthIndex: 0,
    weekIndex: 0,
    lessonIndex: 3,
    lessonName: "Numbers 0-20 and Basic Courtesy Phrases",
  },
  lessonData: {
    input: {
      instructions:
        "Learn numbers zero through twenty and essential courtesy phrases for basic interactions",
      userLevel: "beginner",
      targetLanguage: "Spanish",
      nativeLanguage: "English",
    },
    sectionInstructions: [
      "Introduction to Numbers & Courtesy",
      "Learning Numbers 0-20",
      "Practice & Review",
    ],
    sections: [
      {
        sectionInstruction: "Introduction to Numbers & Courtesy",
        sectionIndex: 0,
        unitPlans: [
          {
            type: "context",
            instructions:
              "Introduce a lesson about Spanish numbers 0-20 and essential courtesy phrases.",
          },
        ],
        units: [
          {
            type: "context",
            plan: {
              type: "context",
              instructions:
                "Introduce a lesson about Spanish numbers 0-20 and essential courtesy phrases.",
            },
            output: `## Numbers & Courtesy Phrases

Today we're learning two essential building blocks for Spanish conversations:

- **Numbers 0-20** — You'll need these everywhere: prices, addresses, phone numbers, and telling time
- **Courtesy phrases** — The magic words that make every interaction smoother

By the end of this lesson, you'll be able to:
- Count from 0 to 20 in Spanish
- Use polite phrases like *por favor*, *gracias*, and *de nada*
- Combine numbers with courtesy phrases in real situations

Let's dive in!`,
          },
        ],
      },
      {
        sectionInstruction: "Learning Numbers 0-20",
        sectionIndex: 1,
        unitPlans: [
          {
            type: "explanation",
            instructions:
              "Teach Spanish numbers 0-20 with pronunciation tips and courtesy phrases: por favor, gracias, de nada, lo siento, con permiso.",
          },
        ],
        units: [
          {
            type: "explanation",
            plan: {
              type: "explanation",
              instructions:
                "Teach Spanish numbers 0-20 with pronunciation tips and courtesy phrases.",
            },
            output: `## Spanish Numbers 0-20

### Numbers 0-10
| Number | Spanish | Pronunciation Tip |
|--------|---------|-------------------|
| 0 | **cero** | "SEH-roh" |
| 1 | **uno** | "OO-noh" |
| 2 | **dos** | "dohs" |
| 3 | **tres** | "trehs" |
| 4 | **cuatro** | "KWAH-troh" |
| 5 | **cinco** | "SEEN-koh" |
| 6 | **seis** | "says" |
| 7 | **siete** | "see-EH-teh" |
| 8 | **ocho** | "OH-choh" |
| 9 | **nueve** | "NWEH-beh" |
| 10 | **diez** | "dee-EHS" |

### Numbers 11-20
| Number | Spanish | Note |
|--------|---------|------|
| 11 | **once** | Unique |
| 12 | **doce** | Unique |
| 13 | **trece** | Unique |
| 14 | **catorce** | Unique |
| 15 | **quince** | Unique |
| 16 | **dieciséis** | diez + seis |
| 17 | **diecisiete** | diez + siete |
| 18 | **dieciocho** | diez + ocho |
| 19 | **diecinueve** | diez + nueve |
| 20 | **veinte** | Unique |

### Essential Courtesy Phrases
- **Por favor** — Please
- **Gracias** — Thank you
- **De nada** — You're welcome
- **Lo siento** — I'm sorry
- **Con permiso** — Excuse me (to pass by)
- **Disculpe** — Excuse me (to get attention)

### Using Them Together
> "Quiero **tres** tacos, **por favor**."
> "Son **quince** pesos." — "**Gracias**."`,
          },
        ],
      },
      {
        sectionInstruction: "Practice & Review",
        sectionIndex: 2,
        unitPlans: [
          {
            type: "fill_in_blanks",
            instructions: "Practice numbers and courtesy phrases in context.",
          },
          {
            type: "word_match",
            instructions:
              "Match Spanish numbers/courtesy phrases to English. 4 pairs, 2 distractors.",
          },
          {
            type: "word_order",
            instructions:
              "Arrange words to form sentences using numbers and courtesy phrases.",
          },
        ],
        units: [
          {
            type: "fill_in_blanks",
            plan: {
              type: "fill_in_blanks",
              instructions:
                "Practice numbers and courtesy phrases in context.",
            },
            output: {
              exercises: [
                {
                  template: "Quiero [*] tacos, por favor.",
                  answers: ["tres"],
                  distractors: ["gracias", "hola", "bueno"],
                },
                {
                  template: "Son [*] pesos en total.",
                  answers: ["quince"],
                  distractors: ["por favor", "grande", "mucho"],
                },
                {
                  template: "Muchas [*] por su ayuda.",
                  answers: ["gracias"],
                  distractors: ["cinco", "días", "bien"],
                },
              ],
            },
          },
          {
            type: "word_match",
            plan: {
              type: "word_match",
              instructions:
                "Match Spanish numbers/courtesy phrases to English.",
            },
            output: {
              exercises: [
                {
                  columnLabels: { a: "Spanish", b: "English" },
                  pairs: [
                    ["Siete", "Seven"],
                    ["Quince", "Fifteen"],
                    ["Por favor", "Please"],
                    ["De nada", "You're welcome"],
                  ],
                  distractors: ["Thirteen", "Goodbye"],
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
              instructions:
                "Arrange words to form sentences using numbers and courtesy phrases.",
            },
            output: {
              sentences: [
                {
                  sentence: "Quiero dos cafés, por favor.",
                  translation: "I want two coffees, please.",
                },
                {
                  sentence: "Son diez pesos.",
                  translation: "It's ten pesos.",
                },
                {
                  sentence: "Muchas gracias, señor.",
                  translation: "Thank you very much, sir.",
                },
              ],
            },
          },
        ],
      },
    ],
  },
};

// --- TASK 3: REVIEW (from previous lessons) ---
const reviewTask: ReviewTask = {
  id: "daily-review",
  type: "review",
  title: "Review",
  description: "Greetings & Introductions review",
  icon: "🔄",
  estimatedMinutes: 5,
  order: 2,
  sourceDescription: "From Lesson 2: Common Greetings & Farewells, and Lesson 3: Introductions",
  reviewUnits: [
    {
      type: "fill_in_blanks",
      plan: {
        type: "fill_in_blanks",
        instructions:
          "Review: Practice greeting and introduction phrases from previous lessons.",
      },
      output: {
        exercises: [
          {
            template: "Hola, me [*] María y soy de México.",
            answers: ["llamo"],
            distractors: ["llamamos", "llamar", "soy"],
          },
          {
            template: "[*] días, ¿cómo está usted?",
            answers: ["Buenos"],
            distractors: ["Buenas", "Hola", "Bien"],
          },
          {
            template: "Mucho [*], me llamo Juan.",
            answers: ["gusto"],
            distractors: ["bien", "gracias", "hola"],
          },
        ],
      },
    },
    {
      type: "word_order",
      plan: {
        type: "word_order",
        instructions:
          "Review: Unscramble greeting and introduction sentences.",
      },
      output: {
        sentences: [
          {
            sentence: "¿Cómo te llamas?",
            translation: "What is your name?",
          },
          {
            sentence: "Soy de España.",
            translation: "I am from Spain.",
          },
          {
            sentence: "Hasta luego, amigo.",
            translation: "See you later, friend.",
          },
        ],
      },
    },
    {
      type: "write_in_blanks",
      plan: {
        type: "write_in_blanks",
        instructions:
          "Review: Type in the correct greeting or introduction phrase.",
      },
      output: {
        exercises: [
          {
            template: "A: ¡Hola! ¿Cómo te llamas? B: Me [*] Carlos.",
            blanks: [
              {
                correctAnswer: "llamo",
                clue: "(llamarse - yo)",
                acceptedAlternates: [],
              },
            ],
          },
          {
            template: "A: ¿De dónde eres? B: [*] de Argentina.",
            blanks: [
              {
                correctAnswer: "Soy",
                clue: "(ser - yo)",
                acceptedAlternates: ["soy"],
              },
            ],
          },
        ],
      },
    },
  ],
};

// --- TASK 4: READING ---
// Activities are configurable: here we show mcq + translate_phrases
// The reading content uses the same daily vocab words (story, not convo)
const readingTask: ReadingTask = {
  id: "daily-reading",
  type: "reading",
  title: "Reading",
  description: "A story about dinner at a restaurant",
  icon: "📖",
  estimatedMinutes: 10,
  order: 3,
  config: {
    contentType: "story",
    length: "medium",
    // User's configured activities — can be ['mcq'], ['translate_phrases'],
    // ['mcq', 'translate_phrases'], or [] for read-only
    activities: ["mcq", "translate_phrases"],
  },
  passage: {
    title: "Una Noche Especial",
    titleTranslation: "A Special Night",
    type: "story",
    content: `Era un viernes por la noche y Ana decidió ir a cenar con su amiga Sofía a un restaurante nuevo en el centro de la ciudad. El restaurante se llama *El Jardín* y es famoso por su comida mexicana.

Cuando llegaron, **el mesero** les dio la bienvenida con una sonrisa amable. "Buenas noches, ¿mesa para dos?" preguntó. Las llevó a una mesa bonita cerca del jardín.

Ana miró el menú y decidió **pedir** una sopa de tortilla y unos tacos de pollo. "¿Qué me **recomienda** para beber?" preguntó al mesero. Él le recomendó un agua de Jamaica, una bebida tradicional mexicana.

Sofía pidió una ensalada grande y un jugo de naranja. "¿Cuánto **cuesta** el jugo?" preguntó. "Son **quince** pesos," respondió el mesero amablemente.

---

La comida llegó rápido y estaba deliciosa. Ana probó la sopa y dijo: "¡Está increíble!" Sofía también disfrutó su ensalada. Las dos amigas hablaron sobre sus planes para el fin de semana mientras comían.

Después de comer, Ana pidió **la cuenta**. "Son ciento veinte pesos en total," dijo el mesero. Ana pagó y dejó una **propina** de veinte pesos porque el servicio fue excelente.

"Muchas gracias por todo," dijo Ana al salir. "¡Hasta pronto!" respondió el mesero con una sonrisa.

Fue una noche especial. Ana y Sofía prometieron volver la próxima semana para probar otros platos del menú.`,
    targetVocab: [
      { word: "mesero", definition: "waiter" },
      { word: "pedir", definition: "to order / to ask for" },
      { word: "recomienda", definition: "recommends (from recomendar)" },
      { word: "cuesta", definition: "costs (from costar)" },
      { word: "la cuenta", definition: "the bill / check" },
      { word: "propina", definition: "tip (gratuity)" },
      { word: "amable", definition: "kind / friendly" },
      { word: "deliciosa", definition: "delicious" },
    ],
    comprehensionQuestions: [
      {
        question: "¿Cómo se llama el restaurante?",
        questionTranslation: "What is the restaurant called?",
        options: [
          "El Jardín",
          "La Mesa",
          "El Centro",
          "La Noche",
        ],
        correctIndex: 0,
      },
      {
        question: "¿Qué pide Ana para comer?",
        questionTranslation: "What does Ana order to eat?",
        options: [
          "Una ensalada y un jugo",
          "Unos tacos y una limonada",
          "Una sopa de tortilla y unos tacos de pollo",
          "Un croissant y un café",
        ],
        correctIndex: 2,
      },
      {
        question: "¿Cuánto cuesta el jugo de naranja?",
        questionTranslation: "How much does the orange juice cost?",
        options: [
          "Diez pesos",
          "Veinte pesos",
          "Quince pesos",
          "Treinta pesos",
        ],
        correctIndex: 2,
      },
      {
        question: "¿Cuánto es la cuenta en total?",
        questionTranslation: "How much is the total bill?",
        options: [
          "Quince pesos",
          "Ciento veinte pesos",
          "Treinta y cinco pesos",
          "Cincuenta pesos",
        ],
        correctIndex: 1,
      },
      {
        question: "¿Por qué Ana deja una propina grande?",
        questionTranslation: "Why does Ana leave a big tip?",
        options: [
          "Porque la comida es barata",
          "Porque el mesero es su amigo",
          "Porque el servicio fue excelente",
          "Porque Sofía se lo pidió",
        ],
        correctIndex: 2,
      },
    ],
    translatePhrases: [
      {
        phrase: "El mesero les dio la bienvenida con una sonrisa amable",
        translation: "The waiter welcomed them with a kind smile",
        context:
          "Cuando llegaron, el mesero les dio la bienvenida con una sonrisa amable.",
      },
      {
        phrase: "¿Qué me recomienda para beber?",
        translation: "What do you recommend for me to drink?",
        context:
          'Ana: "¿Qué me recomienda para beber?" preguntó al mesero.',
      },
      {
        phrase: "La comida llegó rápido y estaba deliciosa",
        translation: "The food arrived quickly and was delicious",
        context:
          "La comida llegó rápido y estaba deliciosa. Ana probó la sopa y dijo: '¡Está increíble!'",
      },
      {
        phrase: "Ana pagó y dejó una propina de veinte pesos",
        translation: "Ana paid and left a tip of twenty pesos",
        context:
          "Ana pagó y dejó una propina de veinte pesos porque el servicio fue excelente.",
      },
      {
        phrase: "Prometieron volver la próxima semana",
        translation: "They promised to come back next week",
        context:
          "Ana y Sofía prometieron volver la próxima semana para probar otros platos del menú.",
      },
    ],
  },
};

// --- TASK 5: WRITING ---
// Injects the same daily vocab + grammar concepts
const writingTask: WritingTask = {
  id: "daily-writing",
  type: "writing",
  title: "Writing",
  description: "Practice writing about ordering food",
  icon: "✍️",
  estimatedMinutes: 10,
  order: 4,
  config: {
    promptCount: 2,
    length: "medium",
  },
  writingExercise: {
    topic: "Ordering at a Restaurant",
    prompts: [
      {
        prompt:
          "Estás en un restaurante mexicano. El mesero te pregunta: '¿Qué desea pedir?' Escribe tu orden completa — comida, bebida, y postre.",
        promptTranslation:
          "You are at a Mexican restaurant. The waiter asks you: 'What would you like to order?' Write your complete order — food, drink, and dessert.",
        hints: [
          "Quiero / Me gustaría...",
          "Para beber...",
          "De postre...",
          "por favor",
        ],
        expectedLength: "medium",
      },
      {
        prompt:
          "Describe tu café o restaurante favorito. ¿Dónde está? ¿Qué pides normalmente? ¿Por qué te gusta?",
        promptTranslation:
          "Describe your favorite café or restaurant. Where is it? What do you normally order? Why do you like it?",
        hints: [
          "Mi restaurante favorito es...",
          "Está en...",
          "Normalmente pido...",
          "Me gusta porque...",
        ],
        expectedLength: "medium",
      },
    ],
  },
  // Same vocab from daily vocab
  targetVocab: dailyVocab.newWords.map((w) => w.word),
  targetConcepts: dailyVocab.grammarConcepts,
};

// ============================================================================
// COMPLETE DAILY LOOP
// ============================================================================

export const STATIC_DAILY_LOOP: DailyLoop = {
  date: new Date().toISOString().split("T")[0],
  dayNumber: 4,
  userProfile: {
    targetLanguage: "Spanish",
    nativeLanguage: "English",
    level: "beginner",
    name: "Alex",
  },
  dailyVocab,
  tasks: [flashcardsTask, customLessonTask, reviewTask, readingTask, writingTask],
  completedTaskIds: [],
};
