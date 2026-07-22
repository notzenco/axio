# New-machine setup

This guide restores the current Axio development environment without relying
on machine-specific archives or junctions.

## Choose the checkout

For product work only, clone the public repository:

```powershell
git clone https://github.com/notzenco/axio.git
Set-Location axio
```

For the complete private coordination workspace, including pinned legacy
history and the website, clone the meta-repository and initialize submodules:

```powershell
git clone --recurse-submodules https://github.com/notzenco/axio-workspace.git
Set-Location axio-workspace
.\bootstrap.ps1
git -C repos/axio switch main
git -C repos/axio pull --ff-only
```

The recursive checkout requires GitHub credentials that can read the private
workspace and legacy repositories. The active `notzenco/axio` and
`notzenco/axio-website` repositories are public.

On Linux or macOS, use `./bootstrap.sh`; replace the PowerShell path separators
in later commands as appropriate.

## Toolchain

Install:

- Git;
- the stable Rust toolchain through `rustup`;
- the platform-specific [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/);
- Node.js for the website check in the private workspace.

Axio's current desktop frontend is shipped directly from
`apps/axio-desktop/ui`; it does not require a JavaScript package install.

## Verify the active product

From `repos/axio` in the private workspace, or the root of a direct public
clone:

```powershell
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
cargo run -p axio-cli -- status --json
cargo build --release -p axio-desktop --locked
```

Run the desktop during development with:

```powershell
cargo run -p axio-desktop
```

In the private workspace, verify the website separately:

```powershell
node repos/axio-website/scripts/check.mjs
```

## Optional research library

The external projects used for product and implementation research are not
submodules and are not required to build Axio. Clone all or only the ones you
need using the commands in
[`reference-repositories.md`](reference-repositories.md). Keep them outside the
Axio source tree and treat them as read-only reference material.

## Before leaving the old machine

For each repository, confirm that `git status --short --branch` is clean and
that the local commit matches its upstream branch. In the private workspace,
push the `repos/axio` commit first and then commit and push the updated submodule
pointer in `axio-workspace`.
