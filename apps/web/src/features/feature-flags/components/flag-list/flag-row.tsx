import { CalendarClock, CalendarPlus, ChevronDown, ChevronRight } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AnyFlag } from "../../types";
import { formatFlagTime } from "../../utils/format-time";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { FlagTypeIcon } from "../flag-type-icon";
import { FlagMenu } from "./flag-menu";
import { FlagConnector } from "./flag-connector";

/**
 * Draggable name container component
 */
function DraggableFlagName({ flag }: { flag: AnyFlag }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: flag.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Transform.toString(transform),
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <div className="border rounded-full px-2 bg-card flex items-center z-1 group-hover:border-primary gap-2">
        <FlagTypeIcon type={flag.type} className="h-4 w-4 text-cosmic" />
        <Tooltip>
          <TooltipTrigger>
            <span className="max-w-50 truncate text-sm font-medium text-foreground">
              {flag.name}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span className="text-xs">{flag.name}</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
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

function FlagElementContainer({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-full px-2 bg-card flex items-center z-1  group-hover:border-primary gap-2">{children}</div>;
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

  // DnD: droppable only (draggable moved to DraggableFlagName component)
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: flag.id,
    disabled: flag.type !== "boolean",
  });

  const handleToggle = () => {
    toggleFlagValue(projectId, flag.id);
  };

  const leftPadding = depth * INDENT_UNIT;

  return (
    <li
      ref={setDroppableRef}
      className={`flex items-stretch gap-4 px-1 py-1 relative rounded-full group transition-colors ${
        isOver && flag.type === "boolean" ? "bg-accent" : ""
      }`}
      style={{
        marginLeft: `${leftPadding}px`,
      }}
    >
      {/* Tree connector for non-root flags */}
      {depth > 0 && (
        <FlagConnector
          depth={depth}
          isLastChild={isLastChild}
          ancestorIsLastChild={ancestorIsLastChild}
        />
      )}

      {/* Flag name with tooltip - draggable from here */}
      <DraggableFlagName flag={flag} />

      {/* Collapse toggle (if parent) */}
      {hasChildren && (
        <FlagElementContainer>
          <button
            onClick={onToggleCollapse}
            className="inline-flex items-center justify-center p-0 hover:bg-accent rounded"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </FlagElementContainer>
      )}

      {/* Spacer */}
      <div className="flex-1 " />

      {/* Toggle switch */}
      <FlagElementContainer>
        <Switch
          checked={flag.type === "boolean" ? flag.value : false}
          onCheckedChange={handleToggle}
          aria-label={`Toggle ${flag.name}`}
        />
      </FlagElementContainer>

      {/* Created timestamp */}
      <FlagElementContainer>
        <div className="flex items-center gap-2 w-24">
          <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-radiate">{formatFlagTime(flag.createdAt)}</span>
        </div>
      </FlagElementContainer>

      {/* Updated timestamp */}
      <FlagElementContainer>
        <div className="flex items-center gap-2 w-24">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-radiate">{formatFlagTime(flag.updatedAt)}</span>
        </div>
      </FlagElementContainer>

      {/* Menu button with Edit, Add Child, Move To, and Delete actions */}
      <FlagElementContainer>
        <FlagMenu
          flag={flag}
          projectId={projectId}
          allFlags={allFlags}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onDetach={onDetach}
          onMoveTo={onMoveTo}
        />
      </FlagElementContainer>
    </li>
  );
}
