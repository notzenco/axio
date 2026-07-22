# Axio contributor instructions

## Commands

- `cargo fmt --all -- --check` - formatting gate.
- `cargo clippy --workspace --all-targets --locked -- -D warnings` - lint gate.
- `cargo test --workspace --locked` - complete Rust test suite.
- `cargo run -p axio-cli -- status --json` - CLI smoke test.
- `node --check apps/axio-desktop/ui/app.js` - desktop JavaScript syntax.
- `cargo run -p axio-desktop` - run the Tauri desktop shell.
- `cargo build --release -p axio-desktop --locked` - native release build.

## Architecture

- `crates/axio-protocol` owns stable persisted and external vocabulary.
- `crates/axio-core` owns agent/workspace state and transition rules.
- `apps/axio-cli` is the automation surface over the same core.
- `apps/axio-desktop` is a thin Tauri shell; product logic stays in Rust crates.
- The product orchestrates existing coding agents. A native agent loop is not
  part of the foundational architecture.

## Gotchas

- Version `0.x` is intentionally adaptable. Do not invent a numbered roadmap.
- Treat CLI JSON, persisted schemas, connector descriptors, and migrations as
  deliberate compatibility surfaces.
- Keep credentials out of repository files and command output.
- Do not add hosted accounts, billing, or cloud dependencies to the local core.
- `docs/status-and-direction.md` is the canonical implementation-status record.

## Definition of done

- Relevant tests and lints pass.
- Public behavior and documentation agree.
- No secret, private operational detail, or legacy-only assumption is added.
- Changes remain small enough to review and revert.
