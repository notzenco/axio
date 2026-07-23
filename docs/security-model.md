# Security model

This document describes the current trust boundary and the requirements that
must hold as Axio gains real repository and process access. Vulnerability
reports follow [`../SECURITY.md`](../SECURITY.md).

## Current boundary

The current application is local-only and combines deterministic task/agent
demo state with explicit read-only access to a user-selected Git repository. It
can launch known local agent executables and shells in task-scoped PTYs. It has
no Axio account, network client, credential store, updater, or hosted service.

The Tauri window has:

- a content security policy limited to local content and Tauri IPC;
- `core:default` plus explicit window-drag permission;
- a narrow allowlisted Rust command bridge for workspace persistence,
  repository inspection, safe file reads, terminal session operations, and
  window controls;
- no shell plugin, HTTP plugin, filesystem plugin, or broad command execution;
- UI rendering that uses DOM `textContent` for dynamic snapshot values rather
  than injecting HTML.

Appearance preferences are stored in the webview's local storage. Repository
paths and repository-scoped task, agent, review, and activity state are stored
as plaintext JSON in two recoverable generations below Axio's platform app
configuration directory. Source repositories are never used for Axio state.
Terminal output and process handles are memory-only. Each pane retains at most
512 KiB for replay, and Axio allows at most 12 concurrent sessions. Provider
processes currently inherit Axio's environment so their own authentication
flows continue to work; environment values are neither returned to the webview
nor persisted by Axio. Windows provider processes are assigned to a
kill-on-close job object so the operating system removes the process tree if
Axio exits without running normal cleanup.

## Assets to protect

Future Axio versions will handle:

- source code and uncommitted changes;
- repository paths, branches, worktrees, and Git identity;
- agent prompts, outputs, tool calls, and local logs;
- provider authentication state and environment variables;
- approval decisions and process-control authority;
- persisted workspace data and diagnostic exports.

## Trust boundaries

1. **User to Axio UI:** destructive or externally visible operations require a
   clear target and explicit intent.
2. **Webview to Rust:** all command inputs are untrusted and validated in Rust;
   capabilities remain least privilege.
3. **Axio to agent process:** connectors receive only the repository, worktree,
   environment, and permissions required for that task.
4. **Agent output to UI/storage:** terminal text and structured events are
   untrusted content, safely rendered, bounded, and redacted before storage.
5. **Axio to Git/filesystem:** paths are canonicalized, ownership is checked,
   and destructive scope is never inferred from display strings.
6. **Axio to provider authentication:** credentials remain in the provider's
   intended flow and are never copied into prompts, logs, Git, or diagnostics.
7. **Build to user:** releases require pinned CI, signed artifacts, checksums,
   provenance, and human publication approval.

## Current execution controls

- Only Shell, Codex, Claude Code, and OpenCode provider identifiers map to
  initial executable argument arrays. Interactive PTY input intentionally has
  the authority of the launched process and is bounded per IPC write.
- The working directory comes from the active repository snapshot rather than
  user-entered terminal text.
- Spawn requests are limited to eight instances and 12 running sessions total.
- Output replay is memory-bounded and rendered by xterm without HTML injection.
- Sessions expose explicit stop and close operations and are stopped when their
  repository is closed or replaced.
- Output, environment values, and credentials are not written to workspace
  persistence.

## Required controls before connector integration

- Versioned connector capabilities and explicit executable discovery.
- Environment allowlist with secret-name and value redaction.
- Process-group ownership, cancellation escalation, and orphan reconciliation.
- Repository/worktree allowlist and canonical path containment checks.
- Output size, event rate, log retention, and disk quotas.
- Approval records that distinguish review from commit, merge, push, publish,
  deploy, or message-sending authority.
- Diagnostic preview and opt-in for any source or event content leaving the
  machine.
- Threat modeling before remote execution, plugins, hosted sync, or updates.

## Known dependency alert

As of 2026-07-22, GitHub reports one open moderate Dependabot alert for
`glib 0.18.5`: unsound `Iterator` and `DoubleEndedIterator` implementations for
`glib::VariantStrIter`. It is selected by Tauri's Linux GTK3 dependency chain;
the advisory's first patched line is `0.20.0`. Do not force a semver-incompatible
lockfile replacement. Track the Tauri/GTK dependency path, test the supported
Linux build, and update when the upstream stack provides a compatible route.

## Security non-claims

The current approval cards are product-flow prototypes, not a sandbox. Terminal
mode gives each pane a PTY, not filesystem or process isolation: concurrent
agents can edit the same repository. Axio does not yet guarantee command
safety, attest outputs, gracefully escalate cancellation, reconcile orphaned
processes, encrypt persisted history, redact credentials from user-authored
directions, or enforce durable retention limits. The local-only principle,
bounded in-memory output, and recoverable workspace writes reduce exposure and
data-loss risk but do not replace process, path, secret, storage, and release
controls.
