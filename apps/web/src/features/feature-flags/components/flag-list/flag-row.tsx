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

function FlagElementContainer({ children }: { children: React.ReactNode }) {
  return <div className="border rounded-full px-2 bg-card flex items-center z-1  group-hover:border-primary gap-2">{children}</div>;
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
    <li className="flex items-stretch gap-4 px-1 py-1 relative rounded-full group">
      <div className="h-1/2 absolute left-4 right-12 top-0 border-b border-dashed z-0 group-hover:border-primary group-hover:border-solid" />

      {/* Flag name with tooltip */}
      <FlagElementContainer>
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
      </FlagElementContainer>

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

      {/* Menu button with Edit and Delete actions */}
      <FlagElementContainer>
        <FlagMenu onEdit={onEdit} onDelete={onDelete} />
      </FlagElementContainer>
    </li>
  );
}
