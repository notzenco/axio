# Versioning

Development starts at `0.0.1` and remains adaptable throughout `0.x`.

Versions describe shipped outcomes; they do not prescribe a feature timeline.
Breaking changes are allowed before `1.0.0`, but meaningful migrations and
release notes should still be provided whenever users can have persisted data
or automation depending on the old behavior.

`1.0.0` is reserved for the first stable product contract. Before that release
Axio must explicitly document its CLI, persisted data, connector schema,
orchestration protocol, supported platforms, update behavior, and migration
policy.
