use axio_protocol::{
    ActivityKind, AgentStatus, RepositorySnapshot, ReviewStatus, TaskStatus, WorkspaceActivity,
    WorkspaceSession, WorkspaceSnapshot, WorkspaceTask,
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

    /// Restores repository-scoped state and refreshes its live Git metadata.
    #[must_use]
    pub fn restore(session: WorkspaceSession, repository: RepositorySnapshot) -> Self {
        let session = normalize_legacy_preview_session(session);
        if session.tasks.is_empty() {
            return Self::for_repository(repository);
        }
        let selected_task = if session
            .tasks
            .iter()
            .any(|task| task.id == session.selected_task)
        {
            session.selected_task
        } else {
            session
                .tasks
                .first()
                .map_or_else(String::new, |task| task.id.clone())
        };
        let mut workspace = Self::new(WorkspaceSnapshot {
            project: repository.name.clone(),
            branch: repository.branch.clone(),
            agents: session.agents,
            tasks: session.tasks,
            selected_task,
            activity: session.activity,
            repository: None,
        });
        workspace.attach_repository(repository);
        workspace
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
            task.changed_files = u32::try_from(repository.changes.len()).unwrap_or(u32::MAX);
            if task.changed_files > 0 {
                task.review = ReviewStatus::Pending;
            } else if task.review == ReviewStatus::Pending {
                task.review = ReviewStatus::None;
            }
        }
        self.snapshot.repository = Some(repository);
    }

    /// Closes Axio's reference to the active repository without touching it.
    pub fn close_repository(&mut self) {
        self.snapshot.project = "No workspace".to_owned();
        self.snapshot.branch = "—".to_owned();
        self.snapshot.agents.clear();
        self.snapshot.tasks.clear();
        self.snapshot.selected_task.clear();
        self.snapshot.activity.clear();
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

    /// Creates and selects a local task boundary.
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
            summary: "Task created".to_owned(),
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
        let destination = if audience.is_empty() {
            "Task log"
        } else {
            audience
        };

        self.snapshot.activity.push(WorkspaceActivity {
            id: next_activity_id(&self.snapshot),
            task_id: task_id.to_owned(),
            agent_id: None,
            kind: ActivityKind::Message,
            summary: message.to_owned(),
            detail: Some(format!("Recorded in {destination}")),
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

fn normalize_legacy_preview_session(mut session: WorkspaceSession) -> WorkspaceSession {
    let legacy_task = |task: &WorkspaceTask| {
        (task.id == "desktop" && task.title == "Unify the Axio desktop")
            || (task.id == "protocol" && task.title == "Agent protocol refactor")
    };
    let legacy_agent = |id: &str| id == "codex-01" || id == "claude-01";
    let has_legacy_preview = session.tasks.iter().any(legacy_task)
        && session.agents.iter().any(|agent| legacy_agent(&agent.id));
    if !has_legacy_preview {
        return session;
    }

    session.tasks.retain(|task| !legacy_task(task));
    session.agents.retain(|agent| !legacy_agent(&agent.id));
    let task_ids: Vec<String> = session.tasks.iter().map(|task| task.id.clone()).collect();
    let agent_ids: Vec<String> = session
        .agents
        .iter()
        .map(|agent| agent.id.clone())
        .collect();
    for task in &mut session.tasks {
        task.agent_ids
            .retain(|agent_id| agent_ids.contains(agent_id));
    }
    session
        .activity
        .retain(|activity| task_ids.contains(&activity.task_id));
    for activity in &mut session.activity {
        if activity.summary == "Task created with an isolated worktree" {
            activity.summary = "Task created".to_owned();
        }
        if activity
            .detail
            .as_deref()
            .is_some_and(|detail| detail.starts_with("Direction sent to "))
        {
            activity.detail = Some("Recorded in Task log".to_owned());
        }
    }
    if !session
        .tasks
        .iter()
        .any(|task| task.id == session.selected_task)
    {
        session.selected_task = session
            .tasks
            .first()
            .map_or_else(String::new, |task| task.id.clone());
    }
    session
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
