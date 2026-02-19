import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { isNameUnique, areValuesUnique } from "../../utils/enum-type";
import { EnumValueList, type ValueItem } from "./enum-value-list";

interface EnumTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called after a new enum type is successfully created.
   * Used in assign mode (TypePicker) to auto-select the new type.
   * Phase 4 feature.
   */
  onCreated?: (enumTypeId: string) => void;
}

/**
 * Dialog for creating a new enum type (Phase 3: create mode only).
 * Edit mode will be added in Phase 6.
 *
 * Contains:
 * - A name input
 * - A sortable EnumValueList
 * - An "Add value" button
 * - Save / Cancel footer buttons
 */
export function EnumTypeModal({ open, onOpenChange, onCreated }: EnumTypeModalProps) {
  const enumTypes = useFeatureFlagsStore((state) => state.enumTypes);
  const createEnumType = useFeatureFlagsStore((state) => state.createEnumType);

  const [name, setName] = useState("");
  const [items, setItems] = useState<ValueItem[]>([
    { id: crypto.randomUUID(), value: "" },
  ]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [valuesError, setValuesError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setItems([{ id: crypto.randomUUID(), value: "" }]);
    setNameError(null);
    setValuesError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleAddValue = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
    setValuesError(null);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const values = items.map((i) => i.value.trim()).filter((v) => v.length > 0);

    let hasError = false;

    // Validate name
    if (!trimmedName) {
      setNameError("Name is required.");
      hasError = true;
    } else if (!isNameUnique(trimmedName, enumTypes)) {
      setNameError("An enum type with this name already exists.");
      hasError = true;
    } else {
      setNameError(null);
    }

    // Validate values
    if (values.length === 0) {
      setValuesError("At least one non-empty value is required.");
      hasError = true;
    } else if (!areValuesUnique(values)) {
      setValuesError("Values must be unique (case-sensitive).");
      hasError = true;
    } else {
      setValuesError(null);
    }

    if (hasError) return;

    const newEnumTypeId = createEnumType(trimmedName, values);
    if (newEnumTypeId) {
      onCreated?.(newEnumTypeId);
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create enum type</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="enum-type-name" className="text-xs">
              Name
            </Label>
            <Input
              id="enum-type-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Environment"
              className="h-7 text-xs"
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Values */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Values</Label>
            <EnumValueList items={items} onItemsChange={setItems} />
            {valuesError && (
              <p className="text-xs text-destructive">{valuesError}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddValue}
              className="mt-1 w-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add value
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
