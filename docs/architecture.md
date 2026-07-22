# Architecture

Axio begins with two stable boundaries and two consumers.

```text
axio-protocol
     |
 axio-core
   /     \
CLI     Tauri desktop
```

`axio-protocol` owns vocabulary that can cross process or persistence
boundaries. `axio-core` owns orchestration state and invariants. The CLI and
desktop must remain thin consumers of the same behavior.

Future terminal, process, Git, worktree, persistence, and connector crates
should be introduced only when their ownership is clear. Internal crates are
not automatically public APIs and should remain unpublished unless a concrete
external use case exists.

Hosted services are a separate optional system. The local application must
remain useful without them.

The desktop has one application identity and one shared workspace state. The
Tauri shell owns native window behavior and exposes a narrow command boundary;
the code-native HTML, CSS, and JavaScript surface renders the workspace state.
Extra windows are projections of that state, not independently persisted apps.
This keeps process ownership, approvals, worktree locks, and recovery behavior
consistent while allowing a compact focused-task window when useful.

The current desktop composition is:

```text
native titlebar
  workspace sidebar | task timeline | context inspector
bottom status bar
```

The workspace sidebar and context inspector collapse independently. Collapsing
either must return its space to the task timeline; at narrow widths they become
overlays so the primary task remains usable. Diff, output, and plan are panels
inside the one context inspector rather than separate navigation destinations.
