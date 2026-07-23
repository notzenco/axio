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
them. The complete, reproducible research catalog is documented in
[`reference-repositories.md`](reference-repositories.md).

## One desktop product

Axio ships as one desktop application. Portfolio, task, review, and focused
agent views are zoom levels of the same workspace, not separate installed
apps. A focused window may be opened for one task, but it shares the same
process supervision, state, permissions, and settings as the main window.

The CLI remains a separate binary because scripts and terminals need a stable
automation surface. It is a consumer of the same core, not a second user
experience or an alternative source of truth.

The default desktop view is task-first:

1. The left side answers where work lives: tasks, worktrees, and agents.
2. The center tells the chronological story of a task: messages, tool calls,
   questions, approvals, file changes, and handoffs.
3. The optional right dock provides browser, files, review, output, and plan
   tools without turning them into permanent top-level navigation.
4. Focus mode hides navigation and review chrome without moving the task into
   another product.

## Stable goal

`1.0.0` means Axio is dependable as a daily agent workspace. It does not mean
every possible integration exists. The stable contract will cover the CLI,
persisted schemas and migrations, connector definitions, release artifacts,
and core workspace behavior.

The outcome plan and its acceptance criteria are maintained in
[`product-plan.md`](product-plan.md); current implementation status lives in
[`status-and-direction.md`](status-and-direction.md).

## Explicit non-goals for the foundation

- Rebuilding the previous native LLM agent loop.
- Requiring an Axio account to work locally.
- Hosted inference, billing, or marketplace economics.
- A fixed sequence of intermediate version numbers.
