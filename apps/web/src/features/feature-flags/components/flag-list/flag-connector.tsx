/**
 * FlagConnector: Renders dashed CSS elbow connectors for tree hierarchy.
 * Positioned absolutely to the left of a flag row, showing the parent-child relationship.
 *
 * Props:
 * - depth: Nesting level (1+ for children)
 * - isLastChild: Whether this is the last child of its parent
 * - ancestorIsLastChild: Array of booleans indicating if ancestors are last children
 */

interface FlagConnectorProps {
  depth: number;
  isLastChild: boolean;
  ancestorIsLastChild: boolean[];
}

const INDENT_UNIT = 24; // pixels per indentation level

export function FlagConnector({
  depth,
  isLastChild,
  ancestorIsLastChild,
}: FlagConnectorProps) {
  if (depth === 0) return null;

  // Calculate the x position for this level's connector
  const connectorX = (depth - 1) * INDENT_UNIT + 12; // Center of the column

  return (
    <div
      className="absolute left-0 top-0 bottom-0 pointer-events-none"
      style={{
        width: `${connectorX + 20}px`,
      }}
    >
      {/* Ancestor vertical continuation lines */}
      {ancestorIsLastChild.map((isLast, ancestorIdx) => {
        if (isLast) return null; // Don't draw line if ancestor was last child
        const ancestorX = ancestorIdx * INDENT_UNIT + 12;
        return (
          <div
            key={`ancestor-${ancestorIdx}`}
            className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground"
            style={{
              left: `${ancestorX}px`,
            }}
          />
        );
      })}

      {/* Main connector (L-shape for this level) */}
      <div
        className="absolute top-0"
        style={{
          left: `${connectorX}px`,
          width: "12px",
          height: "50%",
          borderLeft: "1px dashed hsl(var(--muted-foreground))",
          borderBottom: "1px dashed hsl(var(--muted-foreground))",
        }}
      />

      {/* Vertical continuation line (if not last child) */}
      {!isLastChild && (
        <div
          className="absolute border-l border-dashed border-muted-foreground"
          style={{
            left: `${connectorX}px`,
            top: "50%",
            bottom: 0,
          }}
        />
      )}
    </div>
  );
}
