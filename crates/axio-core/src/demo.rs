use axio_protocol::{
    ActivityKind, AgentKind, AgentSession, AgentStatus, RepositorySnapshot, ReviewStatus,
    TaskStatus, WorkspaceActivity, WorkspaceSnapshot, WorkspaceTask,
};

use crate::Workspace;

impl Workspace {
    /// Provides a closed state with no repository-scoped demo data.
    #[must_use]
    pub fn empty() -> Self {
        Self::new(WorkspaceSnapshot {
            project: "No workspace".to_owned(),
            branch: "—".to_owned(),
            agents: Vec::new(),
            tasks: Vec::new(),
            selected_task: String::new(),
            activity: Vec::new(),
            repository: None,
        })
    }

    /// Creates an honest first task boundary for a repository without
    /// manufacturing agent progress, commands, or review history.
    #[must_use]
    pub fn for_repository(repository: RepositorySnapshot) -> Self {
        let changed_files = u32::try_from(repository.changes.len()).unwrap_or(u32::MAX);
        let review = if changed_files > 0 {
            ReviewStatus::Pending
        } else {
            ReviewStatus::None
        };
        let name = repository.name.clone();
        let root = repository.root.clone();
        let branch = repository.branch.clone();
        Self::new(WorkspaceSnapshot {
            project: name.clone(),
            branch,
            agents: Vec::new(),
            tasks: vec![WorkspaceTask {
                id: "workspace".to_owned(),
                title: format!("{name} workspace"),
                status: TaskStatus::Active,
                worktree: name,
                agent_ids: Vec::new(),
                unread: 0,
                changed_files,
                review,
            }],
            selected_task: "workspace".to_owned(),
            activity: vec![WorkspaceActivity {
                id: "activity-1".to_owned(),
                task_id: "workspace".to_owned(),
                agent_id: None,
                kind: ActivityKind::Status,
                summary: "Repository opened".to_owned(),
                detail: Some(root),
                timestamp: "now".to_owned(),
            }],
            repository: Some(repository),
        })
    }

    /// Provides deterministic legacy state for compatibility and transition tests.
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
            repository: None,
        })
    }
}
