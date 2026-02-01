interface ActionBarProps {
  // Primary action
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryVariant?: "blue" | "green" | "black";
  isLoading?: boolean;

  // Secondary action (optional)
  secondaryLabel?: string;
  onSecondary?: () => void;
}

const VARIANT_CLASSES = {
  blue: "bg-bauhaus-blue text-white hover:bg-blue-700",
  green: "bg-bauhaus-green text-white hover:bg-emerald-700",
  black: "bg-black text-white hover:bg-zinc-800",
};

export default function ActionBar({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryVariant = "blue",
  isLoading = false,
  secondaryLabel,
  onSecondary,
}: ActionBarProps) {
  return (
    <footer className="shrink-0 bg-white border-t-4 border-black p-6 z-10">
      <div className="max-w-3xl mx-auto flex justify-between">
        {/* Secondary Action */}
        {secondaryLabel && onSecondary ? (
          <button
            onClick={onSecondary}
            className="px-8 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
              bg-white text-black hover:bg-zinc-100 bauhaus-shadow
              transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {secondaryLabel}
          </button>
        ) : (
          <div />
        )}

        {/* Primary Action */}
        <button
          onClick={onPrimary}
          disabled={primaryDisabled || isLoading}
          className={`
            px-10 py-4 text-lg font-bold uppercase tracking-widest border-2 border-black
            transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
            ${
              primaryDisabled || isLoading
                ? "bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed"
                : `${VARIANT_CLASSES[primaryVariant]} bauhaus-shadow`
            }
          `}
        >
          {isLoading ? "Loading..." : primaryLabel}
        </button>
      </div>
    </footer>
  );
}

