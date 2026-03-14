import { describe, it, expect } from "bun:test";
import type { TaskMasterTask } from "../types";
import { sortTasks, toggleSortOrder } from "./taskSorting";

describe("taskSorting", () => {
  const createTask = (overrides: Partial<TaskMasterTask> = {}): TaskMasterTask => ({
    id: 1,
    title: "Task",
    ...overrides,
  });

  describe("sortTasks", () => {
    it("should sort by id in ascending order", () => {
      const tasks = [createTask({ id: 3 }), createTask({ id: 1 }), createTask({ id: 2 })];
      const sorted = sortTasks(tasks, "id", "asc");
      expect(sorted.map((t) => t.id)).toEqual([1, 2, 3]);
    });

    it("should sort by id in descending order", () => {
      const tasks = [createTask({ id: 1 }), createTask({ id: 3 }), createTask({ id: 2 })];
      const sorted = sortTasks(tasks, "id", "desc");
      expect(sorted.map((t) => t.id)).toEqual([3, 2, 1]);
    });

    it("should sort by string id in ascending order", () => {
      const tasks = [createTask({ id: "2.1" }), createTask({ id: "1.1" }), createTask({ id: "1.2" })];
      const sorted = sortTasks(tasks, "id", "asc");
      expect(sorted.map((t) => t.id)).toEqual(["1.1", "1.2", "2.1"]);
    });

    it("should sort by title in ascending order", () => {
      const tasks = [createTask({ title: "Charlie" }), createTask({ title: "Alice" }), createTask({ title: "Bob" })];
      const sorted = sortTasks(tasks, "title", "asc");
      expect(sorted.map((t) => t.title)).toEqual(["Alice", "Bob", "Charlie"]);
    });

    it("should sort by title in descending order", () => {
      const tasks = [createTask({ title: "Alice" }), createTask({ title: "Charlie" }), createTask({ title: "Bob" })];
      const sorted = sortTasks(tasks, "title", "desc");
      expect(sorted.map((t) => t.title)).toEqual(["Charlie", "Bob", "Alice"]);
    });

    it("should sort by status in ascending order", () => {
      const tasks = [
        createTask({ status: "done" }),
        createTask({ status: "pending" }),
        createTask({ status: "in-progress" }),
      ];
      const sorted = sortTasks(tasks, "status", "asc");
      expect(sorted.map((t) => t.status)).toEqual(["pending", "in-progress", "done"]);
    });

    it("should sort by priority in descending order", () => {
      const tasks = [
        createTask({ priority: "low" }),
        createTask({ priority: "high" }),
        createTask({ priority: "medium" }),
      ];
      const sorted = sortTasks(tasks, "priority", "desc");
      expect(sorted.map((t) => t.priority)).toEqual(["high", "medium", "low"]);
    });

    it("should sort by updated date in descending order", () => {
      const tasks = [
        createTask({ updatedAt: "2024-01-01T00:00:00Z" }),
        createTask({ updatedAt: "2024-03-01T00:00:00Z" }),
        createTask({ updatedAt: "2024-02-01T00:00:00Z" }),
      ];
      const sorted = sortTasks(tasks, "updated", "desc");
      expect(sorted.map((t) => t.updatedAt)).toEqual([
        "2024-03-01T00:00:00Z",
        "2024-02-01T00:00:00Z",
        "2024-01-01T00:00:00Z",
      ]);
    });

    it("should not mutate original array", () => {
      const tasks = [createTask({ id: 3 }), createTask({ id: 1 }), createTask({ id: 2 })];
      const originalOrder = tasks.map((t) => t.id);
      sortTasks(tasks, "id", "asc");
      expect(tasks.map((t) => t.id)).toEqual(originalOrder);
    });

    it("should handle empty array", () => {
      const sorted = sortTasks([], "id", "asc");
      expect(sorted).toEqual([]);
    });

    it("should handle unknown status with default order", () => {
      const tasks = [createTask({ status: "unknown" }), createTask({ status: "pending" })];
      const sorted = sortTasks(tasks, "status", "asc");
      expect(sorted[0]?.status).toBe("pending");
    });
  });

  describe("toggleSortOrder", () => {
    it("should return asc when field changes", () => {
      expect(toggleSortOrder("id", "desc", "title")).toBe("asc");
    });

    it("should toggle from asc to desc when same field", () => {
      expect(toggleSortOrder("id", "asc", "id")).toBe("desc");
    });

    it("should toggle from desc to asc when same field", () => {
      expect(toggleSortOrder("id", "desc", "id")).toBe("asc");
    });

    it("should return asc when starting with different field", () => {
      expect(toggleSortOrder("title", "asc", "id")).toBe("asc");
    });
  });
});
