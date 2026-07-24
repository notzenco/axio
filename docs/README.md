# Axio documentation

This directory is the current documentation set for the public Axio product.
It describes the code on `main`; archived plans in the private coordination
workspace are historical evidence, not current instructions.

## Start here

- [`status-and-direction.md`](status-and-direction.md) — canonical statement of
  what works, what is simulated, what is missing, and what outcomes come next.
- [`product-direction.md`](product-direction.md) — product intent, principles,
  and non-goals.
- [`product-plan.md`](product-plan.md) — dependency-ordered product outcomes and
  their acceptance criteria, without release-date promises.
- [`new-machine-setup.md`](new-machine-setup.md) — restore and verify Axio on a
  fresh development computer.

## Product and experience

- [`desktop-design.md`](desktop-design.md) — information architecture,
  interaction contract, responsive behavior, and visual system.
- [`settings.md`](settings.md) — every desktop preference, its default,
  responsive behavior, persistence, and reset semantics.
- [`ui-improvement-plan.md`](ui-improvement-plan.md) — implemented UI
  foundations, remaining refinements, and acceptance criteria.
- [`ui-audit-2026-07-22.md`](ui-audit-2026-07-22.md) — original
  screenshot-backed findings plus the completed implementation follow-up.
- [`ui-audit-implementation.md`](ui-audit-implementation.md) — completed scope,
  non-goals, acceptance criteria, and implementation commit.
- [`design/`](design/) — implementation screenshots and visual QA evidence.
- [`decisions.md`](decisions.md) — settled architectural and product decisions.
- [`reference-repositories.md`](reference-repositories.md) — all external
  research repositories, their purpose, and portable clone commands.

## Engineering

- [`architecture.md`](architecture.md) — crate and desktop boundaries.
- [`terminal-mode.md`](terminal-mode.md) — current providers, capacity,
  lifecycle, performance bounds, recovery, and process-security contract.
- [`protocol.md`](protocol.md) — current data model, transitions, commands, and
  compatibility posture.
- [`development.md`](development.md) — repository layout and daily workflows.
- [`testing.md`](testing.md) — automated and manual verification matrix.
- [`security-model.md`](security-model.md) — trust boundaries, permissions,
  known risks, and security requirements.
- [`releasing.md`](releasing.md) — pre-release and future release gates.
- [`troubleshooting.md`](troubleshooting.md) — common setup, preview, and build
  problems.
- [`versioning.md`](versioning.md) — compatibility and version-number policy.

## Project records

- [`../CHANGELOG.md`](../CHANGELOG.md) — user-visible changes by release state.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution expectations.
- [`../SECURITY.md`](../SECURITY.md) — private vulnerability reporting.
- [`../design-qa.md`](../design-qa.md) — latest audited desktop interaction and
  responsive verification.

## Currency rule

Update the relevant document in the same change whenever code invalidates a
claim. `status-and-direction.md` owns implementation status;
`product-plan.md` owns intended outcomes; `decisions.md` owns settled choices.
Avoid repeating those claims elsewhere when a link is enough.
