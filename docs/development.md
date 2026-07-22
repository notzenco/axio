# Development guide

## Repository layout

```text
apps/axio-cli/                 automation consumer
apps/axio-desktop/src-tauri/   native shell and Tauri commands
apps/axio-desktop/ui/          code-native HTML, CSS, and JavaScript UI
crates/axio-core/              workspace state and invariants
crates/axio-protocol/          shared serializable vocabulary
docs/                          current product and engineering documentation
```

Product logic belongs in Rust core crates. The Tauri layer translates native
requests and manages process-local state; it should not become a second domain
model. UI code renders snapshots and asks the native boundary to mutate them.

## Daily verification

Run from the repository root:

```powershell
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cargo run -p axio-cli --locked -- status --json
node --check apps\axio-desktop\ui\app.js
```

Build the native release shell with:

```powershell
cargo build --release -p axio-desktop --locked
```

## Run the native app

```powershell
cargo run -p axio-desktop
```

This is the authoritative desktop path. It loads the static UI into Tauri and
enables native IPC and window controls.

## Run the static design preview

The frontend has no package-install or bundling step. Any local static server
can serve it; for example:

```powershell
python -m http.server 4173 --directory apps\axio-desktop\ui
```

Open `http://127.0.0.1:4173/`. This preview intentionally falls back to local
JavaScript demo state because Tauri IPC is absent. Use it for responsive layout
and visual iteration, not native integration claims.

## Change routing

- New shared types: `axio-protocol` first, then all consumers and docs.
- New state transition: `axio-core` with unit tests, then CLI/Tauri/UI.
- New native ability: add the smallest Tauri command and capability permission.
- New UI behavior: preserve keyboard access, responsive collapse/overlay rules,
  reduced motion, and text-safe rendering.
- New persistent field: do not add until storage versioning and migrations are
  designed.
- New connector: begin with a versioned contract and fixtures, not provider
  conditionals scattered through the UI.

## Documentation with code

Changes to current behavior update
[`status-and-direction.md`](status-and-direction.md). New intended outcomes
update [`product-plan.md`](product-plan.md). A choice that constrains future
work adds or supersedes an entry in [`decisions.md`](decisions.md). User-visible
changes update [`../CHANGELOG.md`](../CHANGELOG.md).

## Git practice

Use focused Conventional Commits. Do not commit generated build output,
credentials, populated environment files, local logs, or research repository
clones. External references stay outside this repository.
