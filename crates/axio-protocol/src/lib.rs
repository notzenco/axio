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

/// A supported interactive process that can run in Axio's terminal mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TerminalProvider {
    Shell,
    Codex,
    ClaudeCode,
    OpenCode,
}

/// The transient lifecycle of one PTY-backed terminal pane.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TerminalSessionStatus {
    Running,
    Stopping,
    Exited,
    Failed,
}

/// Public metadata for a live terminal without its output or credentials.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TerminalSessionSnapshot {
    pub id: String,
    pub provider: TerminalProvider,
    pub ordinal: u32,
    pub status: TerminalSessionStatus,
    pub task_id: String,
    pub repository_root: String,
    pub cwd: String,
    pub pid: Option<u32>,
    pub exit_code: Option<u32>,
}

/// A bounded binary chunk read from one terminal PTY.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TerminalOutputEvent {
    pub session_id: String,
    pub offset: u64,
    pub data: Vec<u8>,
}

/// A replayable bounded slice of one terminal's output stream.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TerminalOutputSnapshot {
    pub data: Vec<u8>,
    pub start_offset: u64,
    pub end_offset: u64,
}

/// The final process result for a terminal pane.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TerminalExitEvent {
    pub session_id: String,
    pub status: TerminalSessionStatus,
    pub exit_code: Option<u32>,
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

/// One changed path reported by the active Git repository.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RepositoryChange {
    pub path: String,
    pub status: String,
    pub additions: Option<u32>,
    pub deletions: Option<u32>,
}

/// A bounded, read-only view of the Git repository backing the workspace.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RepositorySnapshot {
    pub root: String,
    pub name: String,
    pub branch: String,
    pub files: Vec<String>,
    pub files_truncated: bool,
    pub changes: Vec<RepositoryChange>,
}

/// A bounded read of one text file inside the active repository.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RepositoryFileContent {
    pub path: String,
    pub content: Option<String>,
    pub size_bytes: u64,
    pub truncated: bool,
    pub binary: bool,
}

/// One repository the user has explicitly opened in Axio.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RecentWorkspace {
    pub path: String,
    pub name: String,
    pub last_opened_unix_ms: u64,
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
    pub repository: Option<RepositorySnapshot>,
}

/// Repository-scoped state restored independently from live Git metadata.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkspaceSession {
    pub agents: Vec<AgentSession>,
    pub tasks: Vec<WorkspaceTask>,
    pub selected_task: String,
    pub activity: Vec<WorkspaceActivity>,
}

impl From<&WorkspaceSnapshot> for WorkspaceSession {
    fn from(snapshot: &WorkspaceSnapshot) -> Self {
        Self {
            agents: snapshot.agents.clone(),
            tasks: snapshot.tasks.clone(),
            selected_task: snapshot.selected_task.clone(),
            activity: snapshot.activity.clone(),
        }
    }
}

/// The desktop workspace plus its durable local repository history.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorkspaceLifecycleSnapshot {
    pub workspace: WorkspaceSnapshot,
    pub recent_workspaces: Vec<RecentWorkspace>,
    pub persistence_warning: Option<String>,
}
