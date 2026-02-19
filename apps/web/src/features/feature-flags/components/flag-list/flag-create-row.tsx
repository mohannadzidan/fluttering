import { useEffect, useRef, useState } from "react";
import { useRender, mergeProps } from "@base-ui/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { TypePicker } from "../enum-types/type-picker";
import type { AnyFlag } from "../../types";

interface FlagCreateRowProps {
  projectId: string;
  parentId?: string | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Helper component: renders a styled flag element (matching flag-row.tsx design)
 */
function FlagElement({ render, className, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: {
      ...props,
      className: cn("border rounded-full px-2 bg-card flex items-center z-1 gap-2", className),
    },
  });
}

/**
 * Inline form row for creating a new flag with type assignment.
 *
 * Local state: { name, selectedType, selectedEnumTypeId }
 *
 * Layout:
 * - Auto-focused name input
 * - Type picker (shows "+ Type" or selected type preview)
 * - Create button (disabled until name + type are set)
 * - Enter key creates, Escape / blur cancel
 */
export function FlagCreateRow({
  projectId,
  parentId = null,
  onDone,
  onCancel,
}: FlagCreateRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const addFlag = useFeatureFlagsStore((state) => state.addFlag);
  const enumTypes = useFeatureFlagsStore((state) => state.enumTypes);

  // Local state for type selection
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<"boolean" | "enum" | null>(null);
  const [selectedEnumTypeId, setSelectedEnumTypeId] = useState<string | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canCreate = name.trim().length > 0 && selectedType !== null;

  const handleTypeSelect = (type: "boolean" | "enum", enumTypeId?: string) => {
    setSelectedType(type);
    setSelectedEnumTypeId(enumTypeId ?? null);
    setTypePickerOpen(false);
  };

  const handleCreate = () => {
    if (!canCreate) return;

    const trimmedName = name.trim();
    addFlag(projectId, trimmedName, selectedType, parentId, selectedEnumTypeId ?? undefined);
    onDone();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canCreate) {
        handleCreate();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  // Render the type preview or "+ Type" label
  const getTypeDisplay = () => {
    if (selectedType === null) {
      return <span className="text-sm text-muted-foreground">+ Type</span>;
    }

    if (selectedType === "boolean") {
      return (
        <span className="text-sm font-medium">Boolean</span>
      );
    }

    // Enum type selected
    const enumType = enumTypes.find((et) => et.id === selectedEnumTypeId);
    if (enumType) {
      const defaultValue = enumType.values[0];
      return (
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium">{enumType.name}</span>
          <span className="text-xs text-muted-foreground">({defaultValue})</span>
        </div>
      );
    }

    // Fallback (shouldn't happen)
    return <span className="text-sm text-muted-foreground">Select type…</span>;
  };

  return (
    <li
      ref={rowRef}
      className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
    >
      {/* Name input */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Flag name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 flex-1"
      />

      {/* Type selector — opens type picker */}
      <TypePicker
        mode="assign"
        trigger={
          <FlagElement
            data-testid="type-picker-trigger"
            onClick={() => setTypePickerOpen(!typePickerOpen)}
            className="cursor-pointer hover:bg-accent/50"
          >
            {getTypeDisplay()}
          </FlagElement>
        }
        onSelect={handleTypeSelect}
      />

      {/* Create button */}
      <Button
        type="button"
        size="sm"
        onClick={handleCreate}
        disabled={!canCreate}
      >
        Create
      </Button>
    </li>
  );
}
