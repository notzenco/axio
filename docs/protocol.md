# Protocol and state model

`axio-protocol` owns values that can cross UI, process, connector, or future
persistence boundaries. `axio-core` owns mutation rules and returns complete
snapshots to consumers. The current protocol is intentionally small and may
change during `0.x`.

## Current snapshot

`WorkspaceSnapshot` contains:

- project and primary branch labels;
- agent sessions;
- tasks;
- the selected task ID;
- chronological activity.
- live repository metadata when a repository is open.

An `AgentSession` has an ID, display name, connector kind, lifecycle status,
current task text, and optional worktree label. Supported vocabulary currently
includes Codex, Claude Code, OpenCode, Pi, and a custom string; these values do
not mean the corresponding connectors are implemented.

A `WorkspaceTask` has an ID, outcome title, status, worktree label, assigned
agent IDs, unread count, changed-file count, and review status.

A `WorkspaceActivity` has an ID, task ID, optional agent ID, kind, summary,
optional detail, and timestamp string. Activity kinds are message, tool,
change, approval, and status.

## Lifecycle rules

Agent transitions accepted by `axio-core`:

| From | Allowed next states |
|---|---|
| Idle | Starting |
| Starting | Running, Failed |
| Running | Waiting, Completed, Failed |
| Waiting | Running, Completed, Failed |
| Completed | Starting |
| Failed | Starting |

Transitioning to the existing state is idempotent. Unknown agents and invalid
transitions return typed core errors.

Task behavior currently supports:

- select an existing task and clear its unread count;
- create and select a non-empty task with a generated ID and worktree label;
- append a non-empty user direction;
- approve a task, marking it completed;
- reject a task, returning it to waiting.

Desktop operations commit repository-scoped tasks, agents, activity, review
state, and selection through the schema-v2 local store before publishing the
new snapshot in memory. Generated worktree labels do not create Git worktrees.

`WorkspaceSession` is the persisted vocabulary separated from live repository
metadata. Schema v1 catalogs migrate into schema v2; repositories without a
complete saved session retain their legacy selected-task behavior and receive
the deterministic initial state.

Terminal mode uses transient protocol vocabulary rather than
`WorkspaceSession`. `TerminalSessionSnapshot` identifies the provider, task,
repository root, working directory, PID, lifecycle state, and exit code without
including output or environment values. `TerminalOutputSnapshot` and
`TerminalOutputEvent` carry bounded binary PTY data with byte offsets so a pane
can combine replay and live events without gaps or duplication.
`terminal_capacity` returns the number of app-wide running or stopping
sessions. It is authoritative for launch-control UX; the native spawn boundary
still validates and serializes every batch.

## Tauri command boundary

The desktop exposes:

- `workspace_snapshot`
- `workspace_lifecycle`
- `pick_workspace_folder`
- `open_workspace`
- `close_workspace`
- `remove_recent_workspace`
- `refresh_repository`
- `read_repository_file`
- `set_agent_status`
- `select_task`
- `create_task`
- `send_direction`
- `review_task`
- `terminal_sessions`
- `terminal_capacity`
- `spawn_terminal_instances`
- `terminal_output`
- `write_terminal_input`
- `resize_terminal`
- `stop_terminal`
- `close_terminal`
- `window_action`

Workspace commands return a complete updated snapshot or a string error. The
terminal boundary accepts only known providers, bounded counts, existing
session IDs, byte input, and dimensions. Batches contain one to eight sessions,
the application allows 12 active sessions, and stopping sessions retain their
slot until exit. The window command accepts only drag, minimize,
maximize/unmaximize, and close.

## CLI contract

Current commands:

```text
axio status
axio status --json
axio version
```

`status --json` serializes the same demo `WorkspaceSnapshot` used by the
desktop core. It is useful for proving a shared boundary, not yet a live engine
status API.

## Compatibility rules

- Treat serialized field names and enum values as deliberate even before they
  become stable.
- During `0.x`, a breaking change must update every consumer, fixture, test, and
  relevant document in one change.
- Every persisted schema change requires explicit versioning and migration
  coverage.
- Do not use display strings as durable identifiers.
- Human-readable demo timestamps are currently persisted. They must become
  structured, ordered values before real connector events ship.
