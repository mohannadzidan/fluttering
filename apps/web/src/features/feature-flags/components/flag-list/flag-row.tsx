import { CalendarClock, CalendarPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AnyFlag } from "../../types";
import { formatFlagTime } from "../../utils/format-time";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { FlagTypeIcon } from "../flag-type-icon";
import { FlagMenu } from "./flag-menu";

interface FlagRowProps {
  flag: AnyFlag;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Display a single flag as a horizontal row.
 * Shows name, type icon, toggle switch, timestamps, and menu button.
 */
export function FlagRow({ flag, projectId, onEdit, onDelete }: FlagRowProps) {
  const toggleFlagValue = useFeatureFlagsStore((state) => state.toggleFlagValue);

  const handleToggle = () => {
    toggleFlagValue(projectId, flag.id);
  };

  return (
    <li className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
      {/* Flag name with tooltip */}
      <Tooltip>
        <TooltipTrigger>
          <span className="max-w-[200px] truncate text-sm font-medium text-foreground">
            {flag.name}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="text-xs">{flag.name}</span>
        </TooltipContent>
      </Tooltip>

      {/* Type icon */}
      <FlagTypeIcon type={flag.type} className="h-4 w-4 text-cosmic" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Toggle switch */}
      <Switch
        checked={flag.type === "boolean" ? flag.value : false}
        onCheckedChange={handleToggle}
        aria-label={`Toggle ${flag.name}`}
      />

      {/* Created timestamp */}
      <div className="flex items-center gap-2">
        <CalendarPlus className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-radiate">{formatFlagTime(flag.createdAt)}</span>
      </div>

      {/* Updated timestamp */}
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-radiate">{formatFlagTime(flag.updatedAt)}</span>
      </div>

      {/* Menu button with Edit and Delete actions */}
      <FlagMenu onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}
