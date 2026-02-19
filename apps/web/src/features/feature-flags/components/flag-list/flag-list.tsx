import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureFlagsStore } from "../../hooks/use-flags-store";
import { useProjectFlags, useSelectedProject } from "../../hooks/use-flags-store";
import { FlagRow } from "./flag-row";
import { FlagCreateRow } from "./flag-create-row";
import { FlagEditRow } from "./flag-edit-row";

/**
 * Display the list of flags for the currently selected project.
 * Shows each flag as a FlagRow, or an empty state if no flags exist.
 * Includes "Add new flag..." button and inline creation form.
 * Supports inline editing and deletion.
 */
export function FlagList() {
  const selectedProjectId = useSelectedProject();
  const flags = useProjectFlags();
  const deleteFlag = useFeatureFlagsStore((state) => state.deleteFlag);

  const [isCreating, setIsCreating] = useState(false);
  const [editingFlagId, setEditingFlagId] = useState<string | null>(null);

  const hasFlags = flags.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {!hasFlags && !isCreating ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No flags yet</p>
          <p className="text-xs text-muted-foreground">
            Click 'Add new flag...' to create your first flag
          </p>
        </div>
      ) : null}

      {hasFlags || isCreating ? (
        <ul className="flex flex-col gap-2">
          {flags.map((flag) =>
            editingFlagId === flag.id ? (
              <FlagEditRow
                key={flag.id}
                flag={flag}
                projectId={selectedProjectId}
                onDone={() => setEditingFlagId(null)}
                onCancel={() => setEditingFlagId(null)}
              />
            ) : (
              <FlagRow
                key={flag.id}
                flag={flag}
                projectId={selectedProjectId}
                onEdit={() => setEditingFlagId(flag.id)}
                onDelete={() => deleteFlag(selectedProjectId, flag.id)}
              />
            )
          )}

          {isCreating && (
            <FlagCreateRow
              key={`create-${selectedProjectId}`}
              projectId={selectedProjectId}
              onDone={() => setIsCreating(false)}
              onCancel={() => setIsCreating(false)}
            />
          )}
        </ul>
      ) : null}

      {/* "Add new flag..." button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setIsCreating(true)}
        disabled={isCreating}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add new flag...
      </Button>
    </div>
  );
}
