# Releasing

Axio is pre-release software at `0.0.1`. The repository currently compiles a
native executable, but Tauri bundling is disabled and there is no supported
installer, signing flow, update channel, or rollback contract.

## Current development build

```powershell
bun install --cwd apps\axio-desktop
bun run --cwd apps\axio-desktop build:vite
cargo build --release -p axio-desktop --locked
```

The resulting local executable is a verification artifact, not a published
release. Do not present it as an installer or stable distribution.

## Minimum pre-release gate

Before any tagged preview:

- working tree is clean and the release commit is on the protected remote;
- formatting, Clippy, tests, CLI smoke, and native release build pass;
- protocol, status, changelog, and migration documentation match behavior;
- supported platforms and required system dependencies are explicit;
- dependency/security review has no unexplained result;
- installer launches and uninstalls on clean test machines;
- artifact checksums and SBOM are generated;
- release notes label prototype-only and unsupported behavior;
- publication is a draft until a human verifies the artifacts.

## Stable delivery requirements

Before enabling automatic updates or calling a release stable:

- deterministic CI builds for every supported platform;
- code signing/notarization and protected signing credentials;
- full-SHA pinned CI actions and least-privilege permissions;
- artifact provenance/attestation and independently published checksums;
- versioned persisted data with tested upgrade and rollback behavior;
- signed update manifests, staged rollout, failure recovery, and downgrade rule;
- install/update/uninstall E2E tests;
- vulnerability disclosure and supported-version policy;
- release archive and reproducibility instructions.

## Version and notes

Versions follow [`versioning.md`](versioning.md). Update workspace package and
Tauri versions together. User-visible changes belong in
[`../CHANGELOG.md`](../CHANGELOG.md). Never reuse legacy Axio tags or updater
channels for the fresh product.

## Publication authority

Creating a build or draft does not authorize public publication. Tagging,
signing, uploading, enabling an updater, or changing distribution endpoints
requires an explicit owner decision after the evidence is reviewed.
