import { CalendarClock, CalendarPlus, ChevronDown, ChevronRight } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import { Switch } from "@/components/ui/switch";
import type { AnyFlag } from "../../types";
import { formatFlagTime } from "../../utils/format-time";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { FlagTypeIcon } from "../flag-type-icon";
import { FlagConnector } from "./flag-connector";
import { useEffect, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { mergeProps, useRender } from "@base-ui/react";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus, LogOut } from "lucide-react";
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
  children: React.ReactNode;
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
function FlagMenu({
  flag,
  projectId,
  allFlags = [],
  onEdit,
  onDelete,
  onAddChild,
  onDetach,
  onMoveTo,
  children,
}: FlagMenuProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  // Get eligible parent candidates (boolean flags, excluding current flag and its descendants)
  const parentCandidates = allFlags.filter((f) => f.type === "boolean" && f.id !== flag.id);

  return (
    <DropdownMenu>
      {children}
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

/**
 * Draggable name container component
 */
function DraggableFlagName({
  flag,
  onDragging,
}: {
  flag: AnyFlag;
  onDragging?: (isDragging: boolean) => void;
}) {
  const { ref, isDragging } = useDraggable({
    id: flag.id,
  });

  useEffect(() => {
    if (onDragging) {
      onDragging(isDragging);
    }
  }, [isDragging]);

  return (
    <FlagElement ref={ref} className="h-8.5 cursor-grab">
      <FlagTypeIcon type={flag.type} className="h-4 w-4 text-cosmic" />
      <span className="max-w-50 truncate text-sm font-medium text-foreground">{flag.name}</span>
    </FlagElement>
  );
}

interface FlagRowProps {
  flag: AnyFlag;
  projectId: string;
  allFlags?: AnyFlag[];
  depth: number;
  hasChildren: boolean;
  isLastChild: boolean;
  ancestorIsLastChild: boolean[];
  isCollapsed: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
  onDetach?: () => void;
  onToggleCollapse?: () => void;
  onMoveTo?: (parentId: string) => void;
}

const INDENT_UNIT = 24; // pixels per indentation level

function FlagElement({ render, className, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    render,
    props: {
      ...props,
      className: cn("border rounded-full px-2 bg-card flex items-center z-1  gap-2", className),
    },
  });
}

function FlagButton({ children, className, ...props }: useRender.ComponentProps<"button">) {
  return (
    <FlagElement
      render={({ className: elementClassName, ...elementProps }) => (
        <button
          className={cn(
            elementClassName,
            className,
            "cursor-pointer hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          )}
          {...mergeProps(props, elementProps)}
        >
          {children}
        </button>
      )}
    />
  );
}

/**
 * Display a single flag as a horizontal row.
 * Shows name, type icon, collapse toggle (if parent), toggle switch, timestamps, and menu button.
 * Supports tree hierarchy with indentation and connectors.
 */
export function FlagRow({
  flag,
  projectId,
  allFlags = [],
  depth,
  hasChildren,
  isLastChild,
  ancestorIsLastChild,
  isCollapsed,
  onEdit,
  onDelete,
  onAddChild,
  onDetach,
  onToggleCollapse,
  onMoveTo,
}: FlagRowProps) {
  const toggleFlagValue = useFeatureFlagsStore((state) => state.toggleFlagValue);
  const [isDragging, setIsDragging] = useState(false);
  // DnD: droppable only (draggable moved to DraggableFlagName component)
  const { ref, isDropTarget } = useDroppable({
    id: flag.id,
    disabled: flag.type !== "boolean",
  });

  const handleToggle = () => {
    toggleFlagValue(projectId, flag.id);
  };

  const leftPadding = depth * INDENT_UNIT;

  return (
    <li
      ref={ref}
      className={cn(
        `flex items-stretch gap-4 px-1 py-1 relative rounded-full group transition-colors hover:bg-accent/20 `,
        isDropTarget && flag.type === "boolean" && "bg-accent",
        isDragging && "dragging",
      )}
      style={{
        marginLeft: `${leftPadding}px`,
      }}
    >
      <div className="absolute top-1/2 right-8 left-8 border-b  border-dashed group-[.dragging]:opacity-0" />
      {/* Tree connector for non-root flags */}
      {depth > 0 && (
        <FlagConnector
          depth={depth}
          isLastChild={isLastChild}
          ancestorIsLastChild={ancestorIsLastChild}
        />
      )}

      {/* Flag name with tooltip - draggable from here */}
      <DraggableFlagName flag={flag} onDragging={setIsDragging} />

      {/* Collapse toggle (if parent) */}
      {hasChildren && (
        <FlagButton
          onClick={onToggleCollapse}
          className="group-[.dragging]:opacity-0 "
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </FlagButton>
      )}

      {/* Spacer */}
      <div className="flex-1 " />

      {/* Toggle switch */}
      <FlagElement className="group-[.dragging]:opacity-0">
        <Switch
          checked={flag.type === "boolean" ? flag.value : false}
          onCheckedChange={handleToggle}
          aria-label={`Toggle ${flag.name}`}
        />
      </FlagElement>

      {/* Created timestamp */}
      <FlagElement className="group-[.dragging]:opacity-0">
        <div className="flex items-center gap-2 w-24">
          <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-radiate">{formatFlagTime(flag.createdAt)}</span>
        </div>
      </FlagElement>

      {/* Updated timestamp */}
      <FlagElement className="group-[.dragging]:opacity-0">
        <div className="flex items-center gap-2 w-24">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-radiate">{formatFlagTime(flag.updatedAt)}</span>
        </div>
      </FlagElement>

      {/* Menu button with Edit, Add Child, Move To, and Delete actions */}
      <FlagMenu
        flag={flag}
        projectId={projectId}
        allFlags={allFlags}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddChild={onAddChild}
        onDetach={onDetach}
        onMoveTo={onMoveTo}
      >
        <DropdownMenuTrigger>
          <FlagButton>
            <MoreHorizontal className="h-4 w-4" />
          </FlagButton>
        </DropdownMenuTrigger>
      </FlagMenu>
    </li>
  );
}
