use axio_protocol::{
    ActivityKind, AgentKind, AgentSession, AgentStatus, ReviewStatus, TaskStatus,
    WorkspaceActivity, WorkspaceSnapshot, WorkspaceTask,
};

use crate::Workspace;

impl Workspace {
    /// Provides deterministic state for the first desktop and CLI shell.
    #[must_use]
    pub fn demo() -> Self {
        Self::new(WorkspaceSnapshot {
            project: "axio".to_owned(),
            branch: "main".to_owned(),
            agents: vec![
                AgentSession {
                    id: "codex-01".to_owned(),
                    name: "Codex".to_owned(),
                    kind: AgentKind::Codex,
                    status: AgentStatus::Running,
                    task: "Map the workspace boundary".to_owned(),
                    worktree: Some("agent/workspace-foundation".to_owned()),
                },
                AgentSession {
                    id: "claude-01".to_owned(),
                    name: "Claude Code".to_owned(),
                    kind: AgentKind::ClaudeCode,
                    status: AgentStatus::Waiting,
                    task: "Review the initial architecture".to_owned(),
                    worktree: Some("agent/architecture-review".to_owned()),
                },
            ],
            tasks: vec![
                WorkspaceTask {
                    id: "desktop".to_owned(),
                    title: "Unify the Axio desktop".to_owned(),
                    status: TaskStatus::Waiting,
                    worktree: "axio/unify-desktop".to_owned(),
                    agent_ids: vec!["codex-01".to_owned(), "claude-01".to_owned()],
                    unread: 1,
                    changed_files: 3,
                    review: ReviewStatus::Pending,
                },
                WorkspaceTask {
                    id: "protocol".to_owned(),
                    title: "Agent protocol refactor".to_owned(),
                    status: TaskStatus::Active,
                    worktree: "axio/agent-protocol".to_owned(),
                    agent_ids: vec!["codex-01".to_owned()],
                    unread: 0,
                    changed_files: 0,
                    review: ReviewStatus::None,
                },
            ],
            selected_task: "desktop".to_owned(),
            activity: vec![
                WorkspaceActivity {
                    id: "activity-1".to_owned(),
                    task_id: "desktop".to_owned(),
                    agent_id: Some("codex-01".to_owned()),
                    kind: ActivityKind::Tool,
                    summary: "Mapped the desktop boundary and shared Rust state".to_owned(),
                    detail: Some("cargo test --workspace --locked".to_owned()),
                    timestamp: "10:24".to_owned(),
                },
                WorkspaceActivity {
                    id: "activity-2".to_owned(),
                    task_id: "desktop".to_owned(),
                    agent_id: Some("claude-01".to_owned()),
                    kind: ActivityKind::Change,
                    summary: "Implemented the unified task workspace".to_owned(),
                    detail: Some("3 files changed in apps/axio-desktop/ui".to_owned()),
                    timestamp: "10:29".to_owned(),
                },
                WorkspaceActivity {
                    id: "activity-3".to_owned(),
                    task_id: "desktop".to_owned(),
                    agent_id: Some("claude-01".to_owned()),
                    kind: ActivityKind::Approval,
                    summary: "Review the proposed desktop changes".to_owned(),
                    detail: Some("The task is paused at a local review gate".to_owned()),
                    timestamp: "10:31".to_owned(),
                },
                WorkspaceActivity {
                    id: "activity-4".to_owned(),
                    task_id: "protocol".to_owned(),
                    agent_id: Some("codex-01".to_owned()),
                    kind: ActivityKind::Status,
                    summary: "Protocol vocabulary is ready to extend".to_owned(),
                    detail: Some("No external compatibility promise exists at 0.0.1".to_owned()),
                    timestamp: "10:36".to_owned(),
                },
            ],
        })
    }
}
