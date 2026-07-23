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
- Release executable: `.build/target/release/axio.exe`, 8,577,536 bytes.

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
  the Fluent visual treatment is retained with packaged SVG components.
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
dock, and complete Review and Browser surfaces at 1x density. The
threshold-adjacent capture verifies the context dock as an overlay at 840 x 904
without document or workspace horizontal overflow.

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

## Centered context navigation QA — 2026-07-23

Evidence:

- `docs/design/context-toolbar-2026-07-23/toolbar-dock-closed-1280x720.png`
- `docs/design/context-toolbar-2026-07-23/toolbar-review-open-1280x720.png`
- `docs/design/context-toolbar-2026-07-23/workspace-settings-1280x720.png`

The first capture verifies the centered, always-visible task toolbar with
Focus, Browser, Files, Review, Output, and Plan. The second verifies the
matching centered navigation inside the open dock and the Review attention
badge without duplicating the old titlebar actions.

Interaction verification:

- Exactly one Focus control is exposed. Entering and leaving focus restores
  the surrounding workspace, while selecting a tool from focus exits focus and
  opens that tool.
- Selecting the active tool closes the dock; selecting another tool updates
  both launcher and dock selection.
- Review, Files, Browser, Output, and Plan each expose one corresponding panel.
- At constrained task widths the launcher becomes a centered 223px icon-only
  toolbar with accessible names and no overflow.
- Settings, command palette, task timeline, status bar, dialogs, sidebar,
  composer, dock, and tool surfaces now use packaged Fluent SVG components
  rather than font codepoints.
- Workspace settings can switch the launcher between labelled and icon-only
  modes, hide the visual Review count without losing its accessible status, and
  choose the default context tool; all three persist and reset to documented
  defaults.
- Browser console warnings/errors: none.

final result: passed

## Native repository file preview — 2026-07-23

The release executable was rebuilt and inspected through native Windows UI
automation.

- Files presented 169 real repository paths and the safe-preview instruction.
- Selecting `AGENTS.md` invoked the Rust file-read boundary and rendered the
  actual 2,213-byte document with monospaced, scrollable source content.
- The preview remained bounded inside the resizable context dock without
  creating document-level overflow or displacing the composer.
- The core rejects absolute and parent-component paths, resolves canonical
  targets inside the repository root, identifies binary content, and limits
  text reads to 256 KiB.
- The native workspace reported nine current working-tree changes after the
  preceding checkpoint, matching the independently inspected Git state.

**Findings**

- No actionable P0/P1/P2 layout or interaction issue was found in the native
  file-preview flow.

final result: passed

## Native live-repository slice — 2026-07-23

The release executable was launched from the active Axio checkout and inspected
through native Windows UI automation rather than the browser fallback.

Verified native data:

- Project `axio`, branch `main`, 169 tracked/untracked repository paths, and 47
  working-tree changes matched the independently queried CLI JSON snapshot.
- The status bar exposed `47 working tree changes` and opened Review.
- Files displayed the real repository hierarchy beginning with `.cargo`,
  `.github`, `AGENTS.md`, `apps`, and their descendants.
- Files identified its source as the active Git repository and provided a
  refresh action.
- Review displayed 47 real changed paths, including `AGENTS.md` and the active
  Rust and TypeScript files, with Git line totals where available.
- Review labelled every unexecuted check `Not run` and disabled command
  execution instead of reporting simulated passing checks as live results.
- The refresh controls completed without an application error.

The task narrative and agent workstreams remain deterministic demo state. The
live repository surfaces are visually and textually distinguished from that
simulation.

**Findings**

- No actionable P0/P1/P2 layout or interaction issue was found in the native
  Files and Review flow.
- Complete file contents, filesystem watching, unified diffs, and command
  execution remain intentionally out of scope for this slice.

final result: passed

## Canvas workspace implementation QA — 2026-07-23

Source visual truth:
`docs/design/canvas-workspace-2026-07-23/approved-canvas-direction.png`.

Rendered implementation:
`docs/design/canvas-workspace-2026-07-23/implemented-canvas-review-1440x1024.png`.

Normalized comparison:
`docs/design/canvas-workspace-2026-07-23/approved-vs-implemented-1440x1024.png`.

- Viewport and CSS size: 1440 x 1024 at 1x density.
- Source pixels: 1487 x 1058, proportionally fitted and padded to 1440 x
  1024 for comparison.
- Captured implementation pixels: 1440 x 1024.
- State: Canvas selected, workspace sidebar open, Review gate open in the
  390px resizable context dock.
- Full-view evidence: the comparison places the normalized approved direction
  and browser-rendered implementation side by side.
- Focused regions were unnecessary for the captured pass because navigation,
  workstreams, phase path, review dock, and activity hierarchy remain readable
  at the native comparison size.

Startup regression evidence:
`docs/design/canvas-workspace-2026-07-23/composer-startup-1280x720.png`.

Interaction verification:

- Activity and Canvas switch between distinct work modes.
- Browser, Files, Terminal, and Plan each open their corresponding right-dock
  surface and expose the correct pressed state.
- The contextual review notice opens Review without expanding the dock.
- The tool-call record collapses and reopens without losing its content.
- The context dock restores from 640px to its 390px default.
- On a clean 1280 x 720 launch, the composer is visible at y=570–673 before
  either sidebar is touched.
- The composer remains visible with both sidebars open, either sidebar closed,
  both sidebars closed, after reopening them, and after keyboard-resizing the
  context dock.
- At 1440 x 1024, the composer is visible at y=874–977 and the document has
  zero horizontal overflow.
- Browser console warnings/errors were empty.
- The page had no document-level horizontal overflow.

Required fidelity surfaces:

- Fonts and typography: the existing Inter/Segoe UI stack, weights, compact UI
  scale, hierarchy, truncation, and monospaced command/file content match the
  approved direction closely.
- Spacing and layout rhythm: the narrow workspace rail, centered mode/tool
  navigation, workflow path, parallel workstreams, persistent composer, and
  resizable review dock are present at the intended proportions.
- Colors and visual tokens: the calm navy/charcoal system with restrained
  violet, cyan, amber, and green status accents is retained without excessive
  glow.
- Image quality and asset fidelity: the screen contains no raster product
  imagery. All visible UI icons use the packaged Fluent icon library.
- Copy and content: Activity/Canvas are work modes; Browser, Files, Terminal,
  and Plan are tools; Review is contextual and terminal output remains inside
  Terminal.

Comparison history:

- Initial captured pass found a P2 density mismatch in Recent activity: large
  event cards displaced the compact durable-record pattern in the approved
  direction.
- The implementation was revised to a compact review record with an expanded
  collapsible tool-call summary and concise verified activity rows.
- A startup P1 was then reproduced at 1280 x 720: the workspace grid row was
  647px tall while its three grid children expanded to 811px from their
  intrinsic content, placing the composer below the viewport until a sidebar
  change forced a layout recalculation.
- The workspace now declares a bounded `minmax(0, 1fr)` grid row and each
  direct panel child explicitly accepts the available height. Post-fix
  measurements keep all three children at 627px and the composer visible
  before any interaction.
- TypeScript, Vite, Rust lint/tests, formatting, and the integrated Tauri
  release build pass after the fix.

**Findings**

- No actionable P0/P1/P2 differences remain in the captured Canvas/Review
  state. The implementation intentionally uses slightly quieter surface
  borders than the generated reference; this is acceptable within the
  existing Axio token system.

**Implementation Checklist**

- Keep the explicit bounded grid row when adding new persistent workspace
  panels.
- Retain startup composer visibility in future responsive regression checks.

final result: passed

## Activity message-order regression — 2026-07-23

Reported visual:
`docs/design/canvas-workspace-2026-07-23/message-order-reported-1920x1032.png`.

The supplied Activity capture shows newly sent messages above the existing
history. Browser reproduction confirmed the incorrect visible sequence:
`second chronological check`, `first chronological check`, then the older
review and agent activity.

Root cause:

- The Rust workspace and browser fallback both append direction events to the
  chronological activity array.
- `Timeline` reversed that array before rendering, while the send path scrolled
  to the final rendered element. Those two behaviors disagreed.

Fix and regression coverage:

- Activity now renders the append-order task events directly, so the newest
  event is the final timeline child.
- `activityForTask` owns task filtering without reordering.
- `ui/tests/activity-order.test.ts` proves `first`, `second`, `newest` remains
  in that order.
- `bun run --cwd apps/axio-desktop test:ui`: 1 passed.
- TypeScript, Vite, and the integrated Tauri release build pass.

Post-fix browser verification now confirms the rendered timeline preserves
append order. The initial tool, change, and approval records remain first;
the first sent direction follows them; and each newer direction renders after
the preceding one at the bottom of the activity.

**Findings**

- No actionable message-order issue remains.

final result: passed

## Canvas direction destination feedback — 2026-07-23

Rendered evidence:
`docs/design/canvas-workspace-2026-07-23/canvas-direction-destination.png`.

The Canvas composer was exercised at 1600 x 900 with both the all-agent and
individual-agent targets.

- The transient confirmation names the selected audience and task, for
  example `Sent to Claude Code · Unify the Axio desktop`.
- Canvas Recent activity immediately retains the two latest user directions
  with `You → destination`, the message text, and a sent state.
- Selecting a durable direction row opens the complete Activity record.
- Activity renders the same messages at the bottom in chronological order and
  retains `Direction sent to All agents` or the selected agent.
- The selected audience is passed through the TypeScript service, Tauri
  command, and Rust workspace record rather than being replaced by a fixed
  all-agent label.
- Browser console errors and warnings were empty.

**Findings**

- No actionable P0/P1/P2 differences remain in the destination-feedback flow.

final result: passed
