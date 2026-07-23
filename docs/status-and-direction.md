# Status and direction

Last verified: 2026-07-24.

This is the canonical living status for Axio. It distinguishes demonstrated
behavior from interface simulation so screenshots are never mistaken for a
finished agent runtime.

## Executive status

Axio is an early, public Rust and Tauri foundation at `0.0.1`. It has a working
native desktop shell, a responsive task-first interface, a shared typed state
model, validated in-memory transitions, explicit local Git repository opening,
a recoverable recent-workspace catalog, and a small CLI. New repositories begin
with one honest local task record and no manufactured agent, command, check, or
review history. The build can launch bounded, task-scoped Codex, Claude Code,
OpenCode, and shell processes in real PTYs inside one multi-pane Terminal mode.
It does not yet
normalize those processes behind connector contracts, reconnect after restart,
create Git worktrees, or render complete live diffs. Repository-scoped task,
agent, activity, selection, and review state now survives restart.

There is one desktop product. The CLI remains a separate automation consumer of
the same Rust core. The paused legacy switcher is not a second current app.

## Implemented and verified

| Area | Current behavior | Evidence |
|---|---|---|
| Protocol | Serializable agent, task, activity, review, and workspace snapshot types. | `crates/axio-protocol`; Rust compilation and tests. |
| Core state | Validated agent transitions, task selection/creation, direction-log events, review decisions, honest first-repository state, and closed/restored workspace invariants. | `crates/axio-core`; focused unit tests. |
| Repository inspection | Discovers the Git checkout containing the process directory or executable, then reads its root, branch, tracked/untracked file inventory, working-tree statuses, and text line statistics without invoking a shell. | `crates/axio-core/src/repository.rs`; parser tests and live CLI verification. |
| Workspace lifecycle | Opens a Git repository with the native OS folder chooser or an explicit local path, keeps bounded recents, restores complete task/agent/activity state independently per repository, and closes into a useful empty state without changing source files. A schema-v2 two-slot local store migrates schema v1 and retains the last valid generation after an interrupted or corrupt write. | `crates/axio-core/src/persistence.rs`; migration, recovery, path, removal, isolation, and desktop-runtime restart tests plus native Windows verification. |
| CLI | `status`, `status --json`, and `version` over the same honest repository snapshot used for a new desktop workspace. | CLI smoke test in CI and local repository verification. |
| Native shell | Tauri window, drag/minimize/maximize/close, narrow command bridge, and restrictive CSP. | Native release build and manual Windows run. |
| Task workspace | Task-boundary selection, chronological activity, explicit attention state, inline task validation, live PTY runtime projection, direction logging, and review decisions. | UI tests plus browser and native interaction verification. |
| Navigation | Independently collapsible wide panels, mutually exclusive focus-contained compact overlays, focus mode, and a command palette with recovery state. | `design-qa.md` at desktop and compact viewports. |
| Composer | Records a direction, decision, or handoff in the selected task activity. It explicitly does not claim to route text to a provider. | Core tests and UI interaction verification. |
| Context tools | Independently resizable dock with an explicitly unconnected Browser state, live repository files and review facts, real bounded PTY output, and task state derived from repository, session, and review data. The former secondary Terminal is named Output. | UI tests and `ui/src/components/context/`. |
| Terminal mode | Launches up to 12 concurrent provider or shell PTYs in an adaptive pane grid, with bounded output replay, ANSI rendering, keyboard input, resize, PID/exit state, and stop/close controls. Sessions use the selected repository root, are scoped to the selected task, and stop when their repository closes or changes. | `src-tauri/src/terminal.rs`; Rust boundary tests, TypeScript tests, production build, and native Windows interaction verification. |
| Settings | Searchable Appearance, Workspace, Composer, and Accessibility categories with typed local persistence and reset, including toolbar labels, Review count, and startup context-tool preferences. | `settings.md`, `ui/src/hooks/useSettings.ts`, `ui/src/components/settings/`, and browser interaction verification. |
| Delivery checks | Windows CI runs formatting, Clippy, tests, and CLI JSON smoke; local verification adds TypeScript checking, the Vite production build, interaction QA, and native release compilation. | `.github/workflows/ci.yml`, `testing.md`, and the latest `design-qa.md`. |
| Documentation | Architecture, product, design, setup, references, security, testing, and release guidance. | This documentation index and link audit. |

## Functional but simulated

These controls work as UI and state transitions, but their external effects are
not implemented:

| Surface | What happens now | Missing real integration |
|---|---|---|
| Persisted agent state | Legacy or restored sessions can contain typed `AgentStatus`, but the current sidebar and Canvas project live state from real task PTYs instead. | Connector acknowledgement, durable identity, pause/resume, and recovery. |
| Create task | Adds and persists a local task record and generated boundary label. The dialog states that it does not create a Git worktree or launch a provider. | Repository selection and `git worktree` creation. |
| Composer | Persists a direction-log event in the selected timeline and labels it as a task record. | Routing to Codex, Claude Code, OpenCode, Pi, or custom connectors. |
| Review approval | Persists review/task status and an event. | Reading a real diff, staging, committing, merging, or returning feedback to an agent. |
| Diff panel | Native builds show only live changed paths, statuses, and available line totals. Review activity is drawn from the selected task. | Unified patches, hunk navigation, staged/unstaged grouping, and binary detail. |
| Browser tool | Clearly reports that embedded browsing is not connected and disables browser controls. | Native embedded webview lifecycle and dev-server discovery. |
| File explorer | Native builds show a bounded, searchable tree of tracked and untracked repository paths, safe read-only text previews up to 256 KiB, binary identification, and manual refresh. Non-native runs report repository unavailability. | Filesystem watches, editing, and explicit worktree scoping. |
| Output panel | Replays and follows the selected task's real bounded PTY output with provider, PID/exit state, and working directory. | Durable, structured command events and persisted logs. |
| State panel | Derives repository, task, terminal, working-tree, and review state from the selected task. | Connector-authored plans and durable step provenance. |
| Command palette | Switches persisted tasks and invokes local UI actions. | Search across real repositories, files, commands, and sessions. |
| Status bar | Native builds show the discovered project, branch, and working-tree change count. | Live engine, test, usage, and connector health. |

The browser-only UI begins in an honest empty-workspace state. The Tauri build
creates an initial repository task without manufactured progress and persists
repository-scoped mutations in Axio's local application-data directory.
Existing persisted repository sessions are preserved rather than destructively
rewritten.

## Not implemented

- Future schema migrations beyond v1-to-v2 and retention/export controls for
  persisted session history.
- Agent connector descriptors, capability negotiation, authentication handoff,
  structured lifecycle events, or restart reconciliation.
- Graceful process-stop escalation, orphan recovery, terminal search/export,
  structured tool events, durable logs, redaction, or timeouts.
- Git worktrees, complete diffs, staging, merge, or conflict flows.
- Filesystem watches, file editing, and editor handoff.
- OS notifications, scheduled work, automations, or background daemon.
- Remote execution, synchronization, accounts, billing, or hosted inference.
- Installer bundles, signing, auto-update, rollback, or stable release channel.
- Automated browser, accessibility, native-window, or cross-platform E2E tests.

## Known risks and debt

- Workspace writes are serialized by one process-local mutex; multi-process
  coordination is not implemented.
- Persisted directions and activity are local plaintext application data;
  credential redaction and retention controls must precede real connectors.
- Terminal output is memory-only and capped at 512 KiB per pane, but provider
  processes currently inherit Axio's environment so their existing
  authentication flows work. Environment allowlisting and secret redaction are
  required before terminal events can be persisted or exported.
- The UI now uses TypeScript, React, and Vite with feature-owned components,
  hooks, services, fixtures, and styles. Automated interaction coverage still
  needs to move from the manual release gate into CI as behavior grows.
- The current Linux Tauri dependency chain includes `glib 0.18.5`. GitHub has an
  open moderate alert for unsound iterator implementations; the patched line
  begins at `0.20.0`, while Tauri's GTK3 stack currently selects `0.18.x`.
- Windows builds can emit non-fatal incremental-cache access warnings on this
  workstation. A successful exit remains authoritative.

## Direction

The next work is outcome-driven rather than tied to invented version numbers or
dates. The dependency order is:

1. Normalize the working PTY process boundary behind one real external-agent
   connector lifecycle.
2. Turn process, terminal, tool, and approval events into the task narrative.
3. Connect task boundaries to real Git worktrees and review operations.
4. Maintain migration coverage while proving recovery, diagnostics, security
   boundaries, and cross-platform builds.
5. Package a signed, supportable desktop release only after the daily workflow
   is dependable.

Detailed scope and acceptance criteria are in
[`product-plan.md`](product-plan.md). Architecture and product choices that
should not be reopened casually are in [`decisions.md`](decisions.md).
The first audited interface refinement is implemented and verified in
[`ui-improvement-plan.md`](ui-improvement-plan.md),
[`ui-audit-2026-07-22.md`](ui-audit-2026-07-22.md), and
[`../design-qa.md`](../design-qa.md). Remaining overview, live-data, native
assistive-technology, and failure/recovery work stays subordinate to the real
runtime outcomes above.

## Definition of a dependable daily workspace

Axio is ready to be described as a daily agent workspace when a user can open a
real repository, create an isolated Git-backed task, launch at least one supported agent,
observe and steer its live work, review a real diff, recover after restart, and
complete the task without leaving Axio for basic process or Git control. The
workflow must have automated tests, actionable failure states, documented data
ownership, and no credential leakage.
