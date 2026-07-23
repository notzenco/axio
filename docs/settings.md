# Desktop settings

Axio's desktop settings are searchable, apply immediately unless noted below,
and persist locally in the desktop webview. Open Settings from the titlebar.
Reset all restores every category to the defaults in this document.

## Appearance

| Setting | Default | Behavior |
|---|---:|---|
| Accent colour | Violet | Changes focus, selection, and primary-action accents. Cyan and amber are also available. |
| Glass intensity | 72% | Adjusts panel opacity and background depth from 30% to 100%. |
| Compact timeline | Off | Reduces task-activity spacing so more events fit on screen. |

## Workspace

| Setting | Default | Behavior |
|---|---:|---|
| Open workspace sidebar | On | Opens Tasks and Worktrees when Axio starts on a wide viewport. |
| Open context dock | On | Opens the context dock when Axio starts on a wide viewport. |
| Default context tool | Review when required | Selects Browser, Files, Terminal, Plan, or the contextual Review surface as the initial dock content. Changing it also updates the current dock selection without forcing the dock open. |
| Open pending reviews automatically | On | Opens and expands Review when the selected task requires attention. |
| Show toolbar labels | On | Shows text beside the Activity/Canvas/Terminal modes and Browser, Files, Terminal, and Plan tools when space permits. Turning it off keeps accessible names and hover titles. |
| Show contextual review notice | On | Shows the changed-file notice beside the workspace navigation when a review gate needs attention. |
| Show status bar | On | Shows local-engine, worktree, branch, agent, and check status. |

Compact layouts override the startup panel settings so content is not covered
as soon as the app opens. Toolbar labels also collapse automatically when the
task canvas is too narrow, regardless of the label preference. Workspace and
context dock widths are changed directly with their resize handles and persist
separately from Settings; double-click a handle to restore its default width.

## Composer

| Setting | Default | Behavior |
|---|---:|---|
| Send with Enter | On | Sends with Enter and inserts a new line with Shift+Enter. When off, Enter inserts a new line and Ctrl+Enter sends. |
| Default direction target | All agents | Starts each selected task with either all assigned agents or its first assigned agent as the composer target. |

## Accessibility

| Setting | Default | Behavior |
|---|---:|---|
| Reduced motion | Off | Disables ambient and entrance animation. The operating-system reduced-motion preference is also respected. |
| Higher contrast | Off | Strengthens secondary text and panel boundaries. |
| Larger controls | Off | Increases interactive target sizes throughout the workspace. |

## Search, persistence, and reset

Search matches category names, control labels, and related terms. A query can
show matching controls from more than one category; a no-results message keeps
the search recoverable.

Settings are stored as typed JSON under `axio-settings-v1` in local webview
storage and are merged with current defaults when new fields are introduced.
The previous appearance-only key is migrated on first load. If local storage is
unavailable or invalid, Axio uses safe defaults for the current session.

Reset all restores the values above, reopens the workspace sidebar and context
dock, and returns Review as the selected context when a gate requires it.
