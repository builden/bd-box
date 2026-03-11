import { describe, it, expect } from "bun:test";
import { buildKanbanColumns } from "./taskKanban";

describe("taskKanban", () => {
  describe("buildKanbanColumns", () => {
    const createTask = (status: string): any => ({
      id: 1,
      title: "Test Task",
      status,
    });

    const t = (key: string) => key;

    it("should include core workflow columns even without tasks", () => {
      const tasks: any[] = [];
      const columns = buildKanbanColumns(tasks, t);

      expect(columns.map((c) => c.id)).toContain("pending");
      expect(columns.map((c) => c.id)).toContain("in-progress");
      expect(columns.map((c) => c.id)).toContain("done");
    });

    it("should not include blocked column without tasks", () => {
      const tasks: any[] = [];
      const columns = buildKanbanColumns(tasks, t);

      expect(columns.map((c) => c.id)).not.toContain("blocked");
    });

    it("should include blocked column when there are blocked tasks", () => {
      const tasks = [createTask("blocked")];
      const columns = buildKanbanColumns(tasks, t);

      expect(columns.map((c) => c.id)).toContain("blocked");
    });

    it("should group tasks by status", () => {
      const tasks = [createTask("pending"), createTask("pending"), createTask("in-progress"), createTask("done")];
      const columns = buildKanbanColumns(tasks, t);

      const pendingCol = columns.find((c) => c.id === "pending");
      const inProgressCol = columns.find((c) => c.id === "in-progress");
      const doneCol = columns.find((c) => c.id === "done");

      expect(pendingCol?.tasks).toHaveLength(2);
      expect(inProgressCol?.tasks).toHaveLength(1);
      expect(doneCol?.tasks).toHaveLength(1);
    });

    it("should use pending as default status for tasks without status", () => {
      const tasks = [{ id: 1, title: "Task without status" }];
      const columns = buildKanbanColumns(tasks, t);

      const pendingCol = columns.find((c) => c.id === "pending");
      expect(pendingCol?.tasks).toHaveLength(1);
    });

    it("should include deferred column when there are deferred tasks", () => {
      const tasks = [createTask("deferred")];
      const columns = buildKanbanColumns(tasks, t);

      expect(columns.map((c) => c.id)).toContain("deferred");
    });

    it("should include cancelled column when there are cancelled tasks", () => {
      const tasks = [createTask("cancelled")];
      const columns = buildKanbanColumns(tasks, t);

      expect(columns.map((c) => c.id)).toContain("cancelled");
    });
  });
});
