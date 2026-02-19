import { describe, it, expect } from "vitest";
import type { EnumType, AnyFlag } from "../types";
import {
  isNameUnique,
  areValuesUnique,
  getAffectedFlagCount,
  getAffectedFlagsByValue,
  wouldRemoveUsedValue,
} from "./enum-type";

describe("enum-type utils", () => {
  describe("isNameUnique", () => {
    const existing: EnumType[] = [
      { id: "type-1", name: "Status", values: ["active", "inactive"] },
      { id: "type-2", name: "Environment", values: ["prod", "staging"] },
    ];

    it("accepts a unique name", () => {
      expect(isNameUnique("NewType", existing)).toBe(true);
    });

    it("rejects a duplicate name (case-insensitive)", () => {
      expect(isNameUnique("status", existing)).toBe(false);
      expect(isNameUnique("STATUS", existing)).toBe(false);
      expect(isNameUnique("Status", existing)).toBe(false);
    });

    it("respects excludeId parameter", () => {
      expect(isNameUnique("Status", existing, "type-1")).toBe(true);
      expect(isNameUnique("Status", existing, "type-2")).toBe(false);
    });
  });

  describe("areValuesUnique", () => {
    it("accepts a list of unique values", () => {
      expect(areValuesUnique(["active", "inactive", "pending"])).toBe(true);
    });

    it("rejects duplicates (case-sensitive)", () => {
      expect(areValuesUnique(["active", "inactive", "active"])).toBe(false);
    });

    it("accepts values that differ only in case", () => {
      expect(areValuesUnique(["Active", "active", "ACTIVE"])).toBe(true);
    });

    it("handles empty array", () => {
      expect(areValuesUnique([])).toBe(true);
    });

    it("handles single value", () => {
      expect(areValuesUnique(["only-one"])).toBe(true);
    });
  });

  describe("getAffectedFlagCount", () => {
    const flags: Record<string, AnyFlag[]> = {
      "proj-1": [
        {
          id: "flag-1",
          name: "deploy-target",
          type: "enum",
          enumTypeId: "type-1",
          value: "production",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "flag-2",
          name: "region",
          type: "enum",
          enumTypeId: "type-2",
          value: "us-east",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "flag-3",
          name: "dark-mode",
          type: "boolean",
          value: true,
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      "proj-2": [
        {
          id: "flag-4",
          name: "env",
          type: "enum",
          enumTypeId: "type-1",
          value: "staging",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    it("returns 0 for non-matching enum type", () => {
      expect(getAffectedFlagCount("type-nonexistent", flags)).toBe(0);
    });

    it("counts matching enum flags across all projects", () => {
      expect(getAffectedFlagCount("type-1", flags)).toBe(2); // proj-1 flag-1, proj-2 flag-4
      expect(getAffectedFlagCount("type-2", flags)).toBe(1); // proj-1 flag-2
    });

    it("ignores boolean flags", () => {
      // type-1 has 2 enum flags; boolean flag should not be counted
      expect(getAffectedFlagCount("type-1", flags)).toBe(2);
    });
  });

  describe("getAffectedFlagsByValue", () => {
    const flags: Record<string, AnyFlag[]> = {
      "proj-1": [
        {
          id: "flag-1",
          name: "deploy",
          type: "enum",
          enumTypeId: "type-1",
          value: "production",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "flag-2",
          name: "region",
          type: "enum",
          enumTypeId: "type-2",
          value: "us-east",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      "proj-2": [
        {
          id: "flag-3",
          name: "status",
          type: "enum",
          enumTypeId: "type-1",
          value: "production",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "flag-4",
          name: "env",
          type: "enum",
          enumTypeId: "type-1",
          value: "staging",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    it("returns 0 for non-existent enum type and value", () => {
      expect(getAffectedFlagsByValue("type-nonexistent", "staging", flags)).toBe(
        0
      );
    });

    it("returns correct count for specific value across projects", () => {
      expect(getAffectedFlagsByValue("type-1", "production", flags)).toBe(2); // proj-1 flag-1, proj-2 flag-3
      expect(getAffectedFlagsByValue("type-1", "staging", flags)).toBe(1); // proj-2 flag-4
    });

    it("returns 0 when value doesn't match any flags", () => {
      expect(getAffectedFlagsByValue("type-1", "development", flags)).toBe(0);
    });
  });

  describe("wouldRemoveUsedValue", () => {
    const flags: Record<string, AnyFlag[]> = {
      "proj-1": [
        {
          id: "flag-1",
          name: "status",
          type: "enum",
          enumTypeId: "type-1",
          value: "inactive",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      "proj-2": [
        {
          id: "flag-2",
          name: "env",
          type: "enum",
          enumTypeId: "type-1",
          value: "active",
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    it("returns true when a flag currently holds the value", () => {
      expect(wouldRemoveUsedValue("type-1", "inactive", flags)).toBe(true);
      expect(wouldRemoveUsedValue("type-1", "active", flags)).toBe(true);
    });

    it("returns false when no flag holds the value", () => {
      expect(wouldRemoveUsedValue("type-1", "pending", flags)).toBe(false);
    });

    it("returns false for non-existent enum type", () => {
      expect(wouldRemoveUsedValue("type-nonexistent", "active", flags)).toBe(
        false
      );
    });

    it("ignores boolean flags", () => {
      const flagsWithBoolean: Record<string, AnyFlag[]> = {
        "proj-1": [
          {
            id: "flag-1",
            name: "dark-mode",
            type: "boolean",
            value: true,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(wouldRemoveUsedValue("type-1", "active", flagsWithBoolean)).toBe(
        false
      );
    });
  });
});
