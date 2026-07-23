# Axio contributor instructions

## Commands

- `cargo fmt --all -- --check` - formatting gate.
- `cargo clippy --workspace --all-targets --locked -- -D warnings` - lint gate.
- `cargo test --workspace --locked` - complete Rust test suite.
- `cargo run -p axio-cli -- status --json` - CLI smoke test.
- `node scripts/check-ui.mjs` - type-check the desktop TypeScript application.
- `bun run --cwd apps/axio-desktop build:vite` - build the React UI.
- `bun run --cwd apps/axio-desktop dev` - run Vite and the Tauri desktop shell.
- `cargo build --release -p axio-desktop --locked` - native release build.

## Architecture

- `crates/axio-protocol` owns stable persisted and external vocabulary.
- `crates/axio-core` owns agent/workspace state and transition rules.
- `apps/axio-cli` is the automation surface over the same core.
- `apps/axio-desktop` is a thin Tauri shell; product logic stays in Rust crates.
- `ui/index.html` and `ui/src/main.tsx` are entry points; `ui/src/App.tsx` only
  composes feature components. Views, hooks, services, data, and styles stay in
  their named `ui/src/` or `ui/styles/` owners.
- Rust `lib.rs` files declare boundaries and re-export APIs; cohesive behavior,
  fixtures, errors, and tests live in named sibling modules.
- The product orchestrates existing coding agents. A native agent loop is not
  part of the foundational architecture.

## Gotchas

- Version `0.x` is intentionally adaptable. Do not invent a numbered roadmap.
- Treat CLI JSON, persisted schemas, connector descriptors, and migrations as
  deliberate compatibility surfaces.
- Keep credentials out of repository files and command output.
- Do not add hosted accounts, billing, or cloud dependencies to the local core.
- `docs/status-and-direction.md` is the canonical implementation-status record.
- Split by ownership, not arbitrary line counts; avoid both god files and
  one-function file sprawl.

## Definition of done

- Relevant tests and lints pass.
- Public behavior and documentation agree.
- No secret, private operational detail, or legacy-only assumption is added.
- Changes remain small enough to review and revert.
