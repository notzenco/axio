# Contributing

Axio is early and its architecture is intentionally small. Issues and focused
pull requests are welcome, especially when they improve reliability,
cross-platform behavior, accessibility, or agent interoperability.

Before opening a pull request:

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo test --workspace --locked
```

Use Conventional Commits, keep changes scoped, and explain any user-visible
compatibility decision. New runtime or native dependencies should be proposed
before implementation.
