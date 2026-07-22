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

These operations only mutate the in-memory snapshot. Generated worktree labels
do not create Git worktrees.

## Tauri command boundary

The desktop exposes:

- `workspace_snapshot`
- `set_agent_status`
- `select_task`
- `create_task`
- `send_direction`
- `review_task`
- `window_action`

Workspace commands return a complete updated snapshot or a string error. The
window command accepts only drag, minimize, maximize/unmaximize, and close.

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
- Before persistence, connector plugins, or third-party automation ship,
  introduce explicit schema/protocol versions and migration behavior.
- Do not use display strings as durable identifiers.
- Timestamps must become structured, ordered values before activity is
  persisted; the current human-readable strings are demo data.
