# Architecture

Axio begins with two stable boundaries and two consumers.

```text
axio-protocol
     |
 axio-core
   /     \
CLI     Tauri desktop
```

`axio-protocol` owns vocabulary that can cross process or persistence
boundaries. `axio-core` owns orchestration state and invariants. The CLI and
desktop must remain thin consumers of the same behavior.

Future terminal, process, Git, worktree, persistence, and connector crates
should be introduced only when their ownership is clear. Internal crates are
not automatically public APIs and should remain unpublished unless a concrete
external use case exists.

Hosted services are a separate optional system. The local application must
remain useful without them.
