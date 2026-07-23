import type { WorkspaceSnapshot } from "../types";

export const fallbackSnapshot: WorkspaceSnapshot = {
  project: "axio",
  branch: "main",
  agents: [
    { id: "codex-01", name: "Codex", kind: "codex", status: "running", task: "Map the workspace boundary", worktree: "axio/unify-desktop" },
    { id: "claude-01", name: "Claude Code", kind: "claude_code", status: "waiting", task: "Review the interaction architecture", worktree: "axio/unify-desktop" },
  ],
  tasks: [
    { id: "desktop", title: "Unify the Axio desktop", status: "waiting", worktree: "axio/unify-desktop", agent_ids: ["codex-01", "claude-01"], unread: 1, changed_files: 3, review: "pending" },
    { id: "protocol", title: "Agent protocol refactor", status: "active", worktree: "axio/agent-protocol", agent_ids: ["codex-01"], unread: 0, changed_files: 0, review: "none" },
  ],
  selected_task: "desktop",
  repository: null,
  activity: [
    { id: "activity-1", task_id: "desktop", agent_id: "codex-01", kind: "tool", summary: "Mapped the desktop boundary and shared Rust state", detail: "cargo test --workspace --locked", timestamp: "10:24" },
    { id: "activity-2", task_id: "desktop", agent_id: "claude-01", kind: "change", summary: "Implemented the unified task workspace", detail: "3 files changed in apps/axio-desktop/ui", timestamp: "10:29" },
    { id: "activity-3", task_id: "desktop", agent_id: "claude-01", kind: "approval", summary: "Review the proposed desktop changes", detail: "The task is paused at a local review gate", timestamp: "10:31" },
    { id: "activity-4", task_id: "protocol", agent_id: "codex-01", kind: "status", summary: "Protocol vocabulary is ready to extend", detail: "No external compatibility promise exists at 0.0.1", timestamp: "10:36" },
  ],
};

export function copyFallbackSnapshot(): WorkspaceSnapshot {
  return structuredClone(fallbackSnapshot);
}
