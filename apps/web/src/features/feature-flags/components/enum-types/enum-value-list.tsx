import { GripVertical, X } from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ValueItem {
  id: string;
  value: string;
}

interface SortableValueRowProps {
  item: ValueItem;
  index: number;
  isDefault: boolean;
  canRemove: boolean;
  onValueChange: (id: string, newValue: string) => void;
  onRemove: (id: string) => void;
}

function SortableValueRow({
  item,
  index,
  isDefault,
  canRemove,
  onValueChange,
  onRemove,
}: SortableValueRowProps) {
  const { ref, handleRef, isDragging } = useSortable({ id: item.id, index });

  return (
    <div ref={ref} className={cn("flex items-center gap-2", isDragging && "opacity-40")}>
      {/* Drag handle */}
      <button
        ref={handleRef}
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground focus-visible:outline-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Value input */}
      <Input
        value={item.value}
        onChange={(e) => onValueChange(item.id, e.target.value)}
        placeholder="Value..."
        className="flex-1 h-7 text-xs"
        data-testid="enum-type-value-input"
      />

      {/* Default badge */}
      {isDefault && (
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          default
        </span>
      )}

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(item.id)}
        disabled={!canRemove}
        aria-label="Remove value"
        className="shrink-0"
        data-testid="enum-type-remove-value-button"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface EnumValueListProps {
  items: ValueItem[];
  onItemsChange: (items: ValueItem[]) => void;
}

/**
 * Sortable list of enum value rows.
 * Each row has a drag handle, a text input, and a remove button.
 * The first row is labeled "default" (read-only badge).
 * Uses a scoped DragDropProvider so it doesn't conflict with the outer flag-list DnD.
 */
export function EnumValueList({ items, onItemsChange }: EnumValueListProps) {
  const handleValueChange = (id: string, newValue: string) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, value: newValue } : item)));
  };

  const handleRemove = (id: string) => {
    if (items.length <= 1) return;
    onItemsChange(items.filter((item) => item.id !== id));
  };

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;
        onItemsChange(move(items, event));
      }}
    >
      <div className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <SortableValueRow
            key={item.id}
            item={item}
            index={index}
            isDefault={index === 0}
            canRemove={items.length > 1}
            onValueChange={handleValueChange}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </DragDropProvider>
  );
}
