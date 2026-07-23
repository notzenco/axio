use axio_protocol::{
    ActivityKind, AgentStatus, RepositorySnapshot, ReviewStatus, TaskStatus, WorkspaceActivity,
    WorkspaceSnapshot, WorkspaceTask,
};

use crate::{CoreError, lifecycle::can_transition};

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

    /// Applies live repository metadata to the shared workspace snapshot.
    pub fn attach_repository(&mut self, repository: RepositorySnapshot) {
        self.snapshot.project.clone_from(&repository.name);
        self.snapshot.branch.clone_from(&repository.branch);
        if let Some(task) = self
            .snapshot
            .tasks
            .iter_mut()
            .find(|task| task.id == self.snapshot.selected_task)
        {
            task.worktree.clone_from(&repository.name);
            task.changed_files = u32::try_from(repository.changes.len()).unwrap_or(u32::MAX);
            if task.changed_files > 0 {
                task.review = ReviewStatus::Pending;
            }
        }
        self.snapshot.repository = Some(repository);
    }

    /// Closes Axio's reference to the active repository without touching it.
    pub fn close_repository(&mut self) {
        self.snapshot.project = "No workspace".to_owned();
        self.snapshot.branch = "—".to_owned();
        self.snapshot.repository = None;
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
    pub fn send_direction(
        &mut self,
        task_id: &str,
        message: String,
        audience: String,
    ) -> Result<(), CoreError> {
        if !self.snapshot.tasks.iter().any(|task| task.id == task_id) {
            return Err(CoreError::TaskNotFound(task_id.to_owned()));
        }
        let message = message.trim();
        if message.is_empty() {
            return Err(CoreError::EmptyDirection);
        }
        let audience = audience.trim();
        let audience = if audience.is_empty() {
            "All agents"
        } else {
            audience
        };

        self.snapshot.activity.push(WorkspaceActivity {
            id: next_activity_id(&self.snapshot),
            task_id: task_id.to_owned(),
            agent_id: None,
            kind: ActivityKind::Message,
            summary: message.to_owned(),
            detail: Some(format!("Direction sent to {audience}")),
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
