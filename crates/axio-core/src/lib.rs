//! Core workspace state and lifecycle invariants.

use std::{error::Error, fmt};

use axio_protocol::{AgentKind, AgentSession, AgentStatus, WorkspaceSnapshot};

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
        })
    }
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
}
