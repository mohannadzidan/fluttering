# Feature Specification: Enum Flag Types

**Feature Branch**: `004-enum-flag-types`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "we need to support enum flags, enum flags are flags that the user can select a string value out of a list of string values. each enum is predefined by the user, so the user needs to create the enum type first, then use it. this new type of flags needs to be seamlessly integrated with the existing structure, and will live along the existing boolean flags, and can be a child of a boolean flag. when i create new flag, i should see the same flag row, but i should see a FlagElement component contains '+ Type' that when i click it will open a searchable popup menu, that allows me to choose between boolean and enum types. the user needs to be able to create new enum type easily using a simple modal. a user defined type can be edited and deleted. a enum type, cannot have 0 allowed items, the minimum items is 1."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define a New Enum Type (Priority: P1)

A user creates a reusable enum type directly from within the type picker popup, by choosing "Create new enum type…". A modal opens where they provide a name and a list of unique allowed string values. Once saved, this enum type becomes immediately available in the type picker for assignment to any flag. The first value in the list automatically becomes the default value for flags of that type.

**Why this priority**: The enum type must exist before it can be used by any flag. This is the foundational capability all other stories depend on.

**Independent Test**: Click "+ Type" on a new flag row, then select "Create new enum type…" in the picker. Enter the name "Environment" and values ["production", "staging", "development"] in the modal. Save. Verify the enum type appears in the type picker and that "production" is designated as the default value.

**Acceptance Scenarios**:

1. **Given** the type picker is open, **When** the user selects "Create new enum type…", **Then** a modal opens where they can enter a name and at least one unique value for the new enum type.
2. **Given** the user is creating an enum type in the modal, **When** they submit the form, **Then** the enum type is saved and the first value in the list is automatically designated as the default value for flags that use this type.
3. **Given** the user is adding values in the enum type modal, **When** they attempt to enter a duplicate value (case-sensitive), **Then** the duplicate is rejected and the user is informed that values must be unique.
4. **Given** the user attempts to save an enum type with zero allowed values, **When** they submit, **Then** the system prevents saving and informs the user that at least one value is required.
5. **Given** the user saves a new enum type, **When** the modal closes, **Then** the type picker updates and the new type is immediately available for assignment.

---

### User Story 2 - Assign a Type to a New Flag via Inline Creation (Priority: P1)

When a user triggers inline flag creation, an editable row appears in the flag list that is visually identical to an existing flag row. This creation row has an editable name field, a "**+ Type**" element in place of a value control, and a **Create** button at the end of the row. The Create button is only enabled once both the flag name is provided and a type is selected. The user can also press **Enter** to create the flag when both conditions are met, without clicking Create. Clicking "+ Type" opens a searchable popup that lists all available primitive types (e.g., Boolean) and all user-defined enum types. Selecting a type assigns it to the flag immediately, replacing the "+ Type" element with the appropriate value control (a boolean toggle or an enum value selector).

**Why this priority**: Without type assignment, flags have no value and serve no purpose. This is the primary interaction for connecting the type system to the flag list.

**Independent Test**: Trigger inline flag creation. Confirm the row shows an editable name field, a "+ Type" element, and a disabled Create button. Enter a name. Confirm Create remains disabled. Click "+ Type", select an existing enum type. Confirm the value selector appears, the Create button becomes enabled, and pressing Enter creates the flag.

**Acceptance Scenarios**:

1. **Given** the user triggers inline flag creation, **When** the creation row appears, **Then** it shows an editable name field, a "+ Type" element in the value control position, and a Create button that is disabled.
2. **Given** the creation row is visible with a name entered but no type selected, **When** the user views the Create button, **Then** it remains disabled.
3. **Given** the creation row is visible with a type selected but no name entered, **When** the user views the Create button, **Then** it remains disabled.
4. **Given** both a name is entered and a type is selected in the creation row, **When** the user views the Create button, **Then** it becomes enabled and the user may either click it or press Enter to create the flag.
5. **Given** the "+ Type" element is clicked on the creation row, **When** the type picker popup opens, **Then** it displays a searchable list including "Boolean" and all existing user-defined enum types, and the user can filter the list by typing.
6. **Given** the type picker is open, **When** the user selects "Boolean", **Then** the flag is assigned the Boolean type and the creation row shows a boolean toggle in place of the "+ Type" element.
7. **Given** the type picker is open, **When** the user selects an enum type, **Then** the creation row shows an enum value selector (initialized to the enum's default value) in place of the "+ Type" element.
8. **Given** the type picker is open with no enum types yet created, **When** the user views the list, **Then** a "Create new enum type…" option is available that opens the enum type creation modal.

---

### User Story 3 - Select a Value for an Enum Flag (Priority: P1)

A user with an enum flag in the flag list can click the flag's value control to see all allowed values for that enum type and select one. The selected value is immediately reflected in the flag row and persists as the flag's current value.

**Why this priority**: Viewing and changing the current value of an enum flag is the core runtime use-case of this feature.

**Independent Test**: Assign an enum type with 3 allowed values to a flag. Confirm the flag shows the default value. Click the value control, select a different value, and confirm the flag row reflects the new selection.

**Acceptance Scenarios**:

1. **Given** an enum flag, **When** the user views its row, **Then** the current value is visible in the flag row (initially the enum type's default value).
2. **Given** an enum flag, **When** the user clicks the value control, **Then** a dropdown or picker shows all allowed values for that enum type.
3. **Given** the value picker is open, **When** the user selects a value, **Then** the flag's current value updates to the selected value immediately.
4. **Given** an enum flag that is a child of a boolean parent flag, **When** the user views the hierarchy, **Then** the enum flag renders in the correct indented position with its value control visible, just as boolean child flags do.

---

### User Story 4 - Edit an Existing Enum Type (Priority: P2)

From within the type picker — opened either during flag creation or via the "Manage Types" button on the flag list page — the user can select an edit action on an existing enum type, which opens the enum type edit modal. There they can rename the type, add new allowed values, reorder allowed values, or remove existing allowed values. Removing a value that is currently selected by one or more flags requires explicit confirmation, and those flags are reset to the enum type's default value (the first remaining value).

**Why this priority**: Enum types will need to evolve over time. The behavior when removing values used by flags is a significant safety concern that must be clearly specified.

**Independent Test**: Create an enum type with 3 values used by 2 flags. Edit the type and remove the value currently selected by both flags. Confirm a warning shows the count (2 flags), accept, and verify both flags now show the first remaining value.

**Acceptance Scenarios**:

1. **Given** an existing enum type, **When** the user opens it for editing, **Then** they can rename the type, add new values, reorder values, and remove values.
2. **Given** the user removes an allowed value that is currently selected by at least one flag, **When** they attempt to save, **Then** the system shows a confirmation message stating "X flag(s) currently use this value. Removing it will reset those flags to the default value." and requires explicit confirmation before saving.
3. **Given** the user confirms removal of a used value, **When** the change is saved, **Then** all flags that had that value selected are reset to the new first value (default) of the enum type.
4. **Given** the user removes an allowed value that is **not** currently selected by any flag, **When** they save, **Then** no confirmation is required and the change is applied immediately.
5. **Given** an enum type currently has exactly one allowed value, **When** the user attempts to remove it, **Then** the system prevents removal and informs the user that at least one value must remain.
6. **Given** the user reorders the values in an enum type, **When** they save, **Then** the first value in the new order becomes the new default value for future flag assignments (existing flags are not affected).

---

### User Story 5 - Delete an Enum Type (Priority: P2)

A user can delete an enum type via the edit modal, which is reachable from the type picker (during flag creation or via the "Manage Types" button on the flag list page). If any flags are currently using that type, the system warns the user that those flags will also be deleted, requires explicit confirmation, and then deletes both the type and all associated flags. If no flags use the type, deletion is immediate with a simple confirmation.

**Why this priority**: Type deletion is a destructive and irreversible action that requires clear user communication. It must be safe to perform without accidental data loss.

**Independent Test**: Create an enum type used by 3 flags. Attempt to delete the type. Confirm a warning appears stating "3 flag(s) use this type. Deleting it will also delete those flags." Confirm deletion and verify all 3 flags are removed from the list.

**Acceptance Scenarios**:

1. **Given** an enum type that has zero flags using it, **When** the user deletes it, **Then** a simple confirmation is shown ("Delete this enum type?") and upon confirmation the type is removed.
2. **Given** an enum type used by one or more flags, **When** the user initiates deletion, **Then** the system shows "X flag(s) use this type. Deleting it will also delete those flags." and requires explicit confirmation.
3. **Given** the user confirms deletion of an enum type with associated flags, **When** deletion completes, **Then** the enum type no longer appears in the type picker, and all flags that used that type are removed from the flag list.
4. **Given** the user cancels the deletion confirmation, **When** the dialog is dismissed, **Then** no changes are made — the type and all flags remain untouched.

---

### Edge Cases

- What happens if the user dismisses the inline creation row mid-fill? Pressing Escape or clicking outside discards the in-progress row entirely — no flag is created, no partial state is saved.
- What happens if the user tries to remove all values from an enum type during editing? The system must prevent this; a minimum of one value must remain at all times.
- What is the default value when a new flag is assigned an enum type? It is always the first value in the enum type's allowed-values list.
- What happens when the first value (default) is reordered to a different position during an edit? The new first value becomes the default going forward; existing flags that previously had the old default are not retroactively changed.
- Can an enum flag be a child of a boolean parent flag? Yes — enum flags participate in the existing parent-child hierarchy exactly as boolean flags do.
- Can a boolean flag be a child of an enum flag? No — only boolean flags can act as parents (per existing FR-001 from the flag-groups spec).
- What happens when a user assigns an enum type to a flag and the enum type is subsequently deleted? The flag is also deleted (see US5).
- What if two enum types have the same name? Names must be unique; the system should reject duplicate names.

## Requirements *(mandatory)*

### Functional Requirements

**Enum Type Management**

- **FR-001**: Users MUST be able to create a named enum type that defines an ordered list of unique string values. The first value in the list is automatically the default value for flags of that type.
- **FR-002**: Each enum type name MUST be unique across all user-defined types. The system MUST reject duplicate names and inform the user.
- **FR-003**: An enum type MUST contain at least one allowed value at all times. The system MUST prevent creation or editing that would result in zero values.
- **FR-004**: Allowed values within a single enum type MUST be unique (case-sensitive). The system MUST reject duplicate values within the same type.
- **FR-005**: Users MUST be able to edit an existing enum type: rename it, add new values, remove existing values, and reorder values via drag-and-drop within the edit modal.
- **FR-006**: When a user removes an allowed value that is currently selected by one or more flags, the system MUST show a confirmation message stating how many flags will be affected and that those flags will be reset to the default value. Removal proceeds only after explicit confirmation.
- **FR-007**: After a used value is confirmed for removal, all flags that had that value selected MUST be automatically reset to the enum type's new first value (new default).
- **FR-008**: Users MUST be able to delete an enum type. If any flags use it, the system MUST warn the user with a count of affected flags and state that those flags will also be deleted. Deletion proceeds only after explicit confirmation.
- **FR-009**: Deleting a confirmed enum type MUST also delete all flags that use that type, removing them from the flag list.

**Inline Flag Creation Row**

- **FR-010**: The inline flag creation row MUST be visually identical to an existing flag row, with an editable name field, a "+ Type" element in the value control position, and a Create button at the end.
- **FR-010a**: The Create button MUST be disabled until both a flag name is provided and a type is selected.
- **FR-010b**: When both a flag name is provided and a type is selected, the user MUST be able to press Enter to create the flag, as an alternative to clicking the Create button.
- **FR-010c**: The user MUST be able to dismiss the inline creation row without creating a flag by pressing Escape or clicking outside the row. No explicit Cancel button is present.

**Type Assignment on Flags**

- **FR-011**: Clicking the "+ Type" element MUST open a searchable type picker that lists all available primitive types (Boolean) and all user-defined enum types.
- **FR-012**: The type picker MUST be searchable/filterable by typing. The filter applies to type names.
- **FR-013**: Selecting "Boolean" from the type picker MUST assign the Boolean type to the flag, replacing the "+ Type" element with a boolean toggle control.
- **FR-014**: Selecting an enum type from the type picker MUST assign that type to the flag, replacing the "+ Type" element with the enum value selector initialized to the enum type's default value.
- **FR-015**: The type picker MUST include a "Create new enum type…" option that opens the enum type creation modal. This is the only entry point for creating enum types.
- **FR-015a**: The type picker MUST include an edit action on each listed enum type that opens the enum type edit modal. The edit modal also exposes the delete action for that type.
- **FR-015b**: A **"Manage Types"** entry point MUST exist on the flag list page (e.g., a button in the toolbar or header). Activating it opens the type picker in a standalone browse/manage mode — listing all enum types with their edit actions — without requiring the user to be in the middle of creating a flag.

**Enum Flag Value Control**

- **FR-016**: An enum flag row MUST display the flag's currently selected value.
- **FR-017**: Clicking the value control on an enum flag MUST open a picker displaying all allowed values for that enum type, allowing the user to select one.
- **FR-018**: Selecting a value from the picker MUST immediately update the flag's current value.

**Integration with Existing Hierarchy**

- **FR-019**: Enum flags MUST be renderable as children of boolean parent flags, appearing with the correct indented connector style defined in the flag-groups spec.
- **FR-020**: The type system MUST be designed to accommodate additional primitive types (e.g., string, number) and additional user-defined types (e.g., structures) in the future without requiring structural changes.

### Key Entities

- **EnumType**: A user-defined type with a unique name and an ordered list of at least one unique string value. The first value is the default. Multiple flags may reference the same enum type.
- **Flag**: A feature flag with a name, an assigned type (untyped, boolean, or a specific enum type), and a current value. An untyped flag shows the "+ Type" selector. An enum flag's current value must be one of its type's allowed values.
- **TypePicker**: The searchable popup UI element that appears when the user clicks "+ Type", listing all assignable types and providing a path to create new enum types.
- **EnumValueSelector**: The value control rendered in an enum flag's row, showing the current value and allowing selection from all allowed values of the flag's enum type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a new enum type (name + 3 values) in fewer than 5 interactions from the flag list screen.
- **SC-002**: A user can assign an enum type to a new flag in 2 or fewer interactions after the type exists.
- **SC-003**: When deleting an enum type with associated flags, 100% of the affected flags are deleted along with the type — no orphaned flags remain.
- **SC-004**: When removing a used value from an enum type, 100% of flags previously holding that value are automatically reset to the new default — no flags retain a now-invalid value.
- **SC-005**: The type picker lists all user-defined enum types and filters results correctly as the user types, with results appearing without any perceptible delay.
- **SC-006**: An enum flag row is visually indistinguishable in layout from a boolean flag row, maintaining a consistent flag list appearance.
- **SC-007**: An enum flag can be placed as a child of a boolean parent flag and renders correctly in the existing hierarchy view with the dashed connector.

## Clarifications

### Session 2026-02-19

- Q: Where can users manage (create/edit/delete) enum types? → A: Exclusively via the type picker popup — "Create new enum type…" and edit/delete actions are only accessible from within the picker. All enum type create/edit interactions use a modal.
- Q: How does the user dismiss the inline flag creation row without creating a flag? → A: Pressing Escape or clicking outside the row dismisses it. No Cancel button.
- Q: How does a user access enum type edit/delete when not currently assigning a type to a flag? → A: A "Manage Types" button on the flag list page opens the type picker in standalone browse/manage mode.
- Q: Can a user change the type of an already-typed flag? → A: No — type assignment is one-time. The user must delete and recreate the flag to use a different type. Type reassignment is out of scope for this feature.
- Q: What is the reorder mechanism for enum values within the edit modal? → A: Drag-and-drop, consistent with the existing drag-and-drop library used in the flag list.

## Assumptions

- The enum type system is global (shared across all flags), not scoped per project or environment.
- Reordering of enum values within the edit modal is achieved via drag-and-drop, consistent with the existing drag-and-drop library used in the flag list.
- There is no enforced maximum number of values per enum type, and no maximum number of enum types.
- Enum flag current values are stored per flag; they are not shared or synchronized between flags of the same type.
- Enum type names are case-insensitive for uniqueness checks (e.g., "Status" and "status" are treated as the same name). Values within an enum type are case-sensitive for uniqueness.
- Deleting an enum type that is in use also deletes the associated flags. There is no "detach type" operation that would leave flags in an untyped state.
- The "+ Type" element only appears on flags with no type assigned yet. Once a type is assigned, it cannot be removed — only changed to another type.
- Changing an already-typed flag from one type to another is out of scope for this feature. Type assignment is a one-time action per flag in this phase.
- All data is stored in-memory (no persistence), consistent with the existing flag store.
