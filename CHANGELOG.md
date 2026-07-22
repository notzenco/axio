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

### Changed

- Consolidated the desktop into one product rather than a separate switcher and
  agent workspace.
- Removed the redundant icon rail; workspace and context sidebars now collapse
  independently and return their space to the task canvas.

### Known limitations

- Workspace data is deterministic, process-local demo state.
- Agent execution, PTY terminals, Git worktrees/diffs, persistence, installers,
  signing, and updates are not implemented.
- The Linux Tauri dependency graph carries the documented moderate `glib`
  advisory pending a compatible upstream dependency route.
