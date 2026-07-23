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
the React and TypeScript surface renders the workspace state.
Extra windows are projections of that state, not independently persisted apps.
This keeps process ownership, approvals, worktree locks, and recovery behavior
consistent while allowing a compact focused-task window when useful.

Frontend entry files are composition surfaces, not feature containers. Vite
loads `ui/index.html` and `ui/src/main.tsx`; `ui/src/App.tsx` owns application
state and cross-feature wiring. Semantic views belong in `ui/src/components/`,
reusable stateful behavior in `ui/src/hooks/`, native calls in
`ui/src/services/`, preview fixtures in `ui/src/data/`, and component styling in
`ui/styles/`. Components receive state and side effects through typed props
rather than importing mutable application state.

User preferences follow that boundary: `useSettings.ts` owns the versioned,
typed persistence model and document-level presentation effects, while
category components under `ui/src/components/settings/` own their controls and
search vocabulary. Workspace and composer components receive only the
preference slice they need.

Rust follows the same ownership rule at crate scale. A crate root declares
modules and re-exports its intended public API. Domain operations, errors,
lifecycle policy, deterministic fixtures, and tests stay in named modules.
Introduce another crate only for a real subsystem or dependency boundary; do not
use crates or tiny files as line-count sharding.

The current desktop composition is:

```text
native titlebar
  workspace panel | task timeline | context tool dock
bottom status bar
```

The workspace panel and context tool dock collapse and resize independently on
wide windows. Their persisted widths are bounded so the task timeline retains
its minimum usable width; collapsing either returns its space to the timeline.
At 720px and below they become mutually exclusive, focus-contained overlays.

The right dock is a host for task-scoped tools rather than a review-specific
inspector. A centered workspace toolbar makes browser, file explorer, review,
command output, plan, and focus controls visible even while the dock is closed;
the dock repeats tool navigation in a centered top row for overlay use. Each
tool is a separate component with state preserved while switching tools.
Native webview and filesystem services remain future integrations behind those
surfaces.

See [`protocol.md`](protocol.md) for the current state vocabulary and command
boundary, [`security-model.md`](security-model.md) for trust boundaries, and
[`status-and-direction.md`](status-and-direction.md) for what remains simulated.
