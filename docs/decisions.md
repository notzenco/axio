# Product and architecture decisions

These decisions are accepted constraints for the current foundation. Change
one only with new evidence, an explicit replacement decision, and updates to
affected code and documentation.

## D-001: one desktop product

**Decision:** Portfolio, task, review, and focus are zoom levels of one Axio
desktop application. The former standalone switcher concept is not a second
current app.

**Why:** Process ownership, workspace state, settings, approvals, and recovery
need one source of truth.

**Consequence:** Extra windows may project shared state but cannot become
independently persisted products.

## D-002: keep a separate CLI consumer

**Decision:** The CLI remains a separate binary over the same protocol/core.

**Why:** Scripts and terminals need a stable automation surface without making
the desktop the only entry point.

**Consequence:** CLI and desktop behavior must agree; domain logic does not get
duplicated in either surface.

## D-003: task narrative is the primary truth

**Decision:** Messages, tool calls, changes, questions, approvals, and status
events for a task share one chronological narrative.

**Why:** Separate per-agent chat silos hide causality and make multi-agent work
hard to review.

**Consequence:** Portfolio agent cards summarize health; they do not replace the
task event stream.

## D-004: protocol and core own behavior

**Decision:** `axio-protocol` owns cross-boundary vocabulary and `axio-core`
owns state transitions. Tauri, CLI, and UI remain consumers.

**Why:** Reliability rules need one testable implementation.

**Consequence:** Native or UI convenience must not create an alternative state
machine.

## D-005: local-first without a required account

**Decision:** A useful Axio workspace must work with local repositories and
agents without an Axio account or hosted service.

**Why:** Source, credentials, processes, and worktrees should remain under user
control.

**Consequence:** Hosted sync or remote execution is optional future scope and
requires a separate security/operations decision.

## D-006: orchestrate existing agents first

**Decision:** Codex, Claude Code, OpenCode, Pi, and custom terminal agents are
peers behind connectors. Rebuilding a native model/agent loop is not foundation
scope.

**Why:** Axio's differentiator is a dependable shared workspace and review
surface, not another model transport.

**Consequence:** Prove a connector contract and lifecycle before expanding
provider count.

## D-007: contextual tools use one inspector

**Decision:** Diff, output, and plan share one optional right inspector. The
left side is one collapsible workspace sidebar; there is no redundant icon rail.

**Why:** The task remains primary and side tools should not reserve permanent
space or duplicate navigation.

**Consequence:** Both sidebars must independently return space to the task and
become overlays on compact windows.

## D-008: versions describe outcomes

**Decision:** `0.x` versions label shipped outcomes and may break with clear
migration notes. `1.0.0` is reserved for a stable daily-workspace contract.

**Why:** A predetermined version ladder creates false certainty during product
discovery.

**Consequence:** Plans use acceptance criteria rather than assigning invented
features to version numbers.

## D-009: public product, private operations

**Decision:** Product source and product-facing decisions live in
`notzenco/axio`. Cross-repository operations, live legacy service context, and
private planning stay in `notzenco/axio-workspace`.

**Why:** Public reviewability should not expose credentials or private operating
details.

**Consequence:** Current product docs cannot rely on private archived plans.

## D-010: external repositories are references, not dependencies

**Decision:** The documented research repositories remain optional read-only
comparisons outside the Axio source tree.

**Why:** Axio should learn from existing systems without silently importing
their architecture, code, license obligations, or update cadence.

**Consequence:** Any code reuse requires an explicit license and attribution
review; reference clones are never committed.
