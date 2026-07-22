# Desktop design

Axio is one adaptive desktop workspace for running, steering, and reviewing
coding agents. The old idea of a separate switcher is absorbed into task
switching, the command palette, and focus mode.

## Information architecture

- **Portfolio zoom:** projects, tasks, worktrees, agent health, and usage.
- **Task zoom:** one chronological narrative containing every agent event,
  question, approval, command, and file change.
- **Focus zoom:** the same task canvas with navigation and the inspector hidden.
- **Context inspector:** diff, output, files, terminal, and plan for the currently
  selected event.

The central timeline is the source of narrative truth. Agent cards are useful
for portfolio monitoring, but they do not become separate chat silos inside a
task. Approval requests appear inline at the point that produced them.

## Interaction contract

- `Ctrl+K` switches tasks and runs workspace commands.
- `Ctrl+Shift+F` toggles focus mode.
- Drag any non-interactive titlebar area to move the window; hold `Alt` to drag
  from any non-interactive surface.
- The titlebar workspace and context buttons independently reveal their side
  panels. Closing a panel returns its width to the task canvas.
- Agent presence chips expose lifecycle state and the immediate pause/resume
  action.
- Review actions open the contextual inspector rather than navigating away.
- The composer targets all task agents by default and makes narrower targeting
  explicit.

## Visual direction

The task-first concept is the default desktop direction:

![Task-first Axio concept](design/axio-task-focus.png)

The denser control-room concept informs portfolio zoom:

![Axio control-room concept](design/axio-control-room.png)

Both concepts were generated from the same product constraints. They are
directional references; production UI remains code-native and accessible.

## Implemented visual system

The production shell uses restrained glass rather than stacking opaque cards:
translucent surfaces, fine borders, soft violet and cyan ambient light, and
motion that communicates state changes. The central timeline stays visually
quiet so approvals, failures, and review actions carry the emphasis.

The redundant left icon rail has been removed. Workspace navigation lives in
one collapsible sidebar, while Diff, Output, and Plan share one contextual
right sidebar opened from the titlebar. Both become overlays on compact
windows. Animation respects `prefers-reduced-motion`, controls retain visible
focus states, and glass surfaces keep an opaque-enough fallback for readability.

Implementation screenshots and the responsive comparison record live in
[`design/`](design/), with the latest verification summarized in
[`../design-qa.md`](../design-qa.md).

Controls that currently mutate demo state rather than real agent, terminal, or
Git resources are identified in
[`status-and-direction.md`](status-and-direction.md).

The accepted next refinement—flattened event hierarchy, attention states,
explicit composer context, agent-thread identity, selective glass, inspector
peek/pin behavior, motion, density, and accessibility—is specified in
[`ui-improvement-plan.md`](ui-improvement-plan.md).
