import "./App.css";
import FillInBlanks from "./features/units/FillInBlanks";
import type {
  CGOutput,
  FIBOutput,
  SGOutput,
  TGOutput,
  WIBOutput,
  WMMOutput,
} from "@shared";
import WriteInBlanks from "./features/units/WriteInBlanks";
import WordMeaningMatch from "./features/units/WordMeaningMatch";
import Conversation from "./features/units/Conversation";
import Story from "./features/units/Story";
import Translation from "./features/units/Translation";

const dummyFIBData: FIBOutput = {
  exercises: [
    {
      template: "Hola, me [*] María y soy de México.",
      answers: ["llamo"],
      distractors: ["llamamos", "llamar", "soy"],
    },
    {
      template: "Yo [*] ingeniero y estoy muy feliz en mi trabajo.",
      answers: ["soy"],
      distractors: ["somos", "ser", "estoy"],
    },
    {
      template: "¿Cómo [*] tú? ¿Dónde estás ahora?",
      answers: ["estás"],
      distractors: ["está", "estar", "eres"],
    },
    {
      template: "Hola, me [*] María y [*] de España.",
      answers: ["llamo", "soy"],
      distractors: ["llamas", "eres", "llamar", "estoy", "estás", "sería"],
    },
    {
      template: "[*] Juan, ¿cómo [*]?",
      answers: ["Soy", "estás"],
      distractors: ["Eres", "Sois", "Somos", "estoy", "estamos", "están"],
    },
    {
      template: "¿Dónde [*]? Yo [*] en casa.",
      answers: ["estás", "estoy"],
      distractors: ["eres", "soy", "estamos", "están", "estaré", "estaba"],
    },
    {
      template: "Hola, me [*] Juan y [*] de México.",
      answers: ["llamo", "soy"],
      distractors: ["llamas", "eres", "llamaba", "estoy", "sou", "ser"],
    },
    {
      template: "[*] muy feliz de conocerte. ¿Cómo [*]?",
      answers: ["Estoy", "estás"],
      distractors: ["Soy", "Estamos", "Somos", "soy", "está", "son"],
    },
    {
      template: "Mi amigo [*] ingeniero y [*] en Madrid.",
      answers: ["es", "está"],
      distractors: ["está", "soy", "estamos", "son", "sois", "estoy"],
    },
    {
      template: "Hola, me [*] Juan y [*] de España.",
      answers: ["llamo", "soy"],
      distractors: ["llamas", "estoy", "nombre", "llamar", "estás", "seres"],
    },
  ],
};

const dummyWIBData: WIBOutput = {
  exercises: [
    {
      template: "Yo [*] con mis amigos en la escuela todos los días.",
      blanks: [
        {
          correctAnswer: "hablo",
          clue: "(hablar)",
          acceptedAlternates: [],
        },
      ],
    },
    {
      template: "Tú [*] mucho en la biblioteca después de la escuela.",
      blanks: [
        {
          correctAnswer: "estudias",
          clue: "(estudiar)",
          acceptedAlternates: [],
        },
      ],
    },
    {
      template: "Nosotros [*] en la mesa de la casa mañana.",
      blanks: [
        {
          correctAnswer: "cocinamos",
          clue: "(cocinar)",
          acceptedAlternates: [],
        },
      ],
    },
  ],
};

const dummyWMMData: WMMOutput = {
  exercises: [
    {
      columnLabels: {
        a: "Spanish Greeting/Introduction",
        b: "English Translation",
      },
      pairs: [
        ["¿Hola, cómo estás?", "Hi, how are you?"],
        ["Me llamo...", "My name is..."],
        ["Mucho gusto", "Nice to meet you"],
        ["Buenos días", "Good morning"],
        ["Buenas noches", "Good evening/night"],
        ["¿Cómo te llamas?", "What is your name?"],
        ["Encantado/Encantada", "Delighted/pleased to meet you"],
      ],
      distractors: [
        "Good day (general greeting)",
        "How are you doing?",
        "What is your family?",
      ],
      instruction:
        "Match each Spanish greeting or introduction phrase with its correct English translation.",
    },
  ],
};

const dummyCGData: CGOutput = {
  characters: [
    {
      name: "Carlos",
      age: "adult",
      gender: "male",
    },
    {
      name: "Elena",
      age: "adult",
      gender: "female",
    },
  ],
  conversation:
    "**Carlos**: Hola, ¿qué tal? Soy Carlos. ¿Y tú? ¿Cómo te llamas?\n\n**Elena**: Mucho gusto, Carlos. Me llamo Elena. Encantada de conocerte.\n\n**Carlos**: Encantado. Oye, ¿de dónde eres? No te conozco de por aquí.\n\n**Elena**: Soy de Guadalajara, pero ahora vivo aquí en la ciudad. Me mudé hace tres meses. ¿Y tú? ¿De dónde eres?\n\n**Carlos**: Ah, qué interesante. Yo soy de aquí, del área. Nací y crecí en esta ciudad. ¿Y qué haces? ¿A qué te dedicas?\n\n**Elena**: Trabajo en una oficina. Soy diseñadora gráfica. Es un trabajo interesante, aunque a veces es muy ocupado. ¿Y tú, Carlos? ¿Cuál es tu profesión?\n\n**Carlos**: Yo trabajo como profesor de inglés en una escuela privada. Me gusta mucho enseñar, especialmente cuando los estudiantes son curiosos y quieren aprender.\n\n**Elena**: Qué bonito. Los profesores son muy importantes. Yo siempre digo que la educación es fundamental. ¿Te gusta vivir en esta ciudad?\n\n**Carlos**: Sí, claro. La ciudad es grande pero también es hermosa. Hay mucho que hacer. Aunque extraño los días tranquilos en el rincón donde crecí. ¿Y tú? ¿Cómo te adaptas a la vida aquí?\n\n**Elena**: Muy bien, gracias por preguntar. He conocido personas muy amables. Mi familia vive todavía en Guadalajara, pero ellos vienen a visitarme a mi casa de vez en cuando. La extraño, pero también estoy feliz de esta nueva experiencia.\n\n**Carlos**: Eso es maravilloso. Los amigos nuevos y las nuevas experiencias siempre son valiosas. Oye, ¿vienes a estos eventos frecuentemente?\n\n**Elena**: No, la verdad es que es la primera vez. Un amigo me invitó. ¿Y tú? ¿Vienes siempre?\n\n**Carlos**: Sí, vengo bastante. Son muy divertidos y puedo conocer a personas interesantes como tú. Bueno, me alegra mucho haber conocido a Elena. ¿Te gustaría tomar algo? Vamos a la mesa a buscar un refresco.",
};

const dummySGData: SGOutput = {
  story:
    'En un pequeño café en el centro de la ciudad, María está sentada en una silla cerca de la ventana. De repente, ve a su amigo Juan que entra por la puerta. "¡Hola, Juan! ¿Qué tal? ¿Cómo estás?", pregunta María con una sonrisa feliz. Juan responde: "¡Hola, María! Estoy muy bien, gracias. ¿Y tú? ¿Qué tal tu día?" María le contesta: "Excelente. Acabo de terminar el trabajo. Cuéntame, ¿qué haces en tu empresa? ¿Es interesante?" Juan explica: "Sí, trabajo como ingeniero. Desarrollamos proyectos grandes y pequeños. Es un trabajo muy bueno y siempre aprovecho para aprender cosas nuevas." María sonríe y dice: "¡Qué maravilloso! Me alegra mucho que estés feliz. Vamos a tomar un café juntos como siempre." Ambos amigos se sientan alrededor de la mesa, beben café caliente y disfrutan de esta mañana extraordinaria en su rincón favorito del café.',
};

const dummyTGData: TGOutput = {
  paragraph:
    "Hello, my name is Maria, and I am happy to meet you today. I am from a small town near Madrid, Spain, where I grew up with my family in a big house. Currently, I work as a teacher at a local school, and I really enjoy helping students develop their skills every day. I spend my mornings in the classroom and my evenings reading books or spending time with friends. I hope we can stay in touch and build a great friendship together!",
  translation:
    "Hola, mi nombre es María, y estoy feliz de conocerte hoy. Soy de un pueblo pequeño cerca de Madrid, España, donde crecí con mi familia en una casa grande. Actualmente, trabajo como maestra en una escuela local, y realmente disfruto ayudando a los estudiantes a desarrollar sus habilidades todos los días. Paso mis mañanas en el aula y mis noches leyendo libros o pasando tiempo con amigos. ¡Espero que podamos mantenernos en contacto y construir una gran amistad juntos!",
};

function App() {
  return (
    <div>
      {/* <FillInBlanks
        data={dummyFIBData}
        onComplete={() => {}}
      /> */}
      {/* <WriteInBlanks
        data={dummyWIBData}
        onComplete={() => {}}
      /> */}
      {/* <WordMeaningMatch
        data={dummyWMMData}
        onComplete={() => {}}
      /> */}
      {/* <Conversation
        data={dummyCGData}
        onComplete={() => {}}
      /> */}
      {/* <Story
        data={dummySGData}
        onComplete={() => {}}
      /> */}
      <Translation
        data={dummyTGData}
        onComplete={() => {}}
      />
    </div>
  );
}

export default App;
