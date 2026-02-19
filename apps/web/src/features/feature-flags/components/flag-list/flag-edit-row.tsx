import { useEffect, useRef } from "react";
import { CalendarClock, CalendarPlus } from "lucide-react";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { formatFlagTime } from "../../utils/format-time";
import { FlagTypeIcon } from "../flag-type-icon";
import type { AnyFlag } from "../../types";

interface FlagEditRowProps {
  flag: AnyFlag;
  projectId: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Inline form row for editing a flag.
 * Same visual layout as FlagRow but name and type are editable.
 * Confirms on Enter (validates name), cancels on Escape.
 */
export function FlagEditRow({ flag, projectId, onDone, onCancel }: FlagEditRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateFlag = useFeatureFlagsStore((state) => state.updateFlag);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
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

      // Update the flag
      updateFlag(projectId, flag.id, { name, type: flag.type });
      onDone();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <li className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
      {/* Editable name input */}
      <input
        ref={inputRef}
        type="text"
        defaultValue={flag.name}
        className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        onKeyDown={handleKeyDown}
        onBlur={() => {
          inputRef.current?.classList.remove("ring-2", "ring-red-500");
        }}
      />

      {/* Type icon */}
      <FlagTypeIcon type={flag.type} className="h-4 w-4 text-cosmic" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Created timestamp (read-only) */}
      <div className="flex items-center gap-2">
        <CalendarPlus className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-radiate">{formatFlagTime(flag.createdAt)}</span>
      </div>

      {/* Updated timestamp (read-only) */}
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-radiate">{formatFlagTime(flag.updatedAt)}</span>
      </div>

      {/* Spacer for menu button area */}
      <div className="w-8" />
    </li>
  );
}
