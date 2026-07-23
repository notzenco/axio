# Troubleshooting

## The browser preview does not use native behavior

The Vite preview has no Tauri IPC. Window controls show a notice, and tasks
mutate the typed fallback snapshot. Run
`bun run --cwd apps/axio-desktop dev` to verify native commands and Rust state.

## The native window will not move

Drag a non-interactive part of the titlebar. `Alt` plus drag also works from a
non-interactive surface. Buttons, inputs, dialogs, links, tabs, and editable
content intentionally do not initiate dragging.

Confirm `capabilities/default.json` still grants only
`core:window:allow-start-dragging` in addition to `core:default`, and that the
UI calls the allowlisted `window_action` fallback only with `drag`.

## A panel reserves space or overlaps another panel

Verify the body class combination and viewport. With both closed at wide
desktop size, `.workspace-shell` must resolve to zero-width side tracks and one
main track. At 720px and below, the workspace panel and context dock are mutually
exclusive overlays; opening either must close the other and show one scrim.
Compare against
[`../design-qa.md`](../design-qa.md).

## Windows reports incremental compilation access warnings

This workstation can report `did not finalize incremental compilation session`
with `Access is denied` while the Cargo command still succeeds. Trust the exit
code. If it becomes a real build failure, retry in the current shell with:

```powershell
$env:CARGO_INCREMENTAL = '0'
$env:RUSTC_WRAPPER = ''
```

Do not stop a shared compiler cache service merely to suppress a warning.

## Linux fails while building GTK/WebKit dependencies

Install the platform packages listed by the
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for the target
distribution. Windows compilation does not prove the Linux native dependency
set is present.

## A private workspace submodule is detached

`git submodule update --init --recursive` checks out the commit pinned by the
private workspace, which can be detached by design. To continue active Axio
development:

```powershell
git -C repos/axio switch main
git -C repos/axio pull --ff-only
```

Commit and push inside `repos/axio` first, then commit the new submodule pointer
in `axio-workspace`.

## A Terminal pane says an agent could not be launched

Axio resolves the provider executable from its own inherited `PATH`. Confirm
the same desktop environment can find `codex`, `claude`, or `opencode`, then
restart Axio after changing `PATH`. Authentication remains inside the
provider's terminal flow.

Terminal mode starts real processes in the selected repository root. It does
not create worktrees or isolate concurrent agents yet, so do not let multiple
panes edit the same files unless that overlap is intentional.

## Directions do not reach a Terminal agent

Terminal panes are real interactive processes, but composer directions and
persisted agent cards are not connected to them yet. Enter prompts directly in
the desired pane. Git worktrees, complete diff, and plan content remain
incomplete. See [`status-and-direction.md`](status-and-direction.md) for the
precise boundary.
