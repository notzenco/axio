# Development guide

## Repository layout

```text
apps/axio-cli/                 automation consumer
apps/axio-desktop/src-tauri/   native shell and Tauri commands
apps/axio-desktop/package.json      frontend commands and dependencies
apps/axio-desktop/vite.config.ts    Vite and Tauri development boundary
apps/axio-desktop/ui/index.html     frontend document entry
apps/axio-desktop/ui/src/App.tsx    React composition root
apps/axio-desktop/ui/src/components feature-owned semantic views
apps/axio-desktop/ui/src/hooks/     reusable stateful behavior
apps/axio-desktop/ui/src/services/  typed native command boundary
apps/axio-desktop/ui/src/data/      static preview fixtures
apps/axio-desktop/ui/styles/        feature and component styles
crates/axio-core/              workspace state and invariants
crates/axio-protocol/          shared serializable vocabulary
docs/                          current product and engineering documentation
```

Product logic belongs in Rust core crates. The Tauri layer translates native
requests and commits core snapshots through the local store; it should not
become a second domain model. UI code renders snapshots and asks the native
boundary to mutate them.

## Daily verification

Run from the repository root:

```powershell
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cargo run -p axio-cli --locked -- status --json
node scripts\check-ui.mjs
bun run --cwd apps\axio-desktop build:vite
```

Build the native release shell with:

```powershell
cargo build --release -p axio-desktop --locked
```

## Run the native app

```powershell
bun run --cwd apps\axio-desktop dev
```

This is the authoritative desktop path. The Tauri CLI starts Vite, loads the
React UI, and enables native IPC and window controls.

## Run the browser preview

Install the pinned frontend dependencies once:

```powershell
bun install --cwd apps\axio-desktop
bun run --cwd apps\axio-desktop dev:vite
```

Open `http://127.0.0.1:1430/`. This preview intentionally falls back to local
TypeScript demo state because Tauri IPC is absent. Use it for responsive layout
and visual iteration, not native integration claims.

## Change routing

- New shared types: `axio-protocol` first, then all consumers and docs.
- New state transition: `axio-core` with unit tests, then CLI/Tauri/UI.
- New native ability: add the smallest Tauri command and capability permission.
- New UI behavior: preserve keyboard access, responsive collapse/overlay rules,
  reduced motion, and text-safe rendering. Put semantic views in
  `ui/src/components`, reusable state in `ui/src/hooks`, native calls in
  `ui/src/services`, and component styles in `ui/styles`; keep `App.tsx` for
  composition and cross-feature wiring.
- New Rust behavior: add it to the module that owns its invariant. Keep crate
  roots thin and split a new module or crate only at a clear ownership boundary.
- New persistent field: do not add until storage versioning and migrations are
  designed.
- New connector: begin with a versioned contract and fixtures, not provider
  conditionals scattered through the UI.

## Documentation with code

Changes to current behavior update
[`status-and-direction.md`](status-and-direction.md). New intended outcomes
update [`product-plan.md`](product-plan.md). A choice that constrains future
work adds or supersedes an entry in [`decisions.md`](decisions.md). User-visible
changes update [`../CHANGELOG.md`](../CHANGELOG.md). Desktop interaction or
visual changes also update [`testing.md`](testing.md), the relevant design
contract, and [`../design-qa.md`](../design-qa.md) with matched evidence.

## Git practice

Use focused Conventional Commits. Do not commit generated build output,
credentials, populated environment files, local logs, or research repository
clones. External references stay outside this repository.
