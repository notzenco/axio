# Product direction

Axio is a native workspace around coding agents, not a requirement to replace
their model transports or internal reasoning loops.

The target experience is simple:

1. Open a repository.
2. Launch one or more coding agents.
3. Give them deliberate worktree and task boundaries.
4. Observe progress, questions, commands, and failures in one place.
5. Review files and diffs, redirect work, and merge the result.
6. Reopen Axio later without losing the workspace.

The product may learn from Orca's orchestration, the Codex desktop app's task
model, and Cursor's compact glass agents window without cloning any one of
them.

## Stable goal

`1.0.0` means Axio is dependable as a daily agent workspace. It does not mean
every possible integration exists. The stable contract will cover the CLI,
persisted schemas and migrations, connector definitions, release artifacts,
and core workspace behavior.

## Explicit non-goals for the foundation

- Rebuilding the previous native LLM agent loop.
- Requiring an Axio account to work locally.
- Hosted inference, billing, or marketplace economics.
- A fixed sequence of intermediate version numbers.
