# Status and direction

Last verified: 2026-07-23.

This is the canonical living status for Axio. It distinguishes demonstrated
behavior from interface simulation so screenshots are never mistaken for a
finished agent runtime.

## Executive status

Axio is an early, public Rust and Tauri foundation at `0.0.1`. It has a working
native desktop shell, a responsive task-first interface, a shared typed state
model, validated in-memory transitions, read-only discovery of the containing
Git repository, and a small CLI. The current build combines a real repository
boundary with deterministic task and agent demo data. It does not yet launch or
supervise real coding agents, create Git worktrees, stream terminals, persist
workspaces, or render complete live diffs.

There is one desktop product. The CLI remains a separate automation consumer of
the same Rust core. The paused legacy switcher is not a second current app.

## Implemented and verified

| Area | Current behavior | Evidence |
|---|---|---|
| Protocol | Serializable agent, task, activity, review, and workspace snapshot types. | `crates/axio-protocol`; Rust compilation and tests. |
| Core state | Validated agent transitions, task selection/creation, direction events, and review decisions. | `crates/axio-core`; five unit tests. |
| Repository inspection | Discovers the Git checkout containing the process directory or executable, then reads its root, branch, tracked/untracked file inventory, working-tree statuses, and text line statistics without invoking a shell. | `crates/axio-core/src/repository.rs`; parser tests and live CLI verification. |
| CLI | `status`, `status --json`, and `version` over the shared snapshot, enriched with live repository data when discovery succeeds. | CLI smoke test in CI and local repository verification. |
| Native shell | Tauri window, drag/minimize/maximize/close, narrow command bridge, and restrictive CSP. | Native release build and manual Windows run. |
| Task workspace | Task/worktree selection, chronological activity, explicit attention state, inline task validation, agent controls, directions, and review decisions. | Browser and native interaction verification. |
| Navigation | Independently collapsible wide panels, mutually exclusive focus-contained compact overlays, focus mode, and a command palette with recovery state. | `design-qa.md` at desktop and compact viewports. |
| Composer | Visible target, worktree, direction mode, review policy, target-aware send label, and configurable submission/default audience behavior. | UI interaction and accessibility-tree verification. |
| Context tools | Centered launcher plus independently resizable dock with browser, file explorer, changed-file review, command output, and plan surfaces; tool state survives switching. | UI interaction verification and `ui/src/components/context/`. |
| Settings | Searchable Appearance, Workspace, Composer, and Accessibility categories with typed local persistence and reset, including toolbar labels, Review count, and startup context-tool preferences. | `settings.md`, `ui/src/hooks/useSettings.ts`, `ui/src/components/settings/`, and browser interaction verification. |
| Delivery checks | Windows CI runs formatting, Clippy, tests, and CLI JSON smoke; local verification adds TypeScript checking, the Vite production build, interaction QA, and native release compilation. | `.github/workflows/ci.yml`, `testing.md`, and the latest `design-qa.md`. |
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
| Diff panel | Native builds show live changed paths, statuses, and available line totals; browser-only preview data remains representative. | Unified patches, hunk navigation, staged/unstaged grouping, and binary detail. |
| Browser tool | Provides a working address/refresh shell and preview boundary. | Native embedded webview lifecycle and dev-server discovery. |
| File explorer | Native builds show a bounded, searchable tree of tracked and untracked repository paths, safe read-only text previews up to 256 KiB, binary identification, and manual refresh; browser-only runs identify their preview data. | Filesystem watches, editing, and explicit worktree scoping. |
| Output panel | Shows representative terminal output. | PTY/process streaming, input, resize, and exit status. |
| Plan panel | Shows representative task steps. | Connector plan events and durable progress. |
| Command palette | Switches demo tasks and invokes local UI actions. | Search across real repositories, commands, and sessions. |
| Status bar | Native builds show the discovered project, branch, and working-tree change count. | Live engine, test, usage, and connector health. |

The browser preview intentionally uses a typed fallback snapshot. The Tauri
build initializes deterministic task and agent state, enriches it with the
containing Git repository when available, and keeps task mutations only for the
process life.

## Not implemented

- Repository/folder picker, recent-workspace management, and explicit close.
- Durable database, migrations, crash recovery, or session restoration.
- Agent connector descriptors, authentication handoff, or process supervision.
- PTY terminal sessions, structured tool events, logs, cancellation, or timeouts.
- Git worktrees, complete diffs, staging, merge, or conflict flows.
- Filesystem watches, file editing, and editor handoff.
- OS notifications, scheduled work, automations, or background daemon.
- Remote execution, synchronization, accounts, billing, or hosted inference.
- Installer bundles, signing, auto-update, rollback, or stable release channel.
- Automated browser, accessibility, native-window, or cross-platform E2E tests.

## Known risks and debt

- The demo state can make the interface appear more complete than the runtime;
  all product communication must preserve the distinction above.
- Workspace state is protected by one process-local mutex and is lost on exit.
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

1. Extend automatic read-only repository discovery into explicit open/recent
   workspace selection and durable restoration.
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
