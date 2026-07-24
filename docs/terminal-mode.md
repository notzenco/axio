# Terminal mode

Terminal is a native desktop work mode for running several local coding-agent
or shell processes in one Axio window. It is implemented today; it is not a
connector abstraction, durable command log, sandbox, or worktree manager.

## Current contract

- Supported launch providers are Codex (`codex`), Claude Code (`claude`),
  OpenCode (`opencode`), and the platform default shell.
- Every session starts in the selected repository root and is associated with
  the selected Axio task.
- Axio accepts batches of one to eight launches and allows at most 12 active
  sessions across the whole application. Running and stopping sessions both
  occupy capacity.
- Launch batches are serialized in the native manager. The UI queries the same
  app-wide capacity, remains disabled while capacity is unknown, clamps the
  requested batch to the remaining slots, and offers retry if the query fails.
- Sessions are transient. Metadata, output, credentials, and process handles
  are not added to the persisted `WorkspaceSession`.

The pane grid adapts to the available task area. Each pane shows provider,
ordinal, PID, working directory, lifecycle state, and exit code. Stop requests
are valid for running sessions; a pane can be closed after its process exits or
fails.

## Lifecycle and recovery

The native lifecycle is `running` -> `stopping` -> `exited` or `failed`.
Terminal exit events and task-scoped snapshots are reconciled monotonically so
a late running snapshot cannot overwrite a terminal state.

Launch, stop, and close operations have separate guards:

- only one launch batch may be pending in the UI, even if task selection
  changes during launch;
- native launch batches are serialized so concurrent IPC requests cannot race
  the 12-session boundary;
- Stop and Close are gated per session and their buttons disable immediately;
- closing a pane invalidates older refresh requests so stale snapshots cannot
  recreate it;
- capacity refreshes after launch attempts and every exit event.

When a session stops, its xterm instance remains mounted so scrollback and
selection remain available, but stdin and cursor blinking are disabled.
Buffered input is discarded, queued writes check the live session state before
IPC, and late write failures from a completed stop are not surfaced as new
errors.

Closing or replacing a repository stops its running sessions. Normal Axio
shutdown stops every owned session. On Windows, provider processes share a
kill-on-close Job Object so the operating system also tears down their process
trees if the application exits without completing normal cleanup.

## Throughput and bounds

- Native replay retains the latest 512 KiB per pane in memory.
- Output workers read at most 8 KiB per chunk and emit offset-tagged binary
  events.
- Replay and live events are ordered by byte offset. Gaps and trimmed history
  are shown explicitly instead of silently duplicating or dropping output.
- Rendering is queued and bounded per animation frame so one noisy pane cannot
  monopolize the webview.
- Live task previews batch updates and retain only a bounded text suffix.
- Input is coalesced briefly and split into writes no larger than 64 KiB.
- Resize storms are coalesced and redundant dimensions are ignored.

These bounds protect the Axio UI and its in-memory replay. They do not limit the
provider's own memory, network, filesystem, or subprocess behavior.

## Security boundary

Terminal processes inherit Axio's environment so their existing authentication
flows work. Axio does not copy environment values into the webview or
persistence, but the launched process has the authority of the local user and
the selected repository working directory. Interactive input has that same
authority.

Terminal mode does not isolate concurrent agents. Multiple panes can edit the
same files and interfere with one another. Use deliberate repository/worktree
boundaries outside Axio until native worktree ownership is implemented.

See [`security-model.md`](security-model.md) for the full trust model and
[`troubleshooting.md`](troubleshooting.md) for provider discovery problems.

## Verification

Automated coverage exercises native capacity validation, serialized launch
contention, bounded output, lifecycle reconciliation, replay ordering, render
backpressure, preview batching, resize coalescing, input batching, read-only
transitions, and per-session operation gates.

The packaged smoke test launches the optimized Axio executable, opens Terminal
mode without starting a provider, verifies the authoritative capacity state,
closes Axio, and confirms that no Axio window or release process remains. Live
provider credentials and interactive coding sessions remain a manual,
user-controlled test boundary.

Run the complete gates from the repository root:

```powershell
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cargo run -p axio-cli --locked -- status --json
node scripts\check-ui.mjs
bun run --cwd apps\axio-desktop test:ui
bun run --cwd apps\axio-desktop build:vite
bun run --cwd apps\axio-desktop build
git diff --check
```
