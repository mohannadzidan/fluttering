import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { DragDropProvider, DragOverlay, type DragEndEvent } from "@dnd-kit/react";
import { Button } from "@/components/ui/button";
import { useFeatureFlagsStore, useCollapsedFlagIds } from "../../hooks/use-flags-store";
import { useProjectFlags, useSelectedProject } from "../../hooks/use-flags-store";
import { buildRenderList, hasDescendant } from "../../utils/flag-tree";
import { FlagRow } from "./flag-row";
import { FlagCreateRow } from "./flag-create-row";
import { FlagEditRow } from "./flag-edit-row";
import { TypePicker } from "../enum-types/type-picker";

/**
 * Display the list of flags for the currently selected project as a tree hierarchy.
 * Shows each flag as a FlagRow with tree indentation and connectors, or an empty state.
 * Includes "Add new flag..." button and inline creation form.
 * Supports inline editing, deletion, and reparenting via tree structure.
 */
export function FlagList() {
  const selectedProjectId = useSelectedProject();
  const flags = useProjectFlags();
  const collapsedFlagIds = useCollapsedFlagIds();
  const deleteFlag = useFeatureFlagsStore((state) => state.deleteFlag);
  const setFlagParent = useFeatureFlagsStore((state) => state.setFlagParent);
  const toggleFlagCollapsed = useFeatureFlagsStore((state) => state.toggleFlagCollapsed);

  const [isCreating, setIsCreating] = useState(false);
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null);
  const [editingFlagId, setEditingFlagId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const hasFlags = flags.length > 0;

  // Build render list from flat flags array with collapse support
  const renderList = buildRenderList(flags, collapsedFlagIds);

  const handleAddChild = (parentId: string) => {
    setCreatingParentId(parentId);
    setIsCreating(true);
  };

  const handleDetach = (flagId: string) => {
    setFlagParent(selectedProjectId, flagId, null);
  };

  const handleMoveTo = (flagId: string, parentId: string) => {
    setFlagParent(selectedProjectId, flagId, parentId);
  };

  const handleDragEnd = (source: { id: string | number }, target: { id: string | number }) => {
    if (!target || source.id === target.id) return;

    const draggedFlagId = source.id as string;
    const targetFlagId = target.id as string;

    // Find the target flag
    const targetFlag = flags.find((f) => f.id === targetFlagId);

    // Validation: target must be boolean type and not a descendant of the dragged flag
    if (
      !targetFlag ||
      targetFlag.type !== "boolean" ||
      hasDescendant(flags, draggedFlagId, targetFlagId)
    ) {
      return; // Silently reject
    }

    // Set the parent
    setFlagParent(selectedProjectId, draggedFlagId, targetFlagId);
  };

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
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) return;
            const { target, source } = event.operation;
            if (source && target) handleDragEnd(source, target);
            // setIsDropped(target?.id === 'droppable');
          }}
        >
          <ul className="flex flex-col gap-2">
            {renderList.map((node) =>
              editingFlagId === node.flag.id ? (
                <FlagEditRow
                  key={node.flag.id}
                  flag={node.flag}
                  projectId={selectedProjectId}
                  onDone={() => setEditingFlagId(null)}
                  onCancel={() => setEditingFlagId(null)}
                />
              ) : (
                <FlagRow
                  key={node.flag.id}
                  flag={node.flag}
                  projectId={selectedProjectId}
                  allFlags={flags}
                  depth={node.depth}
                  hasChildren={node.hasChildren}
                  isLastChild={node.isLastChild}
                  ancestorIsLastChild={node.ancestorIsLastChild}
                  isCollapsed={collapsedFlagIds.has(node.flag.id)}
                  onEdit={() => setEditingFlagId(node.flag.id)}
                  onDelete={() => deleteFlag(selectedProjectId, node.flag.id)}
                  onAddChild={() => handleAddChild(node.flag.id)}
                  onDetach={() => handleDetach(node.flag.id)}
                  onToggleCollapse={() => toggleFlagCollapsed(node.flag.id)}
                  onMoveTo={(parentId) => handleMoveTo(node.flag.id, parentId)}
                />
              ),
            )}

            {isCreating && (
              <FlagCreateRow
                key={`create-${selectedProjectId}`}
                projectId={selectedProjectId}
                parentId={creatingParentId}
                onDone={() => {
                  setIsCreating(false);
                  setCreatingParentId(null);
                }}
                onCancel={() => {
                  setIsCreating(false);
                  setCreatingParentId(null);
                }}
              />
            )}
          </ul>

     
        </DragDropProvider>
      ) : null}

      {/* Toolbar: Manage Types + Add new flag */}
      <div className="flex items-center gap-2">
        <TypePicker
          mode="manage"
          trigger={
            <Button variant="outline" size="sm">
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              Manage Types
            </Button>
          }
        />

        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            setCreatingParentId(null);
            setIsCreating(true);
          }}
          disabled={isCreating}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add new flag...
        </Button>
      </div>
    </div>
  );
}
