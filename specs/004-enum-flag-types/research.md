# Research: Enum Flag Types (004)

**Phase**: 0 — Pre-design research
**Date**: 2026-02-19
**Branch**: `004-enum-flag-types`

---

## 1. Flag Type Representation — Discriminated Union vs. Generic

**Decision**: Replace the current generic `FeatureFlag<T extends FlagType>` pattern with a discriminated union (`UntypedFlag | BooleanFlag | EnumFlag`).

**Rationale**: The current generic approach (`FlagValue<T extends FlagType>`) works for one type but becomes awkward when adding `enum` flags, which require an extra field (`enumTypeId`) not present on boolean flags. A discriminated union makes exhaustive type narrowing (`switch (flag.type)`) natural, is idiomatic TypeScript for this shape, and removes the need for casting or conditional field access.

**Alternatives Considered**:
- **Keep the generic approach, add optional `enumTypeId`**: Rejected. Optional fields on a shared interface create a leaky abstraction — boolean flags would silently accept `enumTypeId` with no compile-time error, and type narrowing requires explicit checks on optional fields.
- **String union `FlagType = "boolean" | "enum"` on a flat interface**: Rejected for the same reason — no compile-time guarantee that `enumTypeId` is present when and only when `type === "enum"`.

**Untyped flag state**: A new `"untyped"` state is introduced for flags in the creation row before the user has selected a type. This is represented by `type: "untyped"` and `value: null`. Untyped flags are ephemeral — they transition to boolean or enum on type assignment and cannot exist as a persisted flag (the Create button is blocked until a type is chosen).

---

## 2. Enum Value Reordering — DnD in Modal

**Decision**: Use `useSortable` from `@dnd-kit/react` inside the enum type modal, wrapped in a `DragDropProvider`. Use `move` from `@dnd-kit/helpers` to compute the new order on drag end.

**Rationale**: The existing codebase already uses `@dnd-kit/react` (`DragDropProvider`, `useDraggable`, `useDroppable`). The next-gen `@dnd-kit/react` package includes `useSortable` for reorderable lists. Using the same library and provider pattern keeps the codebase consistent and avoids adding a second DnD library (`@dnd-kit/sortable` which depends on `@dnd-kit/core`). The `@dnd-kit/helpers` `move` utility provides the `arrayMove`-equivalent for computing reordered arrays.

**Alternatives Considered**:
- **`@dnd-kit/sortable` (legacy preset)**: Rejected. Requires `@dnd-kit/core` as a peer dependency, and the project has already migrated to `@dnd-kit/react`. Mixing both would introduce two competing DnD contexts.
- **Up/Down arrow buttons**: User explicitly chose drag-and-drop (Q5 in clarification session). Rejected.
- **HTML5 native drag-and-drop (`draggable`, `ondragover`)**: Rejected. No touch support, poor accessibility, inconsistent browser behavior.

**Implementation note**: The `DragDropProvider` wrapping the enum type modal is scoped to the modal only, not the global flag list. This prevents drag events from the modal from interfering with the flag list's `DragDropProvider`.

---

## 3. Type Picker UI — shadcn/ui Command

**Decision**: Use the shadcn/ui `Command` component (wrapped in a `Popover`) as the type picker UI.

**Rationale**: `Command` provides built-in keyboard navigation, search/filter input, and item grouping out of the box. It is already available in the project (shadcn/ui is installed). The existing `FlagMoveToMenu` component uses a similar combobox pattern (Command inside a Popover), providing a consistent mental model.

**Alternatives Considered**:
- **Custom `<input>` + filtered `<ul>`**: Rejected. Rebuilds existing shadcn/ui functionality without accessibility guarantees.
- **shadcn/ui `Select`**: Rejected. `Select` is not searchable by default and doesn't support grouped items with inline actions (e.g., "Create new enum type…").

---

## 4. Enum Type Edit/Create Modal — shadcn/ui Dialog

**Decision**: Use the shadcn/ui `Dialog` component for the enum type create/edit modal.

**Rationale**: `Dialog` is already used in the project for confirmation modals. The spec calls for a simple form modal — name field, sortable value list, save/cancel. `Dialog` covers all of these natively.

**Alternatives Considered**:
- **Sheet (side panel)**: Rejected. A sheet is more appropriate for complex, multi-step forms or record detail views. Enum type creation is a focused, compact form.
- **Inline expansion in the type picker**: Rejected. The type picker is a popover with limited vertical space. A dedicated modal is cleaner for a form with a variable-length list of inputs.

---

## 5. Enum Value Selector (on the flag row) — shadcn/ui Select

**Decision**: Use the shadcn/ui `Select` component for the enum flag value control displayed in the flag row.

**Rationale**: `Select` renders a compact trigger (showing the current value) and a dropdown list of options — exactly matching the spec requirement. It is accessible, keyboard-navigable, and stylistically consistent with the existing Switch control for boolean flags.

**Alternatives Considered**:
- **Custom dropdown**: Rejected. Unnecessary custom code when shadcn/ui `Select` covers the need.
- **`Command` popover (same as type picker)**: Rejected. Overkill for value selection from a short list. `Select` is more appropriate for choosing from a bounded set of options.

---

## 6. Store Extension — Enum Types in Existing Feature Store

**Decision**: Extend the existing `useFeatureFlagsStore` (Zustand) with an `enumTypes: EnumType[]` array and corresponding CRUD actions. No new store created.

**Rationale**: EnumTypes are tightly coupled to flags — they must be co-located in the same store to avoid cross-store action calls (prohibited by Constitution Principle IV). A separate `enumTypesStore` would require the flag store to reference it for cascade deletes and value resets, violating the "Stores MUST NOT import or directly invoke actions from other feature stores" rule.

**Alternatives Considered**:
- **Separate `useEnumTypesStore`**: Rejected. Violates Principle IV — the flag store's `deleteEnumType` action must also iterate over flags and delete/reset them, which requires co-location.
- **React context for enum types**: Rejected. Context is appropriate for UI state threading, not domain entity storage. Zustand is the designated client state tool.

---

## 7. EnumType Cascade Behaviors — Implementation Patterns

**Delete enum type + cascade flag deletion**:
- In the store `deleteEnumType(id)` action: filter `enumTypes` to remove the type, then for each project in `flags`, filter out all flags where `flag.type === "enum" && flag.enumTypeId === id`. Children of deleted enum flags are not a concern — enum flags cannot be parents (only boolean flags can per existing FR-001 from flag-groups spec).

**Remove a used enum value + reset affected flags**:
- In the store `updateEnumType(id, name, values)` action: after updating the values array, for each project's flags, find enum flags referencing this type whose current `value` is no longer in the new `values` array, and reset their `value` to `values[0]` (the new default). This is deterministic and does not require a separate action.

**Min-1 value enforcement**:
- Enforced in the UI (disable the remove button when only 1 value remains) and as a runtime guard in the store action (no-op / throw if `values.length === 0`).

---

## 8. Flag Type Assignment — One-Time, Untyped → Typed Transition

**Decision**: The `assignFlagType` store action transitions a flag from `type: "untyped"` to `type: "boolean"` or `type: "enum"`. It is a one-way operation — no reassignment supported.

**Implementation**: The inline creation row holds its own local state for `name` and `type` (and `enumTypeId` if enum selected). On Create (button click or Enter), the store's `addFlag` action is called with the resolved type already set — the untyped intermediate state is purely UI-local and never persisted to the store.

**Rationale for local state in creation row**: Simpler than a two-step "add untyped flag, then assign type". No partially-constructed flags need to live in the store.
