//! Core workspace state and lifecycle invariants.

use std::{error::Error, fmt};

use axio_protocol::{
    ActivityKind, AgentKind, AgentSession, AgentStatus, ReviewStatus, TaskStatus,
    WorkspaceActivity, WorkspaceSnapshot, WorkspaceTask,
};

/// Mutable orchestration state shared by Axio's user surfaces.
#[derive(Debug, Clone)]
pub struct Workspace {
    snapshot: WorkspaceSnapshot,
}

impl Workspace {
    /// Creates a workspace from persisted or discovered state.
    #[must_use]
    pub const fn new(snapshot: WorkspaceSnapshot) -> Self {
        Self { snapshot }
    }

    /// Returns a serializable point-in-time view.
    #[must_use]
    pub fn snapshot(&self) -> WorkspaceSnapshot {
        self.snapshot.clone()
    }

    /// Applies a validated lifecycle transition to one agent.
    pub fn transition_agent(&mut self, id: &str, next: AgentStatus) -> Result<(), CoreError> {
        let agent = self
            .snapshot
            .agents
            .iter_mut()
            .find(|agent| agent.id == id)
            .ok_or_else(|| CoreError::AgentNotFound(id.to_owned()))?;

        if !can_transition(agent.status, next) {
            return Err(CoreError::InvalidTransition {
                id: id.to_owned(),
                from: agent.status,
                to: next,
            });
        }

        agent.status = next;
        Ok(())
    }

    /// Selects the task rendered by the desktop workspace.
    pub fn select_task(&mut self, id: &str) -> Result<(), CoreError> {
        if !self.snapshot.tasks.iter().any(|task| task.id == id) {
            return Err(CoreError::TaskNotFound(id.to_owned()));
        }

        self.snapshot.selected_task = id.to_owned();
        if let Some(task) = self.snapshot.tasks.iter_mut().find(|task| task.id == id) {
            task.unread = 0;
        }
        Ok(())
    }

    /// Creates and selects a task with an isolated worktree boundary.
    pub fn create_task(&mut self, title: String) -> Result<(), CoreError> {
        let title = title.trim();
        if title.is_empty() {
            return Err(CoreError::EmptyTaskTitle);
        }

        let ordinal = self.snapshot.tasks.len() + 1;
        let id = format!("task-{ordinal}");
        let worktree = format!("axio/{}", task_slug(title));
        let agent_ids = self
            .snapshot
            .agents
            .iter()
            .map(|agent| agent.id.clone())
            .collect();

        self.snapshot.tasks.push(WorkspaceTask {
            id: id.clone(),
            title: title.to_owned(),
            status: TaskStatus::Active,
            worktree,
            agent_ids,
            unread: 0,
            changed_files: 0,
            review: ReviewStatus::None,
        });
        self.snapshot.activity.push(WorkspaceActivity {
            id: next_activity_id(&self.snapshot),
            task_id: id.clone(),
            agent_id: None,
            kind: ActivityKind::Status,
            summary: "Task created with an isolated worktree".to_owned(),
            detail: Some("Ready to receive direction".to_owned()),
            timestamp: "now".to_owned(),
        });
        self.snapshot.selected_task = id;
        Ok(())
    }

    /// Adds user direction to a task's chronological activity.
    pub fn send_direction(&mut self, task_id: &str, message: String) -> Result<(), CoreError> {
        if !self.snapshot.tasks.iter().any(|task| task.id == task_id) {
            return Err(CoreError::TaskNotFound(task_id.to_owned()));
        }
        let message = message.trim();
        if message.is_empty() {
            return Err(CoreError::EmptyDirection);
        }

        self.snapshot.activity.push(WorkspaceActivity {
            id: next_activity_id(&self.snapshot),
            task_id: task_id.to_owned(),
            agent_id: None,
            kind: ActivityKind::Message,
            summary: message.to_owned(),
            detail: Some("Direction queued for all task agents".to_owned()),
            timestamp: "now".to_owned(),
        });
        Ok(())
    }

    /// Records the user's decision on a task review gate.
    pub fn review_task(&mut self, task_id: &str, approved: bool) -> Result<(), CoreError> {
        let task = self
            .snapshot
            .tasks
            .iter_mut()
            .find(|task| task.id == task_id)
            .ok_or_else(|| CoreError::TaskNotFound(task_id.to_owned()))?;

        task.review = if approved {
            ReviewStatus::Approved
        } else {
            ReviewStatus::Rejected
        };
        task.status = if approved {
            TaskStatus::Completed
        } else {
            TaskStatus::Waiting
        };
        let summary = if approved {
            "Changes approved"
        } else {
            "Changes returned with feedback"
        };
        self.snapshot.activity.push(WorkspaceActivity {
            id: next_activity_id(&self.snapshot),
            task_id: task_id.to_owned(),
            agent_id: None,
            kind: ActivityKind::Status,
            summary: summary.to_owned(),
            detail: Some(if approved {
                "Task is ready to merge".to_owned()
            } else {
                "Agents are waiting for updated direction".to_owned()
            }),
            timestamp: "now".to_owned(),
        });
        Ok(())
    }

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

fn next_activity_id(snapshot: &WorkspaceSnapshot) -> String {
    format!("activity-{}", snapshot.activity.len() + 1)
}

fn task_slug(title: &str) -> String {
    let mut slug = String::new();
    let mut separated = false;
    for character in title.chars() {
        if character.is_ascii_alphanumeric() {
            slug.push(character.to_ascii_lowercase());
            separated = false;
        } else if !separated && !slug.is_empty() {
            slug.push('-');
            separated = true;
        }
    }
    slug.trim_end_matches('-').chars().take(40).collect()
}

const fn can_transition(from: AgentStatus, to: AgentStatus) -> bool {
    use AgentStatus::{Completed, Failed, Idle, Running, Starting, Waiting};

    matches!(
        (from, to),
        (Idle, Starting)
            | (Starting, Running | Failed)
            | (Running, Waiting | Completed | Failed)
            | (Waiting, Running | Completed | Failed)
            | (Completed | Failed, Starting)
    ) || from as u8 == to as u8
}

/// A rejected orchestration operation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CoreError {
    AgentNotFound(String),
    TaskNotFound(String),
    EmptyTaskTitle,
    EmptyDirection,
    InvalidTransition {
        id: String,
        from: AgentStatus,
        to: AgentStatus,
    },
}

impl fmt::Display for CoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::AgentNotFound(id) => write!(formatter, "agent not found: {id}"),
            Self::TaskNotFound(id) => write!(formatter, "task not found: {id}"),
            Self::EmptyTaskTitle => formatter.write_str("task title cannot be empty"),
            Self::EmptyDirection => formatter.write_str("direction cannot be empty"),
            Self::InvalidTransition { id, from, to } => {
                write!(formatter, "invalid transition for {id}: {from:?} -> {to:?}")
            }
        }
    }
}

impl Error for CoreError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn running_agent_can_wait_and_resume() {
        let mut workspace = Workspace::demo();

        workspace
            .transition_agent("codex-01", AgentStatus::Waiting)
            .expect("running to waiting should be valid");
        workspace
            .transition_agent("codex-01", AgentStatus::Running)
            .expect("waiting to running should be valid");

        assert_eq!(workspace.snapshot().agents[0].status, AgentStatus::Running);
    }

    #[test]
    fn running_agent_cannot_jump_back_to_idle() {
        let mut workspace = Workspace::demo();

        let error = workspace
            .transition_agent("codex-01", AgentStatus::Idle)
            .expect_err("running to idle must be rejected");

        assert!(matches!(error, CoreError::InvalidTransition { .. }));
    }

    #[test]
    fn unknown_agent_is_rejected() {
        let mut workspace = Workspace::demo();

        assert_eq!(
            workspace.transition_agent("missing", AgentStatus::Starting),
            Err(CoreError::AgentNotFound("missing".to_owned()))
        );
    }

    #[test]
    fn task_creation_selects_a_reviewable_boundary() {
        let mut workspace = Workspace::demo();

        workspace
            .create_task("Polish native window controls".to_owned())
            .expect("valid task should be created");

        let snapshot = workspace.snapshot();
        assert_eq!(snapshot.selected_task, "task-3");
        assert_eq!(
            snapshot.tasks[2].worktree,
            "axio/polish-native-window-controls"
        );
    }

    #[test]
    fn direction_and_review_are_recorded_in_the_task_narrative() {
        let mut workspace = Workspace::demo();

        workspace
            .send_direction("desktop", "Use the real Tauri window".to_owned())
            .expect("direction should be accepted");
        workspace
            .review_task("desktop", true)
            .expect("pending review should be decidable");

        let snapshot = workspace.snapshot();
        assert_eq!(snapshot.tasks[0].status, TaskStatus::Completed);
        assert_eq!(snapshot.tasks[0].review, ReviewStatus::Approved);
        assert_eq!(snapshot.activity.len(), 6);
    }
}
