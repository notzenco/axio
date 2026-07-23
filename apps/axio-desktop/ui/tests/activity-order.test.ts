import { describe, expect, test } from "bun:test";
import { activityForTask } from "../src/data/activity-order";
import type { WorkspaceActivity } from "../src/types";

const activity: WorkspaceActivity[] = [
  { id: "1", task_id: "desktop", agent_id: null, kind: "message", summary: "first", timestamp: "now" },
  { id: "2", task_id: "other", agent_id: null, kind: "message", summary: "unrelated", timestamp: "now" },
  { id: "3", task_id: "desktop", agent_id: null, kind: "message", summary: "second", timestamp: "now" },
  { id: "4", task_id: "desktop", agent_id: null, kind: "message", summary: "newest", timestamp: "now" },
];

describe("activityForTask", () => {
  test("preserves append order so the newest event renders last", () => {
    expect(activityForTask(activity, "desktop").map((event) => event.summary)).toEqual([
      "first",
      "second",
      "newest",
    ]);
  });
});
