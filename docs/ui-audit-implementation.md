# Desktop UI audit implementation contract

Date: 2026-07-22  
Baseline: `cfbeafb` (`fix(desktop): align controls and record UI audit`)  
Source audit: [`ui-audit-2026-07-22.md`](ui-audit-2026-07-22.md)

Status: completed in `ad62db2` (`feat(desktop): resolve audited UI interactions`).

## Goal

Turn the audited desktop prototype into a clear, coherent interaction model before
connecting it to real agent, repository, and terminal behaviour. This pass changes
the interface and its local demo-state interactions only; it does not represent
prototype data as live system state.

## Changes in this pass

| Area | Change | Acceptance criteria |
| --- | --- | --- |
| New task | Validate the outcome inside the dialog and preserve the draft on error. | Empty submission keeps the dialog open, exposes an inline error, marks the field invalid, and returns focus to it. |
| Review flow | Establish one review entry point and one decision surface. | Task and timeline attention cues open the Diff inspector; Return and Approve appear only in the inspector. |
| Inspector | Add change-file navigation and compact/expanded modes. | The active file is named, all changed files are discoverable, and the expanded mode gives the diff materially more room. |
| Compact layout | Make the sidebar and inspector mutually exclusive overlays. | At 720px and below, opening one closes the other; the scrim and Escape close the active overlay. |
| Composer | Expose target, worktree, direction mode, and review policy before sending. | Routing and context are visible without opening a menu; the send action names its target. |
| Focus mode | Make entry, state, and exit consistent. | Focus mode has one unambiguous exit label, hidden panels are not reported as active, and the prior layout is restored on exit. |
| Agents | Separate navigation from lifecycle actions and explain context use. | Header agents open the Agents panel; only explicit Pause/Resume controls change demo state; context usage says what the percentage means. |
| Command palette | Add a useful no-results state and direct task creation. | A query with no matches announces an empty state; New task is available as a command. |
| Output and plan | Clarify that output is a completed command record and make plan state scannable. | Output shows command/status metadata and wrap control; plan rows expose explicit states. |
| Visual hierarchy | Reduce routine containers, reserve emphasis for evidence and attention, and improve muted contrast. | Routine history reads as a sequence, approval remains visually dominant, and supporting text meets a 4.5:1 contrast target on used surfaces. |
| Controls | Improve visible labels, switch styling, and accessible names at compact widths. | Icon-only controls retain meaningful accessible names and settings switches read as switches. |

## Files expected to change

- `apps/axio-desktop/ui/index.html`: document and asset manifest.
- `apps/axio-desktop/ui/src/App.tsx`: state and cross-feature wiring.
- `apps/axio-desktop/ui/src/components/`: interaction structure and semantic labels.
- `apps/axio-desktop/ui/src/hooks/`: reusable layout, appearance, and dialog behavior.
- `apps/axio-desktop/ui/src/services/`: typed Tauri command boundary.
- `apps/axio-desktop/ui/src/data/`: local preview fixtures.
- `apps/axio-desktop/ui/styles.css`: stylesheet manifest.
- `apps/axio-desktop/ui/styles/`: feature and component states.
- `design-qa.md` and `docs/design/`: post-change visual evidence.
- This document and the source audit if implementation evidence changes a
  finding or leaves a documented follow-up.

## Explicit non-goals

- Real agent lifecycle control, worktree mutations, Git staging, or commits.
- A terminal emulator or command execution contract.
- Authentication, persistence, recovery, conflict-resolution, and backend
  failure flows. These remain required product states and are tracked in the
  source audit.
- New runtime or native dependencies.
- Changing the Rust/Tauri boundary unless the existing UI integration requires
  a compatibility fix.

## Verification

The pass is complete when:

1. The primary task, review, composer, settings, command-palette, agent, and
   focus interactions are exercised at 1440x900.
2. The same flows are checked at 960x720, 720x900, and 360x800, including
   keyboard dismissal and focus recovery.
3. New-task validation and no-result palette behaviour are verified directly.
4. `node scripts/check-ui.mjs` passes.
5. `cargo fmt --all -- --check`, workspace Clippy, and workspace tests pass.
6. `cargo build --release -p axio-desktop --locked` succeeds.
7. Updated screenshots and a concise result are recorded in `design-qa.md`.
