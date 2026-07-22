# Axio desktop audited UI pass — design QA

Date: 2026-07-22

Branch: `fix/desktop-ui-audit`

Contract: `docs/ui-audit-implementation.md`

## Result

Passed for the scoped local UI prototype. The seven P1 interaction findings
and the applicable P2 hierarchy/semantics findings from the audit now have a
coherent implementation. Backend-authenticated, persistent, real Git, PTY, and
failure/recovery states remain explicitly outside this pass.

## Visual evidence

- Baseline desktop: `docs/design/ui-audit-2026-07-22/after-desktop-1440x900.png`
- Expanded review: `docs/design/ui-audit-2026-07-22/after-review-expanded-1440x900.png`
- Compact review: `docs/design/ui-audit-2026-07-22/after-compact-review-720x900.png`
- Narrow stress test: `docs/design/ui-audit-2026-07-22/after-narrow-360x800.png`
- Inline task validation: `docs/design/ui-audit-2026-07-22/after-new-task-validation-360x800.png`
- Original titlebar comparison: `docs/design/axio-titlebar-focused-comparison.png`

## Interaction verification

| Flow | Result |
| --- | --- |
| Empty task submission | Dialog remains open; persistent error is visible; Outcome has `aria-invalid=true`; focus remains on Outcome. |
| Review ownership | Header and timeline open the Diff inspector; only the inspector exposes Return with feedback and Approve review. |
| Diff inspection | Three changed files are keyboard-reachable; active path and counts update; expanded inspector measures 640px at 1440px. |
| Compact panels | Opening the inspector closes the sidebar and vice versa; the scrim is present only while a panel is open. |
| Compact keyboard | Focus enters the panel, Tab/Shift+Tab loop inside it, Escape closes it, and focus returns to the invoking toggle. |
| Focus mode | Hidden panels report unpressed/open affordances; Exit focus mode restores the previous open sidebar and inspector. |
| Agent presence | Header presence opens the Agents panel without changing the agent's running state. |
| Palette recovery | `does-not-exist` yields zero visible options and announces `No matches`; New task is a direct command. |
| Output and plan | Output exposes completed/exit metadata and wrapping; plan exposes Done, In progress, and Queued states and states that it is read-only. |
| Settings | Both appearance booleans render as switches and retain native checked semantics. |

## Responsive and accessibility measurements

- At 1440x900, the composer is 800px wide and the window controls end at the
  shell's 1px border.
- At 720x900, the inspector owns the compact viewport without competing with
  the sidebar.
- At 360x800, document width remains 360px, the composer stays within x=16–344,
  and the window controls retain the 1px trailing shell border.
- The revised `--faint` token (`#8993a4`) measures 6.39:1 on `#080a0f`, 5.84:1
  on `#12161e`, and 5.32:1 on `#1a1f2a`.
- Focus and context controls retain explicit accessible names when their visual
  labels are hidden at medium and narrow breakpoints.
- Task state, agent state/action, review attention, plan progress, and process
  completion all pair colour with text.

## Repository verification

- `node --check apps/axio-desktop/ui/app.js`: passed.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --all-targets --locked -- -D warnings`: passed.
- `cargo test --workspace --locked`: passed; 5 tests passed.
- `cargo run -p axio-cli -- status --json`: passed.
- `cargo build --release -p axio-desktop --locked`: passed.
- Browser console warnings/errors: none.
- Release executable: `.build/target/release/axio.exe`, 8,497,152 bytes.

## Remaining design gates

This pass deliberately does not claim native screen-reader verification,
Windows high contrast, 200% zoom, real repository edge cases, connector
authentication, process streaming, conflict resolution, persistence, or
failure recovery. Those matched states remain required before their respective
runtime features are implemented.

final result: passed
