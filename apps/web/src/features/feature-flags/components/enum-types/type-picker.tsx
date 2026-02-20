import { useState } from "react";
import { ListFilter, Pencil, Plus, ToggleRight } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { EnumTypeModal } from "./enum-type-modal";

interface TypePickerProps {
  mode: "assign" | "manage";
  /**
   * The element rendered as the popover trigger.
   * Passed to the base-ui Trigger's `render` prop.
   */
  trigger: React.ReactElement;
  /**
   * Called when a type is selected (assign mode only).
   * Not called in manage mode.
   */
  onSelect?: (type: "boolean" | "enum", enumTypeId?: string) => void;
}

/**
 * A searchable type picker combining a shadcn/ui Command inside a Popover.
 *
 * **manage mode** — opened from the "Manage Types" toolbar button.
 *   - Lists all enum types with an edit icon (edit wired in Phase 6).
 *   - "Create new enum type…" footer item opens EnumTypeModal.
 *   - No `onSelect` callback.
 *
 * **assign mode** — opened from the inline flag creation row (Phase 4).
 *   - Shows a "Primitive Types" group (Boolean) and an "Enum Types" group.
 *   - Selecting any item calls `onSelect(type, enumTypeId?)` and closes the picker.
 *   - "Create new enum type…" auto-selects the new type after creation.
 */
export function TypePicker({ mode, trigger, onSelect }: TypePickerProps) {
  const enumTypes = useFeatureFlagsStore((state) => state.enumTypes);

  const [open, setOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEnumType, setEditingEnumType] = useState<typeof enumTypes[number] | null>(null);

  const handleOpenCreateModal = () => {
    setOpen(false);
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (enumType: typeof enumTypes[number]) => {
    setOpen(false);
    setEditingEnumType(enumType);
  };

  const handleEnumTypeCreated = (newEnumTypeId: string) => {
    // Auto-select the newly created enum type (assign mode only)
    if (mode === "assign") {
      onSelect?.("enum", newEnumTypeId);
      setOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        {/* Pass the caller-supplied trigger element via the `render` prop */}
        <PopoverTrigger render={trigger} />

        <PopoverContent className="w-56 p-0" align="start" data-testid="type-picker-popover">
          <Command>
            <CommandInput placeholder="Search types…" />
            <CommandList>
              {/* ── Assign mode: Primitive Types group ── */}
              {mode === "assign" && (
                <CommandGroup heading="Primitive Types">
                  <CommandItem
                    onSelect={() => {
                      onSelect?.("boolean");
                      setOpen(false);
                    }}
                  >
                    <ToggleRight className="text-muted-foreground" />
                    Boolean
                  </CommandItem>
                </CommandGroup>
              )}

              {/* ── Enum Types group ── */}
              <CommandGroup heading="Enum Types">
                {enumTypes.length === 0 && (
                  <CommandEmpty>No enum types yet.</CommandEmpty>
                )}
                {enumTypes.map((et) => (
                  <CommandItem
                    key={et.id}
                    value={et.name}
                    onSelect={
                      mode === "assign"
                        ? () => {
                            onSelect?.("enum", et.id);
                            setOpen(false);
                          }
                        : undefined
                    }
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ListFilter className="text-muted-foreground" />
                      {et.name}
                    </span>

                    {/* Edit icon — opens EnumTypeModal in edit mode */}
                    {mode === "manage" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(et);
                        }}
                        aria-label={`Edit ${et.name}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* ── Create new enum type ── */}
              <CommandGroup>
                <CommandItem onSelect={handleOpenCreateModal} data-testid="create-enum-type-item">
                  <Plus className="text-muted-foreground" />
                  Create new enum type…
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* EnumTypeModal — create mode */}
      <EnumTypeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={handleEnumTypeCreated}
      />

      {/* EnumTypeModal — edit mode */}
      <EnumTypeModal
        open={editingEnumType !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingEnumType(null);
        }}
        enumType={editingEnumType ?? undefined}
      />
    </>
  );
}
