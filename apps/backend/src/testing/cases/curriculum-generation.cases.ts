import { z } from 'zod';
import type { PromptTestConfig, TestCase } from '../prompt-tester';
import { ModelConfig } from '../test.types';

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface CurriculumInputs extends Record<
  string,
  string | number | string[]
> {
  userGoal: string;
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export const CURRICULUM_PROMPT_TEMPLATE = `
You are going to be given a user goal, I want you to take this and give a week by week breakdown (do not combine multiple weeks into one) on how to get there.

Assume 4 weeks per month, include 5 lessons per week for the individual lessons that need to be covered. Typically include a review lesson as the last lesson of each week that combines all the learnings of that week. These lessons are supposed to be around 15-20 minutes long and are supposed to contain a mixture of introducing concept, testing it, combining with past things the user knows, etc. Thus each lesson must be an acceptable topic for a user to learn for this length of time. If lessons are to review content, be specific about what they are reviewing (do not simply say reviewing week or month, specify the concepts in detail).

# LIMITATIONS OF LESSONS #

Lessons are AI generated, and thus can only do so much. They can explain things, run activities which are mostly reading, flashcards, production (writing and translation exercises) and fill in the blank type exercises.

A lesson should cover specifically a new idea or concept and should allow for a combination of these things. At the moment lessons are not allowed to involve listening or speaking. They should be grounded in a way that the user can actively learn and practice using the before mentioned activities.

Only include output specified below and do not include any trailing or leading information. Output in XML format.

Your output should be structured as follows:

<curriculum>

<Month name="THEME OF THIS MONTH" description="2-3 SENTENCE DESCRIPTION OF WHAT THIS MONTH IS ABOUT">

<Week name="THEME OF THIS WEEK" description="2-3 SENTENCE DESCRIPTION OF WHAT THIS WEEK IS ABOUT">

<Lesson name="NAME OF LESSON">
- Bullet point 1 discussing what the lesson covers
- Bullet point 2 discussing what the lesson covers
- Bullet point 3 discussing what the lesson covers
- Bullet point 4 discussing what the lesson covers
</Lesson>

</Week>

</Month>

</curriculum>

## USER GOAL

{{userGoal}}
`.trim();

// ============================================================================
// TEST CASES
// ============================================================================

export const CURRICULUM_TEST_CASES: TestCase<CurriculumInputs>[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // SET 1: BROAD — AI summary with minimal specifics, just level + target
  // ──────────────────────────────────────────────────────────────────────────

  {
    name: '[Broad] A0 → A2: Absolute Beginner to Survival Spanish',
    description: 'Zero knowledge, targeting basic survival competency.',
    inputs: {
      userGoal: `The learner is a complete beginner (day one) starting from zero Spanish. They need a 6-month curriculum to reach conversational fluency — able to chat naturally with strangers at a bar, handle small talk, share stories, express opinions, and keep conversations flowing. They will complete 4 lessons per week (approximately 96 lessons total). The curriculum should cover: foundational grammar (present tense, past tenses including preterite and imperfect, future expressions, question formation), essential conversational structures (expressing likes/dislikes, making suggestions, agreeing/disagreeing, storytelling), subjunctive mood for expressing emotions, wishes, and doubts, conditional tenses for hypotheticals and polite requests, practical everyday vocabulary across topics like hobbies, work, travel, food, relationships, current events, and natural connecting phrases and fillers that make conversation sound authentic. By the end, the learner should be able to handle spontaneous conversations confidently with personality and nuance, not just survive but thrive in real-world interactions.`,
    },
  },
  // {
  //   name: '[Broad] A2 → B1: Elementary to Intermediate',
  //   description: 'Has basics, needs to bridge to real conversation.',
  //   inputs: {
  //     userGoal: `The learner is at A2 level. They can handle basic present-tense conversations, know common vocabulary, and understand simple written Spanish. The curriculum should take them to B1 over 3 months — introducing past tenses, expanding vocabulary, and building the ability to discuss everyday topics in connected sentences.`,
  //   },
  // },
  // {
  //   name: '[Broad] B1 → B2: Intermediate to Upper-Intermediate',
  //   description: 'Conversational but needs depth and fluency.',
  //   inputs: {
  //     userGoal: `The learner is at B1 level with solid conversational ability in present and past tenses. They need a 3-month curriculum to reach B2 — mastering subjunctive mood, conditional structures, advanced vocabulary, and the ability to express nuanced opinions, hypotheticals, and arguments in writing and reading.`,
  //   },
  // },
  // {
  //   name: '[Broad] B2 → C1: Upper-Intermediate to Advanced',
  //   description: 'Strong speaker aiming for near-native proficiency.',
  //   inputs: {
  //     userGoal: `The learner is at B2 level with strong reading and writing skills and comfortable use of all major tenses including subjunctive. The curriculum should target C1 over 4 months — focusing on advanced grammar nuances, idiomatic expressions, register variation (formal/informal/academic), complex text comprehension, and sophisticated written argumentation.`,
  //   },
  // },

  // ──────────────────────────────────────────────────────────────────────────
  // SET 2: MODERATE — Same 4 levels but with more detail on what the learner
  // currently knows and what specifically needs to be covered
  // ──────────────────────────────────────────────────────────────────────────

  //   {
  //     name: '[Moderate] A0 → A2: Absolute Beginner to Survival Spanish',
  //     description: 'Zero knowledge with specific skill targets listed.',
  //     inputs: {
  //       userGoal: `The learner is a complete beginner with zero Spanish knowledge. Target: A2 in 2 months.

  // Current abilities: None. Cannot produce or recognise any Spanish beyond "hola" and "gracias".

  // The curriculum needs to cover:
  // - Spanish alphabet and pronunciation rules
  // - Core vocabulary: greetings, numbers 1-100, days/months, colours, food, family, common objects
  // - Present tense for regular -ar/-er/-ir verbs and key irregulars (ser, estar, tener, ir, querer, poder, hacer)
  // - Ser vs estar basics
  // - Gender and number agreement (el/la, -o/-a, plurals)
  // - Question formation (qué, dónde, cuándo, cuánto, cómo, por qué)
  // - Basic negation
  // - Simple transactional scenarios: ordering food, asking for directions, introducing oneself, shopping
  // - Reading simple signs, menus, and short texts`,
  //     },
  //   },
  //   {
  //     name: '[Moderate] A2 → B1: Elementary to Intermediate',
  //     description: 'Clear baseline and gap analysis for the A2-B1 bridge.',
  //     inputs: {
  //       userGoal: `The learner is at A2 level. Target: B1 in 3 months.

  // What they already know:
  // - Present tense (regular and common irregulars) used comfortably
  // - Core vocabulary (~800-1000 words): daily life, food, family, travel basics, work, hobbies
  // - Basic question formation and negation
  // - Ser vs estar in common contexts
  // - Can read simple texts and write short sentences

  // What needs to be covered:
  // - Preterite tense (regular and irregular) for completed past actions
  // - Imperfect tense for descriptions, habits, and ongoing past states
  // - Preterite vs imperfect distinction in narrative context
  // - Introduction to future tense (ir + a + infinitive and simple future)
  // - Reflexive verbs and daily routine vocabulary
  // - Direct and indirect object pronouns (lo, la, le, les)
  // - Por vs para
  // - Expanded vocabulary: health, emotions, opinions, news, workplace, travel logistics
  // - Connected discourse: linking sentences with conjunctions (porque, cuando, mientras, aunque)
  // - Writing short paragraphs and reading mid-length texts`,
  //     },
  //   },
  //   {
  //     name: '[Moderate] B1 → B2: Intermediate to Upper-Intermediate',
  //     description:
  //       'Solid intermediate with specific grammar and fluency targets.',
  //     inputs: {
  //       userGoal: `The learner is at B1 level. Target: B2 in 3 months.

  // What they already know:
  // - All indicative tenses (present, preterite, imperfect, future) used with reasonable accuracy
  // - Vocabulary of ~2000+ words across common topics
  // - Can narrate past events, make future plans, and express simple opinions
  // - Object pronouns and reflexive verbs
  // - Can read articles and write structured paragraphs

  // What needs to be covered:
  // - Present subjunctive: formation and triggers (quiero que, es importante que, dudo que, ojalá)
  // - Imperfect subjunctive and conditional for hypotheticals (si tuviera... haría...)
  // - Conditional tense for polite requests and hypothetical outcomes
  // - Advanced object pronoun usage (double pronouns: se lo dije)
  // - Passive constructions and impersonal se
  // - Expanded connectors and discourse markers (sin embargo, por lo tanto, en cambio, a pesar de que)
  // - Vocabulary expansion: abstract concepts, politics, environment, culture, professional contexts
  // - Formal vs informal register
  // - Reading opinion articles and writing argumentative paragraphs
  // - Idiomatic expressions and collocations`,
  //     },
  //   },
  //   {
  //     name: '[Moderate] B2 → C1: Upper-Intermediate to Advanced',
  //     description: 'Strong B2 with precise targets for C1 mastery.',
  //     inputs: {
  //       userGoal: `The learner is at B2 level. Target: C1 in 4 months.

  // What they already know:
  // - Full command of indicative and subjunctive moods in common contexts
  // - Conditional and hypothetical structures
  // - Vocabulary of ~4000+ words including abstract and professional topics
  // - Can read newspaper articles and write structured essays
  // - Comfortable with formal and informal register

  // What needs to be covered:
  // - Advanced subjunctive: pluperfect subjunctive (hubiera/hubiese), subjunctive in relative clauses, subjunctive after conjunctions of doubt/purpose/time
  // - Nuanced tense selection in complex narratives (preterite vs imperfect vs pluperfect layering)
  // - Advanced passive and impersonal constructions
  // - Reported speech transformations in all tenses
  // - Idiomatic fluency: refranes (proverbs), collocations, phrasal verbs, regional expressions
  // - Register mastery: academic writing, formal correspondence, colloquial conversation, literary language
  // - Complex sentence architecture: relative clauses with prepositions, nominalisation, gerund vs infinitive nuances
  // - Vocabulary: literary, legal, scientific, journalistic terminology
  // - Reading: editorials, literary excerpts, technical documents
  // - Writing: formal essays, critical analysis, persuasive arguments with sophisticated structure`,
  //     },
  //   },

  // ──────────────────────────────────────────────────────────────────────────
  // SET 3: VERY SPECIFIC — Same 4 levels with exhaustive grammar inventories,
  // explicit known/unknown breakdowns, and granular lesson topic suggestions
  // ──────────────────────────────────────────────────────────────────────────

  //   {
  //     name: '[Specific] A0 → A2: Absolute Beginner to Survival Spanish',
  //     description: 'Zero knowledge with exhaustive grammar and vocab inventory.',
  //     inputs: {
  //       userGoal: `The learner has absolutely no Spanish knowledge. Target: A2 in 2 months (8 weeks).

  // CURRENT STATE: Cannot recognise or produce any Spanish. English is native language. No exposure to other Romance languages.

  // GRAMMAR TO INTRODUCE (in suggested order):
  // 1. Subject pronouns (yo, tú, él/ella, usted, nosotros, ellos/ellas, ustedes)
  // 2. Present tense regular -ar verbs (hablar, estudiar, trabajar, comprar, cocinar, caminar)
  // 3. Present tense regular -er verbs (comer, beber, leer, correr, aprender)
  // 4. Present tense regular -ir verbs (vivir, escribir, abrir, subir)
  // 5. Ser — all present forms + usage (identity, origin, profession, characteristics, time, material)
  // 6. Estar — all present forms + usage (location, temporary states, emotions, progressive)
  // 7. Ser vs estar contrast with adjectives that change meaning (aburrido, listo, malo, etc.)
  // 8. Tener — forms + idiomatic expressions (tener hambre, sed, sueño, frío, calor, miedo, razón, años)
  // 9. Ir — forms + ir + a + infinitive for near future
  // 10. Querer, poder — forms + querer/poder + infinitive
  // 11. Hacer — forms + weather expressions (hace frío, hace sol)
  // 12. Gender and number: el/la/los/las, un/una, -o/-a pattern, common exceptions (el día, la mano, el problema)
  // 13. Definite vs indefinite articles and when to omit
  // 14. Adjective agreement and placement (grande → gran, bueno → buen)
  // 15. Possessives (mi, tu, su, nuestro)
  // 16. Demonstratives (este, ese, aquel)
  // 17. Question words: qué, quién, dónde, cuándo, cuánto, cómo, por qué, cuál
  // 18. Negation: no + verb, nunca, nada, nadie, ninguno, tampoco
  // 19. Hay vs estar for existence vs location
  // 20. Prepositions: a, de, en, con, para, por (basic uses only)
  // 21. Numbers 1-1000, telling time, dates

  // VOCABULARY DOMAINS TO COVER:
  // - Greetings & farewells, pleasantries, introductions
  // - Family members, physical descriptions, personality
  // - Food & drink, restaurant ordering, grocery shopping
  // - Home, rooms, furniture, household items
  // - Daily routine verbs, time expressions (siempre, a veces, nunca, por la mañana)
  // - Directions, transport, places in a city
  // - Weather, seasons, clothing
  // - Numbers, money, shopping transactions
  // - Body parts, basic health ("me duele...")
  // - Colours, sizes, basic descriptions

  // FUNCTIONAL TARGETS:
  // - Introduce self and ask about others
  // - Order food and drinks, ask for the bill
  // - Ask for and understand basic directions
  // - Describe people, places, and daily routine
  // - Express likes/dislikes, wants, and basic needs
  // - Handle simple transactions (shopping, transport)
  // - Read and understand menus, signs, simple schedules`,
  //     },
  //   },
  //   {
  //     name: '[Specific] A2 → B1: Elementary to Intermediate',
  //     description:
  //       'Detailed A2 baseline with precise B1 grammar and vocab targets.',
  //     inputs: {
  //       userGoal: `The learner is at solid A2. Target: B1 in 3 months (12 weeks).

  // CONFIRMED KNOWLEDGE (can use with ~80% accuracy):
  // Grammar:
  // - Present tense: all regular conjugations + ser, estar, tener, ir, querer, poder, hacer, saber, conocer, dar, venir, decir, salir, poner
  // - Ser vs estar in standard contexts (not edge cases)
  // - Gender/number agreement, articles, possessives, demonstratives
  // - Question formation, basic negation
  // - Hay vs estar
  // - Ir + a + infinitive for near future
  // - Gustar-type constructions (me gusta, me encanta, me interesa)
  // - Basic prepositions (a, de, en, con, para)

  // Vocabulary (~1000 words):
  // - Daily life, food, family, house, city, transport, weather, body, clothing, colours, numbers, time, professions, hobbies

  // KNOWN WEAKNESSES:
  // - Cannot express anything in past tense
  // - No knowledge of future tense beyond ir + a + infinitive
  // - Does not understand object pronouns (lo/la/le/les)
  // - Reflexive verbs limited to "me llamo" — does not understand the system
  // - Cannot link sentences beyond y, pero, porque
  // - Ser vs estar errors with adjectives (confuses "es aburrido" vs "está aburrido")
  // - Por vs para completely unknown

  // GRAMMAR TO TEACH:
  // 1. Preterite: regular -ar/-er/-ir, then irregulars (ir/ser, hacer, tener, estar, poder, poner, saber, querer, venir, decir, traer, dar)
  // 2. Imperfect: regular forms, then irregulars (ser, ir, ver), usage (descriptions, habits, age, time, weather in past)
  // 3. Preterite vs imperfect: narrative framework (action vs background), trigger words, practice in storytelling
  // 4. Reflexive verbs: full system (levantarse, ducharse, vestirse, acostarse, sentirse, etc.), daily routine in present and past
  // 5. Direct object pronouns (lo, la, los, las) — placement rules, practice with common verbs
  // 6. Indirect object pronouns (le, les → me, te, nos) — with dar, decir, escribir, preguntar
  // 7. Por vs para: core distinctions (reason vs purpose, duration vs deadline, exchange, etc.)
  // 8. Future tense: regular + irregular (tendré, haré, podré, sabré, saldré, vendré, diré, querré)
  // 9. Conditional tense: formation + polite requests (me gustaría, podría, ¿le importaría?)
  // 10. Comparatives and superlatives (más...que, menos...que, tan...como, mejor, peor, mayor, menor)
  // 11. Conjunctions and connectors: cuando, mientras, después de que, antes de que, aunque, sin embargo, por eso, además, también, tampoco
  // 12. Introduction to present subjunctive: only after querer que, esperar que, es necesario que (awareness level, not mastery)

  // VOCABULARY EXPANSION:
  // - Emotions and mental states (preocupado, emocionado, orgulloso, frustrado, confundido)
  // - Opinions (creo que, pienso que, me parece que, en mi opinión)
  // - Health and medical basics (symptoms, doctor visit, pharmacy)
  // - Work and professional life (oficina, reunión, jefe, compañero, proyecto)
  // - Travel and logistics (reservar, vuelo, equipaje, alojamiento, itinerario)
  // - News and current events (basic: gobierno, economía, sociedad, problema, solución)
  // - Adverbs of frequency, manner, degree`,
  //     },
  //   },
  //   {
  //     name: '[Specific] B1 → B2: Intermediate to Upper-Intermediate',
  //     description: 'Thorough B1 audit with exhaustive B2 grammar syllabus.',
  //     inputs: {
  //       userGoal: `The learner is at solid B1. Target: B2 in 3 months (12 weeks).

  // CONFIRMED B1 COMPETENCIES:
  // Grammar (used with reasonable accuracy):
  // - All indicative tenses: present, preterite, imperfect, future, conditional
  // - Preterite vs imperfect distinction in narratives
  // - Reflexive verbs in all learned tenses
  // - Direct and indirect object pronouns (single, not double)
  // - Por vs para in common contexts
  // - Comparatives and superlatives
  // - Basic present subjunctive after quiero que, espero que, es necesario que
  // - Gustar-type verbs, ser vs estar (standard cases)

  // Vocabulary (~2500 words):
  // - Daily life, work, travel, health, emotions, opinions, news, hobbies, food, family, city, nature

  // Reading: Can understand straightforward factual articles, simple stories, emails
  // Writing: Can write structured paragraphs about familiar topics with some errors

  // KNOWN GAPS AND WEAKNESSES:
  // - Present subjunctive only partially learned — limited triggers, avoids it in free production
  // - No knowledge of imperfect subjunctive
  // - Cannot form hypothetical si-clauses (si tuviera..., si hubiera...)
  // - Double object pronouns (se lo) completely unknown
  // - Passive voice and impersonal se not covered
  // - Discourse markers limited to básico ones (pero, porque, sin embargo)
  // - Formal register mostly unknown — defaults to informal tú in all contexts
  // - Idiomatic expressions very limited
  // - Struggles with relative clauses beyond simple "que"

  // GRAMMAR SYLLABUS:
  // 1. Present subjunctive: full trigger inventory
  //    - Volition: querer que, pedir que, recomendar que, sugerir que, preferir que, exigir que, prohibir que, permitir que
  //    - Emotion: alegrarse de que, tener miedo de que, sorprender que, molestar que
  //    - Doubt/denial: dudar que, no creer que, no pensar que, negar que, es improbable que
  //    - Impersonal expressions: es importante que, es necesario que, es posible que, es mejor que, es una lástima que
  //    - Purpose: para que, a fin de que
  //    - Time (future reference): cuando, hasta que, en cuanto, tan pronto como, antes de que
  //    - Concession: aunque + subjunctive (uncertain) vs aunque + indicative (factual)
  //    - Relative clauses with unknown/nonexistent antecedent: "Busco a alguien que hable..."
  //    - Ojalá (que) + present/imperfect subjunctive

  // 2. Imperfect subjunctive: -ra/-se forms, usage with past triggers, si-clauses
  // 3. Conditional perfect + pluperfect subjunctive for past hypotheticals (si hubiera sabido, habría ido)
  // 4. Double object pronouns: se lo, se la, se los, se las — placement and usage
  // 5. Passive voice: ser + past participle, passive se, impersonal se
  // 6. Reported speech: present → past transformations across all tenses
  // 7. Relative pronouns: que, quien, el/la cual, lo que, cuyo, donde, cuando used as relative
  // 8. Advanced connectors: no obstante, por lo tanto, en cambio, a pesar de que, dado que, de modo que, siempre y cuando, con tal de que, a menos que
  // 9. Conditional for speculation about present (serían las 3, tendría unos 30 años)

  // VOCABULARY TARGETS:
  // - Abstract concepts: libertad, igualdad, justicia, desarrollo, impacto, tendencia
  // - Politics and society: gobierno, elecciones, ley, derechos, inmigración, medio ambiente
  // - Professional/academic: investigación, resultado, argumento, conclusión, hipótesis
  // - Emotions (nuanced): agobiado, agradecido, decepcionado, indignado, nostálgico, aliviado
  // - Idiomatic expressions (20-30 common ones): meter la pata, estar hecho polvo, no tener ni idea, dar en el clavo, tomar el pelo
  // - Collocations: tomar una decisión, hacer caso, prestar atención, llevar a cabo, poner en marcha`,
  //     },
  //   },
  //   {
  //     name: '[Specific] B2 → C1: Upper-Intermediate to Advanced',
  //     description: 'Comprehensive B2 baseline with granular C1 mastery targets.',
  //     inputs: {
  //       userGoal: `The learner is at solid B2. Target: C1 in 4 months (16 weeks).

  // CONFIRMED B2 COMPETENCIES:
  // Grammar:
  // - Full indicative system (all tenses, including pluperfect and future perfect)
  // - Present and imperfect subjunctive in standard triggers
  // - Si-clauses: open (si tengo) and contrary-to-fact present (si tuviera)
  // - Passive voice and impersonal se
  // - Double object pronouns
  // - Reported speech in common patterns
  // - Basic relative clauses with que, quien, donde

  // Vocabulary (~4000+ words):
  // - Can discuss abstract topics (politics, environment, culture, education, technology)
  // - Reads newspaper articles and opinion pieces comfortably
  // - Writes structured essays with clear argumentation

  // Reading: Handles most authentic texts with occasional dictionary lookups
  // Writing: Produces well-organised essays with some stylistic limitations

  // KNOWN GAPS:
  // - Pluperfect subjunctive (hubiera/hubiese + participle) only partially controlled
  // - Past hypotheticals (si hubiera..., habría...) often avoided or formed incorrectly
  // - Subjunctive in relative clauses still shaky (Busco algo que sea vs Tengo algo que es)
  // - Subjunctive after temporal conjunctions in past contexts inconsistent
  // - Cannot reliably distinguish register in writing (mixes informal/formal inadvertently)
  // - Relative pronouns beyond que and quien rarely used (el cual, cuyo underused)
  // - Gerund vs infinitive nuances not fully understood
  // - Nominalisation weak (turning verbs/adjectives into noun phrases)
  // - Academic/literary vocabulary limited
  // - Regional variation awareness minimal

  // GRAMMAR SYLLABUS:
  // 1. Pluperfect subjunctive mastery: hubiera/hubiese + past participle in all trigger contexts
  // 2. Full hypothetical system:
  //    - Present contrary-to-fact: si tuviera → tendría/habría
  //    - Past contrary-to-fact: si hubiera tenido → habría tenido
  //    - Mixed conditionals: si hubiera estudiado → ahora sabría
  //    - De + infinitive as si-clause alternative (de haberlo sabido...)
  // 3. Subjunctive in all clause types (comprehensive review):
  //    - Adjectival clauses with definite vs indefinite antecedent
  //    - Adverbial clauses: temporal, concessive, purpose, conditional, manner
  //    - Noun clauses: after verbs of influence, emotion, doubt, denial, judgement
  //    - "Como si" + imperfect/pluperfect subjunctive
  // 4. Advanced relative constructions:
  //    - el/la/los/las + que, el/la cual, lo cual, lo que (abstract reference)
  //    - cuyo/cuya (possession) in formal writing
  //    - Preposition + relative pronoun (en el que, con el cual, para lo que)
  // 5. Gerund nuances: progressive vs adverbial use, gerund vs infinitive after perception verbs
  // 6. Advanced passive: estar + participle (resultant state), passive with se, agent inclusion (por)
  // 7. Nominalisation strategies: el hecho de que, lo importante es que, lo + adjective
  // 8. Reported speech in complex tenses (future → conditional, subjunctive → past subjunctive)
  // 9. Discourse-level grammar: fronting, cleft sentences (lo que pasa es que), emphasis with sí + verb
  // 10. Register markers: academic hedging (cabe señalar, se podría argumentar), formal closings, colloquial intensifiers

  // VOCABULARY & STYLE TARGETS:
  // - Literary language: metaphor, narrative voice, descriptive precision
  // - Academic: hipótesis, análisis, marco teórico, planteamiento, cuestionar, abordar, poner de manifiesto
  // - Legal/bureaucratic: expediente, trámite, recurso, dictamen, resolución, instancia
  // - Journalism: portavoz, suceso, siniestro, fuentes cercanas, según consta
  // - Proverbs and refranes (20+): no hay mal que por bien no venga, en boca cerrada no entran moscas, más vale tarde que nunca
  // - Regional awareness: vosotros (Spain) vs ustedes (LatAm), voseo (Argentina), leísmo/laísmo, key vocabulary differences (coche/carro/auto, ordenador/computadora)
  // - Colloquial fluency: filler words (o sea, bueno, pues, es que), intensifiers (mogollón, un montón, súper, re-), slang awareness
  // - Collocations and phrasal verbs: hacerse cargo, echar de menos, caer bien/mal, dar por sentado, poner en duda, sacar partido, hacer hincapié`,
  //     },
  //   },
];

// ============================================================================
// MODELS TO TEST
// ============================================================================

export const CURRICULUM_MODELS: ModelConfig[] = [
  {
    provider: 'anthropic' as const,
    model: 'claude-sonnet-4-5',
    temperature: 1,
    maxTokens: 40000,
  },
  {
    provider: 'anthropic' as const,
    model: 'claude-haiku-4-5',
    temperature: 1,
    maxTokens: 40000,
  },
];

// ============================================================================
// EXPORT CONFIG (uses raw text output for XML)
// ============================================================================

const RawXmlOutputSchema = z.string();

export const CURRICULUM_TEST_CONFIG: PromptTestConfig<
  CurriculumInputs,
  string
> = {
  featureName: 'Curriculum Generation (XML)',
  promptTemplate: CURRICULUM_PROMPT_TEMPLATE,
  outputSchema: RawXmlOutputSchema,
  testCases: CURRICULUM_TEST_CASES,
  models: CURRICULUM_MODELS,
  useRawTextOutput: true,
  runSequential: false,
};
