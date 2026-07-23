import { describe, expect, test } from "bun:test";
import { agentRuntimes, sessionsForTask, taskStateSteps } from "../src/data/task-runtime";
import {
  cleanTerminalText,
  TerminalOutputRouter,
  TerminalPreviewBuffer,
  TerminalReplayBuffer,
} from "../src/data/terminal-output";
import { TerminalRenderQueue } from "../src/data/terminal-rendering";
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

  test("coalesces output and applies backpressure across 12 busy panes", () => {
    const schedules = Array.from({ length: 12 }, () => [] as Array<() => void>);
    const writes = Array.from({ length: 12 }, () => [] as Array<{
      complete: () => void;
      data: Uint8Array;
    }>);
    const renderers = writes.map((sessionWrites, session) => new TerminalRenderQueue(
      (data, complete) => sessionWrites.push({ complete, data }),
      (callback) => {
        schedules[session].push(callback);
        return schedules[session].length;
      },
      () => {},
      64 * 1024,
    ));

    for (let event = 0; event < 200_000; event += 1) {
      const session = event % renderers.length;
      renderers[session].push(Uint8Array.of(event % 251));
    }
    schedules.forEach((callbacks) => callbacks.shift()?.());

    expect(writes.flat()).toHaveLength(12);
    writes.forEach((sessionWrites) => expect(sessionWrites[0].data.length).toBeLessThanOrEqual(64 * 1024));

    for (let event = 0; event < 2_400_000; event += 1) {
      const session = event % renderers.length;
      renderers[session].push(Uint8Array.of(event % 251));
    }
    expect(schedules.flat()).toHaveLength(0);
    writes.forEach((sessionWrites) => sessionWrites[0].complete());
    expect(schedules.flat()).toHaveLength(12);
    schedules.forEach((callbacks) => callbacks.shift()?.());

    expect(writes.flat()).toHaveLength(24);
    writes.forEach((sessionWrites) => {
      const overloadWrite = sessionWrites[1].data;
      expect(overloadWrite.length).toBeLessThan(65 * 1024);
      expect(new TextDecoder().decode(overloadWrite.subarray(0, 80))).toContain(
        "Output skipped while terminal was busy",
      );
    });
    renderers.forEach((renderer) => renderer.dispose());
  });

  test("bounds concurrent replay traffic and preserves offset recovery across 12 panes", () => {
    const buffers = Array.from({ length: 12 }, () => new TerminalReplayBuffer(64 * 1024, 128));

    for (let event = 0; event < 2_400_000; event += 1) {
      const session = event % buffers.length;
      const offset = Math.floor(event / buffers.length);
      buffers[session].push({
        session_id: `session-${session}`,
        offset,
        data: [offset % 251],
      });
    }

    buffers.forEach((buffer, session) => {
      const staleReplay = buffer.drain(`session-${session}`, 0);
      expect(staleReplay.gap).toBe(true);
      expect(staleReplay.events).toHaveLength(128);
      expect(staleReplay.events[0].offset).toBe(200_000 - 128);
      expect(staleReplay.events.at(-1)?.offset).toBe(199_999);
    });

    const covered = new TerminalReplayBuffer(4, 4);
    for (let offset = 0; offset < 8; offset += 1) {
      covered.push({ session_id: "covered", offset, data: [offset] });
    }
    const coveredReplay = covered.drain("covered", 6);
    expect(coveredReplay.gap).toBe(false);
    expect(coveredReplay.events.map((event) => event.offset)).toEqual([6, 7]);
  });

  test("bounds and batches live preview updates across 12 noisy sessions", () => {
    const previews = Array.from({ length: 12 }, () => new TerminalPreviewBuffer(4_096));

    for (let event = 0; event < 2_400_000; event += 1) {
      const session = event % previews.length;
      previews[session].append(String.fromCharCode(65 + (event % 26)), 1);
    }

    previews.forEach((preview) => {
      const batch = preview.drain();
      expect(batch.byteCount).toBe(200_000);
      expect(batch.text).toHaveLength(4_096);
      expect(preview.drain()).toEqual({ byteCount: 0, text: "" });
    });

    const suffix = new TerminalPreviewBuffer(4);
    suffix.append("abc", 2);
    suffix.append("def", 3);
    expect(suffix.drain()).toEqual({ byteCount: 5, text: "cdef" });
  });
});
