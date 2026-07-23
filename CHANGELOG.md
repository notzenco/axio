# Changelog

All notable user-visible changes to the fresh Axio product are recorded here.
The previous-generation release history belongs to the archived legacy
repositories and is not continued by this project.

## Unreleased

### Added

- Native Tauri desktop shell with custom window dragging and controls.
- Shared Rust protocol and core workspace state used by the CLI and desktop.
- Task creation, selection, chronological activity, direction, agent lifecycle,
  and review-decision interactions over in-memory state.
- Responsive task-first glass interface with focus mode, command palette,
  appearance settings, bottom status bar, and contextual inspector.
- Complete product, architecture, status, plan, development, testing, security,
  release, troubleshooting, setup, decision, and reference documentation.
- Prioritized UI improvement specification covering event hierarchy, attention,
  composer context, agent identity, glass, inspector behavior, overview, motion,
  density, responsive behavior, and accessibility.
- Screenshot-backed desktop UI audit, implementation contract, responsive
  evidence, and final design QA record.
- Native repository folder selection, recoverable recent workspaces, and a
  useful closed-workspace state.
- Schema-v2 per-repository persistence for tasks, agents, activity, selection,
  and review state, including schema-v1 migration and corruption fallback.
- PTY-backed Terminal work mode with bounded multi-pane Codex, Claude Code,
  OpenCode, and shell sessions, streamed output, keyboard input, resize,
  process exit state, and explicit stop/close controls.

### Changed

- Consolidated the desktop into one product rather than a separate switcher and
  agent workspace.
- Removed the redundant icon rail; workspace and context sidebars now collapse
  independently and return their space to the task canvas.
- Reworked task attention and review so status is explicit and Return/Approve
  decisions exist only in the inspector.
- Added inline task-creation errors, explicit composer routing context,
  changed-file navigation, expanded review mode, process-result metadata,
  read-only plan states, and command-palette recovery.
- Made compact panels mutually exclusive and scrim-backed, with contained
  keyboard focus, Escape dismissal, focus restoration, and consistent focus
  mode semantics.
- Batched PTY output and burst input, removed terminal I/O from the global
  session lock, and stopped redundant PTY resizes that slowed interactive
  coding-agent terminals.
- Raised muted-text contrast, reduced routine timeline chrome, added non-colour
  task/agent states, and aligned native window controls to the right edge.

### Known limitations

- Persisted workspace content is deterministic demo state until a real agent
  connector is implemented.
- Structured agent connectors, Git worktrees/complete diffs, installers,
  signing, and updates are not implemented.
- The Linux Tauri dependency graph carries the documented moderate `glib`
  advisory pending a compatible upstream dependency route.
