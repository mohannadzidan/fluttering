import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus, LogOut } from "lucide-react";
import type { AnyFlag } from "../../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FlagMoveToMenu } from "./flag-move-to-menu";
import { getDirectChildren } from "../../utils/flag-tree";

interface FlagMenuProps {
  flag: AnyFlag;
  projectId: string;
  allFlags?: AnyFlag[];
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
  onDetach?: () => void;
  onMoveTo?: (parentId: string) => void;
}

/**
 * Dropdown menu for flag actions: Edit, Add Child, Move To, Detach, and Delete.
 */
export function FlagMenu({
  flag,
  projectId,
  allFlags = [],
  onEdit,
  onDelete,
  onAddChild,
  onDetach,
  onMoveTo,
}: FlagMenuProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  // Get eligible parent candidates (boolean flags, excluding current flag and its descendants)
  const parentCandidates = allFlags.filter(
    (f) =>
      f.type === "boolean" && f.id !== flag.id
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Flag options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>

        {/* Add child (only for boolean flags) */}
        {flag.type === "boolean" && onAddChild && (
          <DropdownMenuItem onClick={onAddChild} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add child flag
          </DropdownMenuItem>
        )}

        {/* Move to parent (all flags) */}
        {onMoveTo && !showMoveMenu && (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setShowMoveMenu(true);
            }}
          >
            Move to…
          </DropdownMenuItem>
        )}

        {/* Move to menu - inline combobox */}
        {showMoveMenu && onMoveTo && (
          <div className="p-2">
            <FlagMoveToMenu
              candidates={parentCandidates}
              onSelect={(parentId) => {
                onMoveTo(parentId);
                setShowMoveMenu(false);
              }}
            />
          </div>
        )}

        {/* Detach from parent (only if has parent) */}
        {flag.parentId !== null && onDetach && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDetach} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Detach from parent
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
