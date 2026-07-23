import { describe, expect, test } from "bun:test";
import { agentRuntimes, sessionsForTask, taskStateSteps } from "../src/data/task-runtime";
import { cleanTerminalText, TerminalOutputRouter } from "../src/data/terminal-output";
import type { AgentSession, TerminalSessionSnapshot, WorkspaceSnapshot, WorkspaceTask } from "../src/types";

const task: WorkspaceTask = {
  id: "task-1",
  title: "Truthful state",
  status: "active",
  worktree: "axio/truthful-state",
  agent_ids: ["codex"],
  unread: 0,
  changed_files: 1,
  review: "pending",
};
const agents: AgentSession[] = [
  { id: "codex", name: "Codex", kind: "codex", status: "waiting", task: "legacy state" },
];
const sessions: TerminalSessionSnapshot[] = [
  { id: "one", provider: "codex", ordinal: 1, status: "running", task_id: "task-1", repository_root: "C:/repo", cwd: "C:/repo", pid: 42 },
  { id: "other", provider: "codex", ordinal: 2, status: "failed", task_id: "task-2", repository_root: "C:/repo", cwd: "C:/repo" },
];

describe("task runtime projections", () => {
  test("scopes terminal sessions to the selected task", () => {
    expect(sessionsForTask(sessions, task.id).map((session) => session.id)).toEqual(["one"]);
  });

  test("uses native terminal state instead of persisted agent status", () => {
    expect(agentRuntimes(agents, task, sessions)[0]).toMatchObject({
      runningSessions: 1,
      sessionCount: 1,
      status: "running",
    });
  });

  test("derives task state from repository and terminal facts", () => {
    const snapshot: WorkspaceSnapshot = {
      project: "repo",
      branch: "main",
      agents,
      tasks: [task],
      selected_task: task.id,
      activity: [],
      repository: {
        root: "C:/repo",
        name: "repo",
        branch: "main",
        files: [],
        files_truncated: false,
        changes: [{ path: "README.md", status: "M", additions: 1, deletions: 0 }],
      },
    };
    expect(taskStateSteps(snapshot, task, sessions).map(({ label, status }) => [label, status])).toEqual([
      ["Repository", "main"],
      ["Task workspace", "axio/truthful-state"],
      ["Terminal sessions", "1 running"],
      ["Working tree", "1 changed"],
      ["Review gate", "pending"],
    ]);
  });

  test("removes terminal control sequences without hiding captured text", () => {
    expect(cleanTerminalText("\u001b[2J\u001b[31mhello\u001b[0m\rworld\u0000")).toBe("hello\nworld");
  });

  test("routes sustained output directly across the full session limit", () => {
    const router = new TerminalOutputRouter();
    const delivered = Array.from({ length: 12 }, () => 0);
    const dispose = delivered.map((_, index) => router.subscribe(`session-${index}`, () => {
      delivered[index] += 1;
    }));

    for (let index = 0; index < 12_000; index += 1) {
      const session = index % delivered.length;
      router.dispatch({
        session_id: `session-${session}`,
        offset: index,
        data: [index % 256],
      });
    }

    expect(delivered).toEqual(Array.from({ length: 12 }, () => 1_000));
    dispose.forEach((unsubscribe) => unsubscribe());
    router.dispatch({ session_id: "session-0", offset: 12_000, data: [0] });
    expect(delivered[0]).toBe(1_000);
  });
});
