# Status and direction

Last verified: 2026-07-23.

This is the canonical living status for Axio. It distinguishes demonstrated
behavior from interface simulation so screenshots are never mistaken for a
finished agent runtime.

## Executive status

Axio is an early, public Rust and Tauri foundation at `0.0.1`. It has a working
native desktop shell, a responsive task-first interface, a shared typed state
model, validated in-memory transitions, and a small CLI. The current build is a
functional interaction prototype over deterministic demo data. It does not yet
launch or supervise real coding agents, create Git worktrees, stream terminals,
persist workspaces, or read live diffs.

There is one desktop product. The CLI remains a separate automation consumer of
the same Rust core. The paused legacy switcher is not a second current app.

## Implemented and verified

| Area | Current behavior | Evidence |
|---|---|---|
| Protocol | Serializable agent, task, activity, review, and workspace snapshot types. | `crates/axio-protocol`; Rust compilation and tests. |
| Core state | Validated agent transitions, task selection/creation, direction events, and review decisions. | `crates/axio-core`; five unit tests. |
| CLI | `status`, `status --json`, and `version` over the shared demo snapshot. | CLI smoke test in CI. |
| Native shell | Tauri window, drag/minimize/maximize/close, narrow command bridge, and restrictive CSP. | Native release build and manual Windows run. |
| Task workspace | Task/worktree selection, chronological activity, explicit attention state, inline task validation, agent controls, directions, and review decisions. | Browser and native interaction verification. |
| Navigation | Independently collapsible wide panels, mutually exclusive focus-contained compact overlays, focus mode, and a command palette with recovery state. | `design-qa.md` at desktop and compact viewports. |
| Composer | Visible target, worktree, direction mode, review policy, and target-aware send label. | UI interaction and accessibility-tree verification. |
| Context | Pinned/expanded inspector with changed-file navigation, completed command record, output wrapping, and read-only plan states. | UI interaction verification. |
| Appearance | Glass intensity, compact density, reduced-motion override, and local browser-view persistence. | `localStorage` behavior in `ui/app.js`. |
| Delivery checks | Windows CI runs formatting, Clippy, tests, and CLI JSON smoke; local verification adds JavaScript syntax, interaction QA, and native release compilation. | `.github/workflows/ci.yml`, `testing.md`, and the latest `design-qa.md`. |
| Documentation | Architecture, product, design, setup, references, security, testing, and release guidance. | This documentation index and link audit. |

## Functional but simulated

These controls work as UI and state transitions, but their external effects are
not implemented:

| Surface | What happens now | Missing real integration |
|---|---|---|
| Agent pause/resume | Changes `AgentStatus` in memory. | Process signals, connector acknowledgement, and recovery. |
| Create task | Adds a task and generated worktree name in memory. | Repository selection and `git worktree` creation. |
| Composer | Appends a direction event to the selected timeline. | Routing to Codex, Claude Code, OpenCode, Pi, or custom connectors. |
| Review approval | Changes review/task status and appends an event. | Reading a real diff, staging, committing, merging, or returning feedback to an agent. |
| Diff panel | Shows representative code changes. | Git-backed file and hunk data. |
| Output panel | Shows representative terminal output. | PTY/process streaming, input, resize, and exit status. |
| Plan panel | Shows representative task steps. | Connector plan events and durable progress. |
| Command palette | Switches demo tasks and invokes local UI actions. | Search across real repositories, commands, and sessions. |
| Status bar | Reflects current demo snapshot. | Live engine, Git, test, usage, and connector health. |

The static browser preview intentionally uses a JavaScript fallback snapshot.
The Tauri build calls Rust commands, but Rust currently initializes the same
deterministic `Workspace::demo()` data and keeps it only for the process life.

## Not implemented

- Project discovery, repository opening, and recent-workspace management.
- Durable database, migrations, crash recovery, or session restoration.
- Agent connector descriptors, authentication handoff, or process supervision.
- PTY terminal sessions, structured tool events, logs, cancellation, or timeouts.
- Real Git status, branches, worktrees, diffs, staging, merge, or conflict flows.
- Filesystem browser and editor handoff.
- OS notifications, scheduled work, automations, or background daemon.
- Remote execution, synchronization, accounts, billing, or hosted inference.
- Installer bundles, signing, auto-update, rollback, or stable release channel.
- Automated browser, accessibility, native-window, or cross-platform E2E tests.

## Known risks and debt

- The demo state can make the interface appear more complete than the runtime;
  all product communication must preserve the distinction above.
- Workspace state is protected by one process-local mutex and is lost on exit.
- The UI is plain JavaScript with manual DOM rendering; this is acceptable for
  the foundation but needs maintainability and automated interaction coverage
  as behavior grows.
- The current Linux Tauri dependency chain includes `glib 0.18.5`. GitHub has an
  open moderate alert for unsound iterator implementations; the patched line
  begins at `0.20.0`, while Tauri's GTK3 stack currently selects `0.18.x`.
- Windows builds can emit non-fatal incremental-cache access warnings on this
  workstation. A successful exit remains authoritative.

## Direction

The next work is outcome-driven rather than tied to invented version numbers or
dates. The dependency order is:

1. Make a real local repository durable in Axio.
2. Define and prove one real external-agent connector lifecycle.
3. Turn process, terminal, tool, and approval events into the task narrative.
4. Connect task boundaries to real Git worktrees and review operations.
5. Prove recovery, diagnostics, security boundaries, and cross-platform builds.
6. Package a signed, supportable desktop release only after the daily workflow
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
real repository, create an isolated task, launch at least one supported agent,
observe and steer its live work, review a real diff, recover after restart, and
complete the task without leaving Axio for basic process or Git control. The
workflow must have automated tests, actionable failure states, documented data
ownership, and no credential leakage.
