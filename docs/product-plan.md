# Product plan

This plan describes outcomes and acceptance criteria, not promised dates or a
fixed sequence of `0.x` releases. Dependencies determine practical order; user
evidence may change the solution inside an outcome.

## Outcome: calm and truthful task interaction

**User result:** routine history recedes, attention is unmistakable, and every
direction clearly states its target, context, and authority.

Scope and detailed acceptance criteria are maintained in
[`ui-improvement-plan.md`](ui-improvement-plan.md). The first reusable event,
attention, composer, inspector, accessibility, and responsive primitives are
implemented over demo state. Connect them to real workspace data without
letting further visual polish disguise or delay the runtime outcomes below.

## Outcome: durable local workspace

**User result:** Axio opens a real repository and restores it after restart.

Scope:

- Repository/folder picker and recent workspaces.
- Persisted workspace identity, selected task, layout, and safe appearance
  preferences.
- Versioned schema and forward migrations.
- Atomic writes or transactional storage, corruption detection, and recovery.
- Clear ownership of Axio data versus source-repository data.

Acceptance:

- A repository can be opened, closed, and reopened after an app restart.
- Paths with spaces and non-ASCII characters work on supported platforms.
- Interrupted writes do not destroy the last valid state.
- Migration tests cover every persisted schema change.
- Removing a workspace from Axio never deletes the source repository.

## Outcome: real connector lifecycle

**User result:** Axio can launch, observe, steer, stop, and reconnect to one real
coding agent before generalizing the interface to more providers.

Scope:

- Versioned connector descriptor and capability negotiation.
- Executable discovery and explicit configuration.
- Process ownership, environment allowlist, working directory, and worktree.
- Structured lifecycle: idle, starting, running, waiting, completed, failed.
- Graceful stop, forced-stop escalation, exit capture, and orphan detection.
- Authentication remains in the provider's intended interactive flow.

Acceptance:

- One supported connector completes a real task in a disposable repository.
- Axio distinguishes launch failure, auth required, waiting for user, tool
  approval, success, cancellation, and crash.
- Restarting Axio detects and explains any surviving or interrupted process.
- Secrets are absent from persisted events, logs, command lines, and UI errors.
- Connector contract tests use fixtures without requiring user credentials.

## Outcome: truthful task narrative and terminal

**User result:** one timeline explains what every attached agent did and what
needs attention now.

Scope:

- PTY lifecycle, output streaming, input, resize, backpressure, and exit status.
- Normalized messages, tool calls, file changes, questions, approvals, and
  status events with provenance.
- Ordering and deduplication across concurrent connectors.
- Bounded storage, redaction, search, and export.
- Attention model for unread, waiting, failed, and review-required states.

Acceptance:

- Events survive restart and retain connector, task, agent, and timestamp.
- The terminal handles sustained output without freezing or unbounded memory.
- The narrative never labels a simulated or inferred event as provider truth.
- Sensitive values are redacted before persistence and rendering.
- Keyboard-only users can reach and operate every attention-requiring event.

## Outcome: Git worktrees and review

**User result:** parallel agents work in deliberate isolation and changes can be
reviewed safely from Axio.

Scope:

- Repository validation, branch policy, and worktree creation/removal.
- Clean/dirty checks and ownership locks.
- Real file list, unified diff, hunk navigation, binary/large-file behavior.
- Return-for-revision, approve, stage, commit, and merge boundaries.
- Conflict detection and explicit handoff to an external Git tool when needed.

Acceptance:

- Two tasks can work concurrently without sharing a writable worktree.
- Axio refuses destructive cleanup when ownership or uncommitted state is
  ambiguous.
- Displayed diffs match Git output for text, rename, deletion, and binary cases.
- Approval never implies commit or merge unless the user explicitly selected
  that operation.
- Recovery tests cover deleted branches, missing worktrees, and merge conflicts.

## Outcome: recovery and diagnostics

**User result:** failures explain themselves and work is recoverable.

Scope:

- Structured local logs with redaction and retention controls.
- Health view for repository, connector, process, PTY, Git, and storage state.
- Crash-safe task checkpoints and restart reconciliation.
- Exportable diagnostic bundle with a preview of exactly what will be shared.
- Performance budgets and instrumentation for startup, memory, and event load.

Acceptance:

- Forced app termination during active work does not silently lose task state.
- A connector crash produces a useful reason and safe restart option.
- Diagnostic export contains no secret or source content by default.
- Startup and high-output scenarios have repeatable benchmark thresholds.

## Outcome: supportable desktop delivery

**User result:** Axio installs, updates, and can be rolled back safely on each
supported platform.

Scope:

- Explicit supported-platform matrix.
- Reproducible release builds, installers, signatures, checksums, and SBOMs.
- Least-privilege CI with pinned actions and protected publication.
- Draft release verification, update manifest, rollback, and migration policy.
- Accessibility, browser UI, native window, and install/uninstall E2E coverage.

Acceptance:

- A clean supported machine can install, launch, update, and uninstall Axio.
- Release artifacts are signed and checksums are independently verifiable.
- Publication requires human approval after automated gates pass.
- Failed update and failed migration scenarios preserve user work.
- Release notes identify compatibility and data-migration effects.

## Later possibilities requiring a new decision

These are not committed scope:

- Remote workers or repository execution.
- Optional encrypted synchronization between devices.
- Scheduled and background automation.
- Mobile monitoring or approval companion.
- Hosted accounts, billing, inference, or marketplace.
- An Axio-native model/agent loop.

Each requires evidence that it improves the local workspace, a threat model,
clear operating ownership, and an explicit architecture decision before code.
