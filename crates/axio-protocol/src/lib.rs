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

/// The lifecycle state of a task in the desktop workspace.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Active,
    Waiting,
    Completed,
}

/// The current review decision for changes proposed by a task.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReviewStatus {
    None,
    Pending,
    Approved,
    Rejected,
}

/// One user outcome with deliberate agent and worktree boundaries.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkspaceTask {
    pub id: String,
    pub title: String,
    pub status: TaskStatus,
    pub worktree: String,
    pub agent_ids: Vec<String>,
    pub unread: u32,
    pub changed_files: u32,
    pub review: ReviewStatus,
}

/// The kind of activity displayed in a task's chronological narrative.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActivityKind {
    Message,
    Tool,
    Change,
    Approval,
    Status,
}

/// One durable-looking event in the task narrative.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkspaceActivity {
    pub id: String,
    pub task_id: String,
    pub agent_id: Option<String>,
    pub kind: ActivityKind,
    pub summary: String,
    pub detail: Option<String>,
    pub timestamp: String,
}

/// A serializable view of the current local workspace.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkspaceSnapshot {
    pub project: String,
    pub branch: String,
    pub agents: Vec<AgentSession>,
    pub tasks: Vec<WorkspaceTask>,
    pub selected_task: String,
    pub activity: Vec<WorkspaceActivity>,
}
