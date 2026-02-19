import { describe, it, expect } from "vitest";
import {
  buildRenderList,
  getDirectChildren,
  hasDescendant,
  type FlagRenderNode,
} from "./flag-tree";
import type { AnyFlag } from "../types";

describe("flag-tree utilities", () => {
  // Helper to create test flags
  function createFlag(
    id: string,
    name: string,
    parentId: string | null = null
  ): AnyFlag {
    return {
      id,
      name,
      type: "boolean",
      value: false,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  describe("getDirectChildren", () => {
    it("returns empty array when no children exist", () => {
      const flags = [createFlag("a", "A"), createFlag("b", "B")];
      const children = getDirectChildren(flags, "a");
      expect(children).toEqual([]);
    });

    it("returns direct children of a parent", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C", "a");
      const d = createFlag("d", "D");

      const flags = [a, b, c, d];
      const children = getDirectChildren(flags, "a");

      expect(children).toEqual([b, c]);
    });

    it("ignores grandchildren", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C", "b");

      const flags = [a, b, c];
      const children = getDirectChildren(flags, "a");

      expect(children).toEqual([b]);
    });
  });

  describe("hasDescendant", () => {
    it("returns true for direct child", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const flags = [a, b];

      expect(hasDescendant(flags, "a", "b")).toBe(true);
    });

    it("returns true for grandchild", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C", "b");
      const flags = [a, b, c];

      expect(hasDescendant(flags, "a", "c")).toBe(true);
    });

    it("returns false for unrelated flag", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C");
      const flags = [a, b, c];

      expect(hasDescendant(flags, "a", "c")).toBe(false);
    });

    it("returns false for parent when checking child", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const flags = [a, b];

      expect(hasDescendant(flags, "b", "a")).toBe(false);
    });

    it("handles complex multi-level hierarchies", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C", "b");
      const d = createFlag("d", "D", "c");
      const e = createFlag("e", "E");
      const flags = [a, b, c, d, e];

      expect(hasDescendant(flags, "a", "d")).toBe(true);
      expect(hasDescendant(flags, "b", "d")).toBe(true);
      expect(hasDescendant(flags, "c", "d")).toBe(true);
      expect(hasDescendant(flags, "d", "a")).toBe(false);
      expect(hasDescendant(flags, "a", "e")).toBe(false);
    });
  });

  describe("buildRenderList", () => {
    // Helper to create enum flags
    function createEnumFlag(
      id: string,
      name: string,
      enumTypeId: string,
      parentId: string | null = null
    ): AnyFlag {
      return {
        id,
        name,
        type: "enum",
        enumTypeId,
        value: "production",
        parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    it("returns empty array for empty flags", () => {
      const list = buildRenderList([], new Set());
      expect(list).toEqual([]);
    });

    it("renders single root flag", () => {
      const a = createFlag("a", "A");
      const flags = [a];
      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({
        flag: a,
        depth: 0,
        isLastChild: true,
        hasChildren: false,
        ancestorIsLastChild: [],
      });
    });

    it("renders multiple root flags", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B");
      const c = createFlag("c", "C");
      const flags = [a, b, c];
      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(3);
      expect(list[0]).toMatchObject({ depth: 0, isLastChild: false });
      expect(list[1]).toMatchObject({ depth: 0, isLastChild: false });
      expect(list[2]).toMatchObject({ depth: 0, isLastChild: true });
    });

    it("renders parent with single child", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const flags = [a, b];
      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(2);
      expect(list[0]).toMatchObject({
        flag: a,
        depth: 0,
        hasChildren: true,
      });
      expect(list[1]).toMatchObject({
        flag: b,
        depth: 1,
        isLastChild: true,
        ancestorIsLastChild: [true],
      });
    });

    it("renders parent with multiple children", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C", "a");
      const d = createFlag("d", "D", "a");
      const flags = [a, b, c, d];
      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(4);
      expect(list[0]).toMatchObject({ flag: a, depth: 0, hasChildren: true });
      expect(list[1]).toMatchObject({
        flag: b,
        depth: 1,
        isLastChild: false,
        ancestorIsLastChild: [true],
      });
      expect(list[2]).toMatchObject({
        flag: c,
        depth: 1,
        isLastChild: false,
        ancestorIsLastChild: [true],
      });
      expect(list[3]).toMatchObject({
        flag: d,
        depth: 1,
        isLastChild: true,
        ancestorIsLastChild: [true],
      });
    });

    it("renders 3-level nesting correctly", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C", "b");
      const flags = [a, b, c];
      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(3);
      expect(list[0]).toMatchObject({
        flag: a,
        depth: 0,
        isLastChild: true,
        hasChildren: true,
      });
      expect(list[1]).toMatchObject({
        flag: b,
        depth: 1,
        isLastChild: true,
        hasChildren: true,
        ancestorIsLastChild: [true],
      });
      expect(list[2]).toMatchObject({
        flag: c,
        depth: 2,
        isLastChild: true,
        ancestorIsLastChild: [true, true],
      });
    });

    it("skips collapsed subtrees", () => {
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const c = createFlag("c", "C", "b");
      const flags = [a, b, c];
      const collapsedFlagIds = new Set(["a"]);
      const list = buildRenderList(flags, collapsedFlagIds);

      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ flag: a });
    });

    it("preserves sibling subtree state when parent is collapsed", () => {
      // Parent A with children B and C
      // B has child B1, C has child C1
      // When A is collapsed, both B and C are hidden
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const b1 = createFlag("b1", "B1", "b");
      const c = createFlag("c", "C", "a");
      const c1 = createFlag("c1", "C1", "c");
      const flags = [a, b, b1, c, c1];

      const collapsedFlagIds = new Set(["a"]);
      const list = buildRenderList(flags, collapsedFlagIds);

      expect(list).toHaveLength(1);
      expect(list[0].flag.id).toBe("a");
    });

    it("respects individual collapsed state of siblings", () => {
      // A with children B and C
      // B has child B1, C has child C1
      // When B is collapsed, B1 is hidden but C and C1 are shown
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const b1 = createFlag("b1", "B1", "b");
      const c = createFlag("c", "C", "a");
      const c1 = createFlag("c1", "C1", "c");
      const flags = [a, b, b1, c, c1];

      const collapsedFlagIds = new Set(["b"]);
      const list = buildRenderList(flags, collapsedFlagIds);

      expect(list).toHaveLength(4); // a, b, c, c1
      const ids = list.map((node) => node.flag.id);
      expect(ids).toEqual(["a", "b", "c", "c1"]);
    });

    it("renders complex multi-level with some collapsed", () => {
      // A (root, has children)
      //   ├─ B (has child B1)
      //   │   └─ B1
      //   └─ C (has child C1) [C collapsed]
      //       └─ C1 [won't render because C is collapsed]
      // D (root, has children)
      //   └─ D1
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const b1 = createFlag("b1", "B1", "b");
      const c = createFlag("c", "C", "a");
      const c1 = createFlag("c1", "C1", "c");
      const d = createFlag("d", "D");
      const d1 = createFlag("d1", "D1", "d");
      const flags = [a, b, b1, c, c1, d, d1];

      const collapsedFlagIds = new Set(["c"]);
      const list = buildRenderList(flags, collapsedFlagIds);

      const ids = list.map((node) => node.flag.id);
      expect(ids).toEqual(["a", "b", "b1", "c", "d", "d1"]);
    });

    it("tracks ancestorIsLastChild correctly in deep nesting", () => {
      // A (last child of root)
      //   ├─ B (not last child of A)
      //   │   └─ B1 (last child of B)
      //   │       └─ B1a (last child of B1)
      //   └─ C (last child of A)
      const a = createFlag("a", "A");
      const b = createFlag("b", "B", "a");
      const b1 = createFlag("b1", "B1", "b");
      const b1a = createFlag("b1a", "B1a", "b1");
      const c = createFlag("c", "C", "a");
      const flags = [a, b, b1, b1a, c];

      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(5);

      // B1a: ancestors are [A (last=true), B (last=false), B1 (last=true)]
      // A is the only child of root (true), B is not the last child of A because C follows (false),
      // B1 is the last child of B (true)
      const b1aNode = list.find((n) => n.flag.id === "b1a");
      expect(b1aNode?.ancestorIsLastChild).toEqual([true, false, true]);
    });

    it("renders enum flags correctly in tree structure", () => {
      // Parent: Boolean flag A
      // Children: Enum flag B (child of A)
      // This verifies that enum flags work correctly in the tree despite not being parents
      const a = createFlag("a", "parent-flag");
      const b = createEnumFlag("b", "enum-child", "type-1", "a");
      const flags = [a, b];

      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(2);
      expect(list[0]).toMatchObject({
        flag: a,
        depth: 0,
        hasChildren: true,
      });
      expect(list[1]).toMatchObject({
        flag: b,
        depth: 1,
        hasChildren: false, // Enum flags cannot be parents
        ancestorIsLastChild: [true],
      });
    });

    it("handles mixed boolean and enum flags in hierarchy", () => {
      // A (boolean root)
      //   ├─ B (enum child of A)
      //   └─ C (boolean child of A)
      const a = createFlag("a", "A");
      const b = createEnumFlag("b", "B", "type-1", "a");
      const c = createFlag("c", "C", "a");
      const flags = [a, b, c];

      const list = buildRenderList(flags, new Set());

      expect(list).toHaveLength(3);
      expect(list[0]).toMatchObject({ flag: a, depth: 0, hasChildren: true });
      expect(list[1]).toMatchObject({
        flag: b,
        depth: 1,
        isLastChild: false,
        hasChildren: false,
      });
      expect(list[2]).toMatchObject({
        flag: c,
        depth: 1,
        isLastChild: true,
        hasChildren: false,
      });
    });
  });
});
