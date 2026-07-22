# UI improvement plan

Status: accepted design direction for future implementation.

This document preserves the next Axio interface refinement pass so work can
continue consistently on another computer. It is a design specification, not a
claim that these changes are implemented.

## Evidence and limits

The recommendations are grounded in the Axio task-workspace screenshots and
responsive states reviewed during the 2026-07-22 desktop design work. A fresh
capture attempt for this final critique could not be accepted: the in-app
browser was unavailable to the audit connection, the targetable native window
was the legacy Axio build rather than the fresh `0.0.1` workspace, and Windows
browser capture stopped when it could not establish the current URL safely.

Before implementation, capture the current fresh UI again at the viewports in
[`testing.md`](testing.md) and use those images as the new visual baseline.

## Desired result

Axio should feel like one calm, living workspace rather than a set of dark
panels. A user should understand, in this order:

1. what needs attention;
2. what the selected task is doing;
3. which agent produced each event;
4. where the next direction will go;
5. where supporting diff, output, and plan context can be opened.

The refinement must preserve the accepted one-app, task-first architecture,
the collapsible workspace/context panels, local-first posture, and restrained
glass visual language.

## Priority outcomes

### 1. Flatten the task timeline

**Problem:** Giving every event a full container makes routine messages and
status updates compete with approvals, failures, and changes.

**Direction:** Introduce three event levels:

- **Narrative row:** message, status, handoff, and minor tool result.
- **Evidence block:** command output, file-change summary, or structured tool
  result that benefits from a bounded surface.
- **Attention card:** approval, question, failure, conflict, or security gate.

Ordinary rows share the timeline background and use spacing, typography, and
the agent thread for structure. Evidence blocks are compact and expandable.
Only attention cards receive strong borders, elevation, and action buttons.

**Acceptance:** A desktop task containing ten mixed events has no more than
three visually dominant cards; the approval or failure can be found in under
two seconds without reading every event.

### 2. Make attention state unmistakable

**Problem:** Small coloured dots do not communicate urgency or the action a
user must take.

**Direction:** Derive a task-level attention state from waiting questions,
approval gates, failures, conflicts, and unread events. Reflect it in the task
header, sidebar row, timeline marker, window/task title, and optional OS
notification when that capability exists.

Use a label and icon with colour. Suggested language:

- `Working`
- `Waiting for you`
- `Review required`
- `Failed`
- `Complete`

**Acceptance:** State remains understandable in greyscale and to a screen
reader. Selecting an attention state moves focus to the exact event that needs
action.

### 3. Make the composer explicit

**Problem:** `All agents` hides destination, context, execution mode, and
authority behind one compact control.

**Direction:** Add a lightweight context strip above the prompt with removable
chips for:

- target agents;
- task/worktree;
- attached files, past events, or selected diff;
- interaction mode such as Ask, Direct, or Plan;
- permission level when real connectors exist.

Keep the text field visually primary. The send action must describe its effect
when the destination is unusual, such as `Direct 2 agents`.

**Acceptance:** Before sending, a user can answer who receives the direction,
what context is attached, and whether the action can mutate the workspace.

### 4. Treat accessibility as a visual-system requirement

**Problem:** Muted metadata, small controls, colour-coded state, motion, and
glass transparency can undermine otherwise polished interaction.

**Direction:**

- Maintain strong text contrast at every glass intensity.
- Use visible keyboard focus that is not confused with selection.
- Make important targets at least 40 by 40 CSS pixels, aiming for 44 by 44.
- Provide icons and text for every lifecycle/review state.
- Preserve logical reading order when sidebars become overlays.
- Announce added events, task-state changes, and errors without stealing focus.
- Respect system reduced motion and the Axio override.

**Acceptance:** All core task actions are keyboard reachable, visible at 200%
zoom, understandable without colour, and labelled in the accessibility tree.

### 5. Make the context inspector a peek, expand, or pin surface

**Problem:** The inspector is useful but a permanently large right column can
make the task feel divided.

**Direction:** Opening Diff, Output, or Plan first reveals a compact contextual
peek. The user can expand it for sustained work or pin it to preserve width.
On narrow windows it remains a dismissible overlay with focus containment.

The inspector remembers its last panel and width per workspace, not per event.

**Acceptance:** Opening context never changes task selection or scroll
position. The task remains readable at every supported width, and Escape closes
an unpinned overlay predictably.

### 6. Establish an Axio-specific agent thread

**Problem:** Violet glass alone is attractive but not enough to make Axio
recognisable among AI development tools.

**Direction:** Use a restrained luminous thread through the timeline. Each
agent has a stable accessible identity colour; threads merge at handoffs,
reviews, and multi-agent outcomes. The thread communicates provenance and
sequence rather than decorating empty space.

It must simplify to a neutral line in reduced-motion/high-contrast contexts and
must not be the only agent identifier.

**Acceptance:** A user can visually trace which agent produced a sequence and
where ownership changed without opening event details.

### 7. Use glass selectively

**Problem:** Applying translucency uniformly reduces hierarchy and makes the
workspace feel busier.

**Direction:** Reserve glass for the application frame, titlebar, navigation,
composer, contextual overlays, and transient dialogs. Give the timeline a
calmer, more opaque reading surface. Use luminous colour only for active or
attention-bearing states.

**Acceptance:** The task narrative remains readable over a busy desktop at the
minimum and maximum glass settings. At least one major surface is intentionally
quiet and non-glass.

### 8. Add a useful task-overview state

**Problem:** No task selected, first launch, and returning to the workspace need
more than an empty canvas.

**Direction:** Show a concise workspace brief:

- items waiting for the user;
- active agents and current task;
- recent completions;
- failed or stale sessions;
- repository/worktree health;
- one primary `New task` action.

Do not turn this into a metrics dashboard. It is an attention and re-entry
surface.

**Acceptance:** A returning user can choose the correct next task without
opening every project or agent.

### 9. Define purposeful motion

**Problem:** Animation can create polish, but ambient movement without meaning
adds noise and consumes attention.

**Direction:** Use motion to explain state change:

- panel open/close: approximately 160–220 ms with a soft ease-out;
- event insertion: short fade/translate that preserves reading position;
- handoff: one brief pulse travelling along the agent thread;
- active work: restrained local indicator, never a full-screen glow;
- approval/failure: no looping animation after it has been noticed.

Reduced-motion mode uses instant layout changes and opacity-only feedback where
needed.

**Acceptance:** Every animation can be described as communicating location,
ownership, progress, or consequence. Continuous decorative motion is absent.

### 10. Make density modes materially different

**Problem:** Reducing padding alone does not create a useful control-room mode.

**Direction:**

- **Comfortable:** richer summaries, more whitespace, expanded evidence, and
  larger action labels.
- **Compact:** single-line narrative rows, collapsed evidence, abbreviated
  metadata, and higher project/task visibility.

Both modes keep the same information architecture and keyboard order.

**Acceptance:** Compact mode shows substantially more events and tasks without
reducing important target sizes or hiding attention state.

## Visual hierarchy rules

- One primary title per view.
- One dominant action per attention card.
- Metadata is quieter than narrative text but remains readable.
- Borders separate interactive or semantic regions, not every container.
- Shadows indicate elevation or temporary overlay, not ordinary grouping.
- Agent colours identify provenance; semantic colours identify lifecycle and
  risk. Do not overload one palette for both meanings.
- The composer and current attention event may be visually stronger than the
  rest of the timeline; routine history should recede.

## Responsive behavior

- Wide: workspace sidebar, readable task column, optional pinned inspector.
- Medium: narrower workspace sidebar and peek inspector; task remains primary.
- Compact: both sidebars overlay; titlebar keeps workspace/context toggles.
- Narrow: hide nonessential metadata before truncating task titles or actions.
- All widths: no horizontal document overflow; dialogs and menus remain inside
  the visible window; focus returns to the invoking control after dismissal.

## Suggested implementation passes

These are dependency-aware passes, not release promises:

1. **Hierarchy pass:** event levels, attention model, composer context strip,
   contrast, targets, and focus states.
2. **Identity pass:** agent thread, selective glass, inspector peek/expand/pin,
   and meaningful overview state.
3. **Polish pass:** motion tokens, genuinely different density modes, empty,
   loading, failure, and recovery states.

Avoid polishing simulated data so deeply that it delays the real repository,
connector, terminal, and Git outcomes in [`product-plan.md`](product-plan.md).
The UI pass should establish primitives that can receive truthful live events.

## Verification

For each pass:

- capture the same state at 1440 x 900, 839 x 912, and 390 x 780;
- test comfortable/compact, reduced motion, maximum/minimum glass, focus mode,
  both sidebars closed, inspector overlay, approval, failure, and empty state;
- verify keyboard order, visible focus, accessibility names, target sizes, and
  no colour-only meaning;
- compare before/after images at matched viewport and state;
- run the automated and native checks in [`testing.md`](testing.md);
- update [`status-and-direction.md`](status-and-direction.md) and
  [`../CHANGELOG.md`](../CHANGELOG.md) only when behavior is implemented.

## Completion criteria

This design direction is complete when the interface is calmer with ordinary
history, louder only when the user must act, explicit about destination and
authority, visually recognisable as Axio, and fully usable with keyboard,
reduced motion, compact windows, and non-colour state cues.
