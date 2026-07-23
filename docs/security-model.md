# Security model

This document describes the current trust boundary and the requirements that
must hold as Axio gains real repository and process access. Vulnerability
reports follow [`../SECURITY.md`](../SECURITY.md).

## Current boundary

The current application is local-only and combines deterministic task/agent
demo state with explicit read-only access to a user-selected Git repository. It
has no account, network client, agent executable launch, PTY, credential store,
updater, or hosted service.

The Tauri window has:

- a content security policy limited to local content and Tauri IPC;
- `core:default` plus explicit window-drag permission;
- a narrow allowlisted Rust command bridge for workspace persistence,
  repository inspection, safe file reads, and window controls;
- no shell plugin, HTTP plugin, filesystem plugin, or broad command execution;
- UI rendering that uses DOM `textContent` for dynamic snapshot values rather
  than injecting HTML.

Appearance preferences are stored in the webview's local storage. Repository
paths and repository-scoped task, agent, review, and activity state are stored
as plaintext JSON in two recoverable generations below Axio's platform app
configuration directory. Source repositories are never used for Axio state.

## Assets to protect

Future Axio versions will handle:

- source code and uncommitted changes;
- repository paths, branches, worktrees, and Git identity;
- agent prompts, outputs, tool calls, and local logs;
- provider authentication state and environment variables;
- approval decisions and process-control authority;
- persisted workspace data and diagnostic exports.

## Trust boundaries

1. **User to Axio UI:** destructive or externally visible operations require a
   clear target and explicit intent.
2. **Webview to Rust:** all command inputs are untrusted and validated in Rust;
   capabilities remain least privilege.
3. **Axio to agent process:** connectors receive only the repository, worktree,
   environment, and permissions required for that task.
4. **Agent output to UI/storage:** terminal text and structured events are
   untrusted content, safely rendered, bounded, and redacted before storage.
5. **Axio to Git/filesystem:** paths are canonicalized, ownership is checked,
   and destructive scope is never inferred from display strings.
6. **Axio to provider authentication:** credentials remain in the provider's
   intended flow and are never copied into prompts, logs, Git, or diagnostics.
7. **Build to user:** releases require pinned CI, signed artifacts, checksums,
   provenance, and human publication approval.

## Required controls before real execution

- Versioned connector capabilities and explicit executable discovery.
- Environment allowlist with secret-name and value redaction.
- Argument arrays rather than shell-built command strings.
- Process-group ownership, cancellation escalation, and orphan reconciliation.
- Repository/worktree allowlist and canonical path containment checks.
- Output size, event rate, log retention, and disk quotas.
- Approval records that distinguish review from commit, merge, push, publish,
  deploy, or message-sending authority.
- Diagnostic preview and opt-in for any source or event content leaving the
  machine.
- Threat modeling before remote execution, plugins, hosted sync, or updates.

## Known dependency alert

As of 2026-07-22, GitHub reports one open moderate Dependabot alert for
`glib 0.18.5`: unsound `Iterator` and `DoubleEndedIterator` implementations for
`glib::VariantStrIter`. It is selected by Tauri's Linux GTK3 dependency chain;
the advisory's first patched line is `0.20.0`. Do not force a semver-incompatible
lockfile replacement. Track the Tauri/GTK dependency path, test the supported
Linux build, and update when the upstream stack provides a compatible route.

## Security non-claims

The current approval cards are product-flow prototypes, not a sandbox. Axio
does not yet isolate an agent, guarantee command safety, attest outputs, encrypt
persisted history, redact credentials from user-authored directions, or enforce
retention limits. The local-only principle and recoverable writes reduce
exposure and data-loss risk but do not replace process, path, secret, storage,
and release controls.
