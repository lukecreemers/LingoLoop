import type { Curriculum } from "../stores/useRoadmapStore";

export const DEFAULT_CURRICULUM: Curriculum = {
  userGoal:
    "I am a complete beginner in Spanish. I have 1 month before a trip to Mexico and want to be able to have basic conversations - ordering food, asking directions, introducing myself, and understanding simple responses. I have about 30 minutes per day to study.",
  totalMonths: 1,
  totalWeeks: 3,
  totalLessons: 15,
  months: [
    {
      name: "Spanish Fundamentals for Travel",
      description:
        "This month focuses on building the essential foundation needed for basic travel conversations in Spanish. You will learn core vocabulary, essential grammar structures, and practical phrases for ordering food, asking directions, introducing yourself, and understanding simple responses.",
      monthIndex: 0,
      weeks: [
        {
          name: "Week 1: Alphabet, Pronunciation, and Basic Greetings",
          description:
            "This week establishes the foundation of Spanish by learning the alphabet, pronunciation rules, and essential greeting phrases. You will practice proper pronunciation patterns and begin forming your first conversational exchanges.",
          weekIndex: 0,
          globalWeekIndex: 0,
          lessons: [
            {
              name: "Spanish Alphabet and Pronunciation Rules",
              description:
                "- Learn the 27 letters of the Spanish alphabet and their pronunciation\n- Practice vowel sounds (a, e, i, o, u) which are consistent and clear in Spanish\n- Understand key consonant sounds and common pronunciation patterns\n- Complete fill-in-the-blank exercises matching letters to their sounds",
              lessonIndex: 0,
              globalLessonIndex: 0,
            },
            {
              name: "Common Greetings and Farewells",
              description:
                "- Study essential greetings: Hola, Buenos días, Buenas tardes, Buenas noches\n- Learn polite farewells: Adiós, Hasta luego, Hasta mañana\n- Practice formal vs. informal greeting contexts\n- Complete translation exercises converting English greetings to Spanish equivalents",
              lessonIndex: 1,
              globalLessonIndex: 1,
            },
            {
              name: "Introductions and Personal Information",
              description:
                "- Learn how to introduce yourself: Me llamo..., Soy...\n- Study basic personal questions: ¿Cómo te llamas? ¿De dónde eres?\n- Practice simple responses about your name and origin\n- Complete fill-in-the-blank exercises for introduction dialogues",
              lessonIndex: 2,
              globalLessonIndex: 2,
            },
            {
              name: "Numbers 0-20 and Basic Courtesy Phrases",
              description:
                "- Learn numbers zero through twenty with proper pronunciation\n- Study essential courtesy phrases: Por favor, De nada, Gracias, Por supuesto\n- Practice using numbers in context\n- Complete number matching and translation exercises for polite requests",
              lessonIndex: 3,
              globalLessonIndex: 3,
            },
            {
              name: "Review: Alphabet, Greetings, Introductions, and Courtesy Phrases",
              description:
                "- Review Spanish alphabet pronunciation and vowel consistency through flashcard matching\n- Practice complete greeting and introduction exchanges in fill-in-the-blank dialogues\n- Translate short introduction paragraphs combining greetings, names, origins, and courtesy phrases\n- Complete a mock introduction scenario writing activity",
              lessonIndex: 4,
              globalLessonIndex: 4,
            },
          ],
        },
        {
          name: "Week 3: Food Vocabulary and Ordering Conversations",
          description:
            "This week focuses on restaurant and food vocabulary essential for ordering meals in Mexico. You will learn food names, drink options, and complete dialogue patterns for ordering food and understanding simple responses from servers.",
          weekIndex: 1,
          globalWeekIndex: 1,
          lessons: [
            {
              name: "Common Foods and Dishes in Mexican Cuisine",
              description:
                "- Learn vocabulary for common Mexican foods: tacos, enchiladas, tamales, quesadillas, chile relleno\n- Study basic food categories: carnes (meats), verduras (vegetables), frutas (fruits)\n- Practice pronunciation of food names\n- Complete matching exercises connecting food names to descriptions and flashcard activities",
              lessonIndex: 0,
              globalLessonIndex: 5,
            },
            {
              name: "Beverages and Dietary Preferences",
              description:
                "- Learn drink vocabulary: agua, cerveza, vino, café, té, jugo, refresco\n- Study dietary preference phrases: Soy vegetariano/a, No como carne, Sin picante\n- Practice expressing allergies and preferences: Alérgico a..., No me gusta...\n- Complete fill-in-the-blank exercises for beverage orders and dietary statements",
              lessonIndex: 1,
              globalLessonIndex: 6,
            },
            {
              name: "Restaurant Phrases and Ordering Structure",
              description:
                "- Learn key phrases: Tengo hambre (I'm hungry), La cuenta por favor (The check please), ¿Qué recomienda? (What do you recommend?)\n- Study the basic ordering pattern: Quiero... / Me gustaría... (I would like...)\n- Practice polite ordering language: ¿Tiene...? (Do you have...?), Quisiera... (I would like...)\n- Complete dialogue fill-in-the-blank exercises for restaurant interactions",
              lessonIndex: 2,
              globalLessonIndex: 7,
            },
            {
              name: "Understanding Server Responses and Menu Descriptions",
              description:
                "- Learn common server responses: ¿Qué desea? (What would you like?), Se lo traigo ahora (I'll bring it for you)\n- Study menu description words: picante (spicy), dulce (sweet), salado (salty), caliente (hot)\n- Practice recognizing and responding to typical server questions\n- Complete comprehension exercises matching phrases to appropriate responses",
              lessonIndex: 3,
              globalLessonIndex: 8,
            },
            {
              name: "Review: Complete Restaurant Ordering Dialogue",
              description:
                "- Flashcard review of food, beverage, and restaurant vocabulary with images\n- Write a complete ordering dialogue from greeting to paying the bill\n- Translate restaurant conversations from English to Spanish with proper quiero/me gustaría usage\n- Practice fill-in-the-blank exercises with realistic menu ordering scenarios",
              lessonIndex: 4,
              globalLessonIndex: 9,
            },
          ],
        },
        {
          name: "Week 4: Directions, Essential Verbs, and Conversational Confidence",
          description:
            "This final week equips you with vocabulary and phrases for asking directions and getting around, while integrating all previous learning into practical travel conversations. You will practice combining learned concepts to handle real-world travel situations.",
          weekIndex: 2,
          globalWeekIndex: 2,
          lessons: [
            {
              name: "Direction Vocabulary and Location Phrases",
              description:
                "- Learn directions: derecha (right), izquierda (left), recto (straight), atrás (behind), delante (in front)\n- Study location-related phrases: cerca (near), lejos (far), al lado de (next to), entre (between)\n- Practice place vocabulary: estación (station), hotel, farmacia (pharmacy), baño (bathroom)\n- Complete matching and fill-in-the-blank exercises with directional language",
              lessonIndex: 0,
              globalLessonIndex: 10,
            },
            {
              name: "Common Verbs for Getting Around: Ir, Andar, Llegar",
              description:
                "- Learn conjugation of ir (to go): voy, vas, va, vamos, vais, van\n- Study andar (to walk) and llegar (to arrive) conjugations\n- Practice forming directions using these verbs: Voy a..., Necesito ir a...\n- Complete translation exercises combining direction vocabulary with movement verbs",
              lessonIndex: 1,
              globalLessonIndex: 11,
            },
            {
              name: "Asking for Directions and Understanding Responses",
              description:
                "- Learn key phrases: ¿Dónde está...? (Where is...?), ¿Cómo llego a...? (How do I get to...?), ¿Cuál es el camino a...? (What's the way to...?)\n- Study responses: Está a dos cuadras (It's two blocks away), Siga derecho (Keep going straight)\n- Practice polite question formation with por favor\n- Complete dialogue exercises for asking and giving directions",
              lessonIndex: 2,
              globalLessonIndex: 12,
            },
            {
              name: "Integration: Complete Travel Conversations",
              description:
                "- Combine greeting, introduction, and direction-asking phrases into cohesive dialogues\n- Practice ordering food while explaining dietary needs using learned vocabulary\n- Study transitions between conversations: introductions leading to asking for restaurant directions\n- Complete realistic scenario writing and fill-in-the-blank activities",
              lessonIndex: 3,
              globalLessonIndex: 13,
            },
            {
              name: "Review: Comprehensive Travel Scenarios and Practical Application",
              description:
                "- Flashcard review combining ALL vocabulary from Weeks 1-4 (greetings, verbs, food, directions)\n- Write complete travel scenarios: arriving at hotel, ordering food, asking for pharmacy location\n- Translate complex travel dialogues using ser/estar/tener/querer and directional verbs\n- Complete comprehensive fill-in-the-blank exercise simulating a full day of travel interactions in Mexico",
              lessonIndex: 4,
              globalLessonIndex: 14,
            },
          ],
        },
      ],
    },
  ],
};

