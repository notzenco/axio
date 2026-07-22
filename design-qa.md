# Axio collapsed-navigation design QA

## Evidence

- Source visual truth: `docs/design/axio-collapsed-navigation-before.png`
- Implementation screenshot: `docs/design/axio-collapsed-navigation-fixed-wide.png`
- Combined comparison: `docs/design/qa-comparison.html`
- State: left workspace sidebar closed, right context sidebar closed
- Viewport: 1440 x 900 CSS pixels
- Source pixels: 1440 x 900
- Implementation pixels: 1440 x 900
- Density normalization: 1:1 pixel and viewport comparison; no scaling

## Findings

No actionable P0, P1, or P2 differences remain for the requested navigation
change.

- The redundant five-button navigation rail is removed.
- Workspace navigation is controlled by the existing titlebar menu button.
- Diff, output, and plan share one context-sidebar toggle and remain available
  as tabs after the sidebar opens.
- The simultaneous closed state resolves to `0px 1398px 0px` at the desktop
  comparison viewport, so the task canvas reclaims the former sidebar tracks.
- At 839 x 912 the same state resolves to `0px 811px`, with the task canvas
  beginning at 19px rather than retaining the old sidebar column.
- At 390 x 780 both titlebar toggles remain available and document width stays
  at 390px with no horizontal overflow.

## Fidelity surfaces

- Typography: unchanged from the approved glass shell; hierarchy and wrapping
  remain stable after the navigation removal.
- Spacing and layout rhythm: the dead left column is removed while the timeline
  retains its centered reading width and the composer remains aligned beneath
  it.
- Colors and tokens: existing glass, violet active-state, cyan, amber, and
  semantic review tokens are unchanged.
- Image and icon quality: Segoe Fluent Icons are used for both titlebar panel
  controls; no placeholder or handcrafted icon was introduced.
- Copy and content: the task narrative and context labels are unchanged.

## Focused comparison

The titlebar and left edge were inspected at full resolution because they are
the only changed regions. The post-fix evidence shows two independent pressed
states and no persistent rail or reserved sidebar width.

## Interaction verification

- Workspace toggle opens and closes the left sidebar.
- Context toggle opens and closes the right sidebar and restores the last
  selected Diff, Output, or Plan tab.
- Review and terminal-context actions still open their corresponding context
  tab.
- Browser console: no errors or warnings.

## Comparison history

1. P1 before: closing the workspace left the sidebar track reserved when the
   inspector was also closed. Fix: added an explicit combined grid state and
   then simplified the shell to three independent tracks.
2. P2 before: the navigation rail duplicated workspace, review, output, plan,
   and appearance controls. Fix: removed the rail and consolidated right-side
   tools behind one titlebar context toggle.
3. Post-fix: the matched 1440 x 900 side-by-side comparison shows the task
   canvas occupying the full available frame with both sidebars closed.

final result: passed
