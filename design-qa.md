# Axio titlebar controls design QA

## Evidence

- Source visual truth: `docs/design/axio-titlebar-source-1440x900.png`
- Implementation screenshot: `docs/design/axio-titlebar-fixed-1440x900.png`
- Full-view comparison: `docs/design/axio-titlebar-full-comparison.png`
- Focused titlebar comparison: `docs/design/axio-titlebar-focused-comparison.png`
- Viewport and state: dark desktop workspace at 1440 x 900 CSS pixels with both side panels open
- Source pixels: 1829 x 1200; the 1441 x 901 Axio window was cropped and normalized to 1440 x 900
- Implementation pixels: 1440 x 900 at device scale factor 1

## Findings

No actionable P0, P1, or P2 differences remain for the requested titlebar fix.

- The minimize, maximize, and close controls now occupy the final titlebar grid
  track instead of leaving an empty fixed-width track on their right.
- At 1440 pixels, the controls end at x=1439 against the app shell's one-pixel
  border. The measured trailing gap is exactly 1px.
- The same 1px trailing border is preserved at 1180, 960, 720, and 480 pixel
  viewports, with document width equal to viewport width at every breakpoint.

## Fidelity surfaces

- Typography: unchanged; the existing Inter/system stack, weights, line heights,
  truncation, and title hierarchy match the source.
- Spacing and layout rhythm: the unintended trailing grid track is removed;
  all other titlebar tracks, gaps, control widths, and shell spacing are unchanged.
- Colors and tokens: unchanged; existing glass, line, muted, hover, and close
  states remain intact.
- Image and icon quality: unchanged; the supplied Segoe Fluent Icons remain the
  native-looking window-control glyphs and no image assets were introduced.
- Copy and content: unchanged.

## Focused comparison

The combined titlebar evidence shows the source Close control stopping roughly
one control group short of the right edge. In the fixed capture, Close reaches
the shell border. A focused comparison was necessary because the defect occupies
only the top-right portion of the full 1440 x 900 frame.

## Interaction verification

- The Minimize control resolves to one enabled button and triggers the existing
  native-window-control path in the browser fallback.
- `cargo test -p axio-desktop --locked` passes, covering compilation of the
  Tauri command path used by minimize, maximize, and close.
- Browser console: no errors or warnings.

## Comparison history

1. P1 before: the wide titlebar declared seven columns for six children, so the
   controls occupied column six and left an empty 138px column at the right.
2. Fix: removed the redundant `auto` column from the wide titlebar grid while
   preserving the fixed 138px window-controls track.
3. Post-fix: full-view and focused comparisons show the controls against the
   right border, and pixel measurements confirm the result across all responsive
   breakpoints.

final result: passed
