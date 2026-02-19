import { ToggleRight } from "lucide-react";
import type { FlagType } from "../types";

interface FlagTypeIconProps {
  type: FlagType;
  className?: string;
}

/**
 * Renders an icon corresponding to the flag type.
 * Extensible for future flag types (string, number, json).
 */
export function FlagTypeIcon({ type, className = "h-4 w-4" }: FlagTypeIconProps) {
  switch (type) {
    case "boolean":
      return <ToggleRight className={className} />;
    default:
      const _exhaustive: never = type;
      return _exhaustive;
  }
}
