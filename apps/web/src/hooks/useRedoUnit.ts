import { useState, useCallback } from "react";
import { useLessonStore, useCurrentUnit } from "../stores/useLessonStore";
import type { CompiledUnit, LessonPlanUnit } from "@shared";

interface RedoUnitInput {
  unitPlan: LessonPlanUnit;
  previousOutput: CompiledUnit;
  userLevel: string;
  targetLanguage?: string;
  nativeLanguage?: string;
}

/**
 * Hook to handle redoing (regenerating) the current unit
 */
export function useRedoUnit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCurrentUnit = useLessonStore((s) => s.updateCurrentUnit);
  const setIsRedoing = useLessonStore((s) => s.setIsRedoing);
  const currentUnit = useCurrentUnit();

  const redoUnit = useCallback(
    async (unitPlan: LessonPlanUnit) => {
      if (!currentUnit) {
        setError("No current unit to redo");
        return null;
      }

      setIsLoading(true);
      setIsRedoing(true);
      setError(null);

      try {
        const input: RedoUnitInput = {
          unitPlan,
          previousOutput: currentUnit,
          userLevel: "intermediate", // TODO: Get from user context
          targetLanguage: "Spanish",
          nativeLanguage: "English",
        };

        const response = await fetch("/api/lessons/redo-unit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          throw new Error("Failed to regenerate unit");
        }

        const data = await response.json();
        const newUnit = data.data as CompiledUnit;

        // Update the current unit in the store
        updateCurrentUnit(newUnit);

        return newUnit;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to regenerate";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        setIsRedoing(false);
      }
    },
    [currentUnit, updateCurrentUnit, setIsRedoing]
  );

  return { redoUnit, isLoading, error };
}

