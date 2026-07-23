export type AgentKind = "codex" | "claude_code" | "open_code" | "pi" | string;
export type AgentStatus = "idle" | "starting" | "running" | "waiting" | "completed" | "failed";
export type TaskStatus = "active" | "waiting" | "completed";
export type ReviewStatus = "none" | "pending" | "approved" | "rejected";
export type ActivityKind = "message" | "tool" | "change" | "approval" | "status";

export interface AgentSession {
  id: string;
  name: string;
  kind: AgentKind;
  status: AgentStatus;
  task: string;
  worktree?: string | null;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  status: TaskStatus;
  worktree: string;
  agent_ids: string[];
  unread: number;
  changed_files: number;
  review: ReviewStatus;
}

export interface WorkspaceActivity {
  id: string;
  task_id: string;
  agent_id: string | null;
  kind: ActivityKind;
  summary: string;
  detail?: string | null;
  timestamp: string;
}

export interface RepositoryChange {
  path: string;
  status: string;
  additions?: number | null;
  deletions?: number | null;
}

export interface RepositorySnapshot {
  root: string;
  name: string;
  branch: string;
  files: string[];
  files_truncated: boolean;
  changes: RepositoryChange[];
}

export interface WorkspaceSnapshot {
  project: string;
  branch: string;
  agents: AgentSession[];
  tasks: WorkspaceTask[];
  selected_task: string;
  activity: WorkspaceActivity[];
  repository?: RepositorySnapshot | null;
}

export type SidebarPanel = "tasks" | "agents";
export type ContextPanel = "browser" | "files" | "diff" | "terminal" | "plan";
export type WorkMode = "activity" | "canvas";
