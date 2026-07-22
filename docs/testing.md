# Testing and verification

Axio's definition of done combines automated state checks, native compilation,
interaction verification, and documentation truthfulness.

## Required automated gates

```powershell
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cargo run -p axio-cli --locked -- status --json
node --check apps\axio-desktop\ui\app.js
git diff --check
```

The GitHub Windows CI currently runs formatting, Clippy, Rust tests, and the CLI
smoke test. Native release compilation and UI verification are required locally
until equivalent CI jobs exist.

## Current Rust coverage

Five core unit tests verify:

- a running agent can wait and resume;
- an invalid running-to-idle transition is rejected;
- an unknown agent is rejected;
- task creation selects a generated task/worktree boundary;
- directions and review decisions appear in the task narrative.

There are currently no automated tests for the CLI argument parser, Tauri
command handlers, browser interactions, accessibility tree, persistence,
processes, PTYs, Git, installers, or migration behavior.

## Desktop interaction checklist

For any desktop change, verify in the native Tauri window:

- non-interactive titlebar regions drag the window;
- minimize, maximize/restore, and close behave natively;
- workspace and context sidebars open, close, and return their width;
- compact overlays are mutually exclusive, contain focus, close with Escape or
  the scrim, and restore focus to their invoker;
- focus mode enters/exits, clears hidden-panel semantics, and restores the
  previous layout without losing the selected task;
- task/worktree selection updates the timeline;
- agent lifecycle buttons show valid transitions and errors;
- task creation keeps invalid/recoverable errors in the dialog, while valid
  creation, directions, and review decisions update through Tauri IPC;
- review entry points open one decision surface with distinct Return with
  feedback and Approve review actions;
- command palette, no-results recovery, and keyboard shortcuts work;
- settings persist appearance without breaking reduced-motion behavior;
- compact layout has no horizontal overflow or unreachable controls.

Also load the static preview to confirm its fallback path remains usable, but do
not use the preview as evidence for native IPC.

## Responsive viewports

The current design baseline has been inspected at:

- 1440 x 900 desktop;
- 960 x 720 medium overlay layout;
- 720 x 900 supported compact minimum;
- 360 x 800 browser-only narrow stress test.

New layouts should cover at least one wide, one threshold-adjacent, and one
narrow viewport. Test combined states such as both sidebars closed and the
context inspector overlaying a narrow task.

## Evidence

Focused visual evidence belongs in `docs/design/`. The latest audited UI QA is
[`../design-qa.md`](../design-qa.md). Evidence must identify source image,
implementation viewport, interaction state, findings, and final pass/fail.

## Future test layers

Before claiming daily-workspace readiness, add:

- table/property tests for every state machine;
- snapshot and backward-compatibility tests for versioned persisted data;
- connector contract fixtures and process lifecycle integration tests;
- PTY load, cancellation, resize, and backpressure tests;
- disposable-repository Git/worktree/review integration tests;
- browser automation and accessibility checks;
- native window and crash-recovery E2E tests;
- install, update, rollback, and uninstall tests on every supported platform;
- performance budgets for startup, memory, and sustained event throughput.
