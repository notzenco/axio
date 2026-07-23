# Axio

**A native, local-first workspace for running, steering, and reviewing coding
agents.**

Axio is being rebuilt in public as a Rust and Tauri application. The goal is a
polished agent workspace in the spirit of the Codex desktop app and Cursor's
agents window, with strong multi-agent and worktree orchestration.

The repository begins at `0.0.1`. Intermediate `0.x` releases will follow the
product rather than a predetermined version schedule. `1.0.0` is reserved for
the stable product contract.

## Product principles

- **Agent-agnostic:** Codex, Claude Code, OpenCode, Pi, and other terminal
  agents should be first-class peers.
- **Local-first:** repositories, worktrees, terminals, and session state remain
  under the user's control.
- **One workspace:** see what every agent is doing, answer questions, review
  diffs, and redirect work without hunting through terminal windows.
- **Rust-owned reliability:** process supervision, persistence, protocols, and
  security boundaries live in testable Rust crates.
- **Public by default:** source, decisions, documentation, and release evidence
  are reviewable from the first commit.

## Current foundation

The current foundation contains:

- a typed task, activity, review, and agent orchestration protocol;
- an in-memory workspace state machine with tested task and agent transitions;
- an automation-friendly CLI status surface;
- a functional, responsive Tauri task workspace backed by the same Rust core;
- a task-first timeline, resizable workspace navigation, a contextual
  browser/files/review/output/plan tool dock, native window controls, and local
  review gates;
- inline task validation, explicit direction context, changed-file navigation,
  accessible focus handling, and mutually exclusive compact overlays;
- pinned, least-privilege CI and public project policies.

It intentionally does not import the previous Axio native-agent engine,
marketplace, hosted inference service, billing system, or release history.

## Build

Prerequisites are Bun, the stable Rust toolchain, and the platform-specific
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

```sh
bun install --cwd apps/axio-desktop
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cargo run -p axio-cli -- status --json
bun run --cwd apps/axio-desktop build:vite
cargo build --release -p axio-desktop --locked
bun run --cwd apps/axio-desktop dev
```

For a fresh computer, including the private coordination workspace and the
optional research library, follow [new-machine setup](docs/new-machine-setup.md).

The [documentation index](docs/README.md) links the complete current set. Start
with [status and direction](docs/status-and-direction.md) for the exact boundary
between implemented behavior, simulated UI, missing runtime work, and intended
outcomes.

## Status

Axio is early public software. There are no stable installers yet. Follow the
repository rather than depending on `0.x` behavior remaining compatible.

## License

[MIT](LICENSE)
