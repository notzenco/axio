//! Shared types that cross Axio's process, persistence, or UI boundaries.

use serde::{Deserialize, Serialize};

/// A coding-agent integration understood by the workspace.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentKind {
    Codex,
    ClaudeCode,
    OpenCode,
    Pi,
    Custom(String),
}

/// The lifecycle state presented consistently by the CLI and desktop.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentStatus {
    Idle,
    Starting,
    Running,
    Waiting,
    Completed,
    Failed,
}

/// One agent process bound to a task and optional Git worktree.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AgentSession {
    pub id: String,
    pub name: String,
    pub kind: AgentKind,
    pub status: AgentStatus,
    pub task: String,
    pub worktree: Option<String>,
}

/// A serializable view of the current local workspace.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkspaceSnapshot {
    pub project: String,
    pub branch: String,
    pub agents: Vec<AgentSession>,
}
