import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { isNameUnique, areValuesUnique, getAffectedFlagsByValue } from "../../utils/enum-type";
import { EnumValueList, type ValueItem } from "./enum-value-list";
import type { EnumType } from "../../types";

interface EnumTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Enum type to edit. If undefined, modal is in create mode.
   * Phase 6 feature.
   */
  enumType?: EnumType;
  /**
   * Called after a new enum type is successfully created.
   * Used in assign mode (TypePicker) to auto-select the new type.
   * Phase 4 feature.
   */
  onCreated?: (enumTypeId: string) => void;
}

/**
 * Dialog for creating or editing an enum type.
 *
 * **Create mode** (enumType === undefined):
 * - Empty name and value fields
 * - Save creates new type
 * - No Delete button
 *
 * **Edit mode** (enumType !== undefined):
 * - Pre-filled name and values from enumType prop
 * - Save updates the type
 * - Delete button appears (Phase 7)
 * - Value removal triggers confirmation dialog (Phase 6)
 *
 * Contains:
 * - A name input
 * - A sortable EnumValueList
 * - An "Add value" button
 * - Save / Cancel footer buttons
 * - Delete button (edit mode only)
 */
export function EnumTypeModal({
  open,
  onOpenChange,
  enumType,
  onCreated
}: EnumTypeModalProps) {
  const enumTypes = useFeatureFlagsStore((state) => state.enumTypes);
  const flags = useFeatureFlagsStore((state) => state.flags);
  const createEnumType = useFeatureFlagsStore((state) => state.createEnumType);
  const updateEnumType = useFeatureFlagsStore((state) => state.updateEnumType);

  const isEditMode = enumType !== undefined;

  const [name, setName] = useState(enumType?.name ?? "");
  const [items, setItems] = useState<ValueItem[]>(
    enumType?.values.map((value) => ({ id: crypto.randomUUID(), value })) ?? [
      { id: crypto.randomUUID(), value: "" },
    ]
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [valuesError, setValuesError] = useState<string | null>(null);
  const [valueRemovalAlert, setValueRemovalAlert] = useState<{
    removedValue: string;
    affectedCount: number;
    newDefaultValue: string;
  } | null>(null);

  const reset = () => {
    setName(enumType?.name ?? "");
    setItems(
      enumType?.values.map((value) => ({ id: crypto.randomUUID(), value })) ?? [
        { id: crypto.randomUUID(), value: "" },
      ]
    );
    setNameError(null);
    setValuesError(null);
    setValueRemovalAlert(null);
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
    } else if (!isNameUnique(trimmedName, enumTypes, isEditMode ? enumType?.id : undefined)) {
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

    // Edit mode: check for removed values
    if (isEditMode && enumType) {
      const removedValues = enumType.values.filter((v) => !values.includes(v));
      if (removedValues.length > 0) {
        // Check if any flags are affected by the removed value
        const firstRemovedValue = removedValues[0];
        const affectedCount = getAffectedFlagsByValue(enumType.id, firstRemovedValue, flags);
        if (affectedCount > 0) {
          // Show confirmation dialog for value removal
          setValueRemovalAlert({
            removedValue: firstRemovedValue,
            affectedCount,
            newDefaultValue: values[0],
          });
          return; // Don't save yet
        }
      }
    }

    // Create or update
    if (isEditMode && enumType) {
      updateEnumType(enumType.id, trimmedName, values);
      handleOpenChange(false);
    } else {
      const newEnumTypeId = createEnumType(trimmedName, values);
      if (newEnumTypeId) {
        onCreated?.(newEnumTypeId);
      }
      handleOpenChange(false);
    }
  };

  const handleConfirmValueRemoval = () => {
    if (!valueRemovalAlert) return;
    const trimmedName = name.trim();
    const values = items.map((i) => i.value.trim()).filter((v) => v.length > 0);

    if (isEditMode && enumType) {
      updateEnumType(enumType.id, trimmedName, values);
      handleOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit enum type" : "Create enum type"}</DialogTitle>
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
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  // Phase 7: Delete button handler
                }}
                className="mr-auto"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            )}
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

      {/* Value Removal Confirmation Dialog */}
      <AlertDialog open={valueRemovalAlert !== null} onOpenChange={() => setValueRemovalAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm value removal</AlertDialogTitle>
            <AlertDialogDescription>
              Removing "{valueRemovalAlert?.removedValue}" will reset{" "}
              {valueRemovalAlert?.affectedCount} flag{valueRemovalAlert?.affectedCount !== 1 ? "s" : ""} to "
              {valueRemovalAlert?.newDefaultValue}". Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmValueRemoval}>
              Remove value
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
