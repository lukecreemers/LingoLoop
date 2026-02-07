import type { ReactNode } from "react";
import UnitHeader from "./UnitHeader";
import ActionBar from "./ActionBar";

interface UnitShellProps {
  // Header props
  title: string;
  accentColor?: "red" | "blue" | "green";
  showScore?: boolean;
  showProgress?: boolean;
  onClose?: () => void;

  // Content
  children: ReactNode;

  // Action bar props
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryVariant?: "blue" | "green" | "black";
  isLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function UnitShell({
  // Header
  title,
  accentColor = "red",
  showScore = true,
  showProgress = true,
  onClose,

  // Content
  children,

  // Actions
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryVariant = "blue",
  isLoading = false,
  secondaryLabel,
  onSecondary,
}: UnitShellProps) {
  return (
    <div className="h-full bg-bauhaus-white text-black font-sans flex flex-col selection:bg-blue-200 overflow-hidden">
      <UnitHeader
        title={title}
        accentColor={accentColor}
        showScore={showScore}
        showProgress={showProgress}
        onClose={onClose}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-8 flex flex-col min-h-0 py-4 overflow-hidden">
        {children}
      </main>

      <ActionBar
        primaryLabel={primaryLabel}
        onPrimary={onPrimary}
        primaryDisabled={primaryDisabled}
        primaryVariant={primaryVariant}
        isLoading={isLoading}
        secondaryLabel={secondaryLabel}
        onSecondary={onSecondary}
      />
    </div>
  );
}
