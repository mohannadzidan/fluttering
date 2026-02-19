import { useEffect, useRef } from "react";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";

interface FlagCreateRowProps {
  projectId: string;
  parentId?: string | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Inline form row for creating a new flag.
 * Auto-focused text input for flag name.
 * Confirms on Enter (validates name), cancels on Escape.
 * Optionally creates the flag as a child of a parent flag.
 */
export function FlagCreateRow({
  projectId,
  parentId = null,
  onDone,
  onCancel,
}: FlagCreateRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addFlag = useFeatureFlagsStore((state) => state.addFlag);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const name = inputRef.current?.value.trim() ?? "";

      if (!name) {
        // Highlight input with red ring
        inputRef.current?.classList.add("ring-2", "ring-red-500");
        return;
      }

      // Create the flag with optional parentId
      addFlag(projectId, name, "boolean", parentId);
      onDone();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <li className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
      {/* Name input */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Flag name..."
        className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        onKeyDown={handleKeyDown}
        onBlur={() => {
          inputRef.current?.classList.remove("ring-2", "ring-red-500");
        }}
      />

      {/* Spacer to align with other rows */}
      <div className="flex-1" />

      {/* Type selector (placeholder - always Boolean for now) */}
      <span className="text-xs text-muted-foreground">Boolean</span>
    </li>
  );
}
