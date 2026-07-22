# Contributing

Axio is early and its architecture is intentionally small. Issues and focused
pull requests are welcome, especially when they improve reliability,
cross-platform behavior, accessibility, or agent interoperability.

Before opening a pull request:

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
node --check apps/axio-desktop/ui/app.js
```

Desktop or native-boundary changes also require a release build and the manual
interaction checklist in [`docs/testing.md`](docs/testing.md).

Use Conventional Commits, keep changes scoped, and explain any user-visible
compatibility decision. New runtime or native dependencies should be proposed
before implementation.

Read the [development guide](docs/development.md),
[testing matrix](docs/testing.md), and [accepted decisions](docs/decisions.md)
before changing a cross-boundary type, native capability, connector contract,
or persisted-data design.
