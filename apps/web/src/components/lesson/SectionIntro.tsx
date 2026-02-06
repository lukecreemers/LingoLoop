interface SectionIntroProps {
  sectionName: string;
  sectionIndex: number;
  totalSections: number;
  onContinue: () => void;
}

const SECTION_THEMES = [
  {
    bg: "bg-bauhaus-blue",
    text: "text-bauhaus-blue",
    hover: "hover:bg-blue-700",
    decoOpacity: "bg-blue-500",
    border: "border-bauhaus-blue",
  },
  {
    bg: "bg-bauhaus-red",
    text: "text-bauhaus-red",
    hover: "hover:bg-red-700",
    decoOpacity: "bg-red-500",
    border: "border-bauhaus-red",
  },
  {
    bg: "bg-bauhaus-green",
    text: "text-bauhaus-green",
    hover: "hover:bg-emerald-700",
    decoOpacity: "bg-emerald-500",
    border: "border-bauhaus-green",
  },
  {
    bg: "bg-amber-500",
    text: "text-amber-500",
    hover: "hover:bg-amber-600",
    decoOpacity: "bg-amber-400",
    border: "border-amber-500",
  },
];

export default function SectionIntro({
  sectionName,
  sectionIndex,
  totalSections,
  onContinue,
}: SectionIntroProps) {
  const theme = SECTION_THEMES[sectionIndex % SECTION_THEMES.length];

  return (
    <div className="h-full bg-bauhaus-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-0 w-32 h-32 ${theme.decoOpacity} opacity-5 -translate-x-8 -translate-y-8`}
        />
        <div
          className={`absolute bottom-0 right-0 w-48 h-48 ${theme.decoOpacity} opacity-5 translate-x-12 translate-y-12 rotate-45`}
        />
        <div
          className={`absolute top-1/3 right-12 w-4 h-4 ${theme.decoOpacity} opacity-20 rotate-45`}
        />
        <div
          className={`absolute bottom-1/3 left-16 w-6 h-6 border-2 ${theme.border} opacity-20 rotate-12`}
        />
      </div>

      {/* Content */}
      <div className="text-center max-w-lg relative z-10">
        {/* Section number badge */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-16 h-16 ${theme.bg} text-white flex items-center justify-center
              text-2xl font-black border-2 border-black bauhaus-shadow`}
          >
            {sectionIndex + 1}
          </div>
        </div>

        {/* Section label */}
        <p className="text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase mb-3">
          Section {sectionIndex + 1} of {totalSections}
        </p>

        {/* Section name */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 leading-tight">
          {sectionName}
          <span className={theme.text}>.</span>
        </h1>

        {/* Decorative line */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className={`w-12 h-1 ${theme.bg}`} />
          <div className="w-2 h-2 bg-black rotate-45" />
          <div className={`w-12 h-1 ${theme.bg}`} />
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className={`px-12 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
            ${theme.bg} text-white ${theme.hover} bauhaus-shadow
            transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
        >
          Start Section →
        </button>
      </div>
    </div>
  );
}
