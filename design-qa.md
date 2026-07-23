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
| Settings | Search filters across four categories, announces a no-results state, and live changes to accent, contrast, status bar, and composer submission persist across reload; Reset all restores defaults. |

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

- `node scripts/check-ui.mjs`: passed TypeScript strict checking.
- `bun run --cwd apps/axio-desktop build:vite`: passed; 49 modules transformed.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --all-targets --locked -- -D warnings`: passed.
- `cargo test --workspace --locked`: passed; 5 tests passed.
- `cargo run -p axio-cli -- status --json`: passed.
- `bun run --cwd apps/axio-desktop build`: passed the integrated Vite and Tauri
  release build.
- Browser console warnings/errors: none.
- Release executable: `.build/target/release/axio.exe`, 8,569,856 bytes.

## Remaining design gates

This pass deliberately does not claim native screen-reader verification,
Windows high contrast, 200% zoom, real repository edge cases, connector
authentication, process streaming, conflict resolution, persistence, or
failure recovery. Those matched states remain required before their respective
runtime features are implemented.

## Settings regression QA — 2026-07-23

Source visual truth:
`docs/design/ui-settings-2026-07-23/reported-settings-ui-1440x900.png`.

Rendered implementation:
`docs/design/ui-settings-2026-07-23/post-fix-desktop-1280x720.png`.

Normalized comparison:
`docs/design/ui-settings-2026-07-23/reported-vs-post-fix.png`.

- State: Settings open on Appearance in the production Vite bundle.
- Source: 1440 x 900 pixels at 1440 x 900 CSS pixels and 1x density.
- Implementation: 1280 x 720 pixels at 1280 x 720 CSS pixels and 1x density.
- Normalization: both fixed-size 860 x 650 dialog regions were cropped without
  scaling and placed side by side.
- Full-view evidence: the normalized comparison covers the complete dialog.
  A separate detail crop was unnecessary because the affected search and
  slider text are readable at native size in the dialog comparison.

The reported P1 search-layout issue came from the generic modal label selector
overriding the search control's flex layout. The reported P1 slider-copy issue
came from the nested title/description span lacking a stacking rule. The
post-fix capture confirms that search icon, input, and clear action share one
centered row and that Glass intensity title and description no longer overlap.

All four categories were rendered and measured. Appearance, Workspace,
Composer, and Accessibility have zero title/description intersections; search
filtering, clear, and no-results states work; the dialog has no horizontal
overflow; and browser console warnings/errors are empty.

Required fidelity surfaces:

- Fonts and typography: existing Segoe/Inter hierarchy is unchanged; affected
  labels now retain distinct readable lines.
- Spacing and layout rhythm: search content is vertically centered and setting
  copy returns to the shared four-pixel label rhythm.
- Colors and visual tokens: no token drift; focus, accent, surfaces, and
  contrast remain unchanged.
- Image and asset fidelity: this settings surface contains no raster imagery;
  existing Fluent icon treatment is unchanged.
- Copy and content: all category, setting, help, search, and action copy is
  unchanged.

Verification after the fix:

- `node scripts/check-ui.mjs`: passed.
- `bun run --cwd apps/axio-desktop build:vite`: passed; 49 modules transformed.
- Browser interactions: category navigation, filtered search, clear, and empty
  search state passed.
- Browser console warnings/errors: none.

## Resizable context dock QA — 2026-07-23

Evidence:

- `docs/design/context-dock-2026-07-23/review-wide-1280x720.png`
- `docs/design/context-dock-2026-07-23/browser-wide-1280x720.png`
- `docs/design/context-dock-2026-07-23/files-overlay-840x904.png`

The wide captures verify the 236px workspace panel, task canvas, 390px context
dock, vertical tool rail, and complete Review and Browser surfaces at 1x
density. The threshold-adjacent capture verifies the context dock as an overlay
at 840 x 904 without document or workspace horizontal overflow.

Interaction verification:

- Browser, Files, Review, Output, and Plan each activate one visible tool panel.
- Browser address and Files filter state survive switching between tools.
- Pointer dragging resized the context dock from 414px to 468px and the
  workspace panel from 248px to 292px.
- Arrow-key resizing, double-click reset, width persistence after reload, and
  responsive maximum bounds passed.
- Maximum tested side widths retained the task minimum with no workspace
  overflow; closing the context dock returned its width to the task canvas.
- Browser console warnings/errors: none.

Typography, spacing, colors, Fluent icon treatment, and task-first hierarchy
remain consistent with the existing desktop system. Browser and file content
are explicitly representative UI boundaries; native webview and filesystem
integration are not claimed by this pass.

final result: passed
