import type {
  AgentSession,
  TerminalProvider,
  TerminalSessionSnapshot,
  WorkspaceActivity,
  WorkspaceSnapshot,
  WorkspaceTask,
} from "../types";

export interface AgentRuntime {
  agent: AgentSession;
  failedSessions: number;
  runningSessions: number;
  sessionCount: number;
  status: "not-started" | "running" | "stopping" | "exited" | "failed";
}

const providerForAgentKind: Record<string, TerminalProvider | undefined> = {
  claude_code: "claude_code",
  codex: "codex",
  open_code: "open_code",
};

export function sessionsForTask(sessions: TerminalSessionSnapshot[], taskId: string) {
  return sessions.filter((session) => session.task_id === taskId);
}

export function agentRuntimes(
  agents: AgentSession[],
  task: WorkspaceTask,
  sessions: TerminalSessionSnapshot[],
): AgentRuntime[] {
  const taskSessions = sessionsForTask(sessions, task.id);
  return agents
    .filter((agent) => task.agent_ids.includes(agent.id))
    .map((agent) => {
      const provider = providerForAgentKind[agent.kind];
      const agentSessions = provider
        ? taskSessions.filter((session) => session.provider === provider)
        : [];
      const runningSessions = agentSessions.filter((session) => session.status === "running").length;
      const failedSessions = agentSessions.filter((session) => session.status === "failed").length;
      const stoppingSessions = agentSessions.filter((session) => session.status === "stopping").length;
      const status = failedSessions > 0
        ? "failed"
        : runningSessions > 0
          ? "running"
          : stoppingSessions > 0
            ? "stopping"
            : agentSessions.length > 0
              ? "exited"
              : "not-started";
      return {
        agent,
        failedSessions,
        runningSessions,
        sessionCount: agentSessions.length,
        status,
      };
    });
}

export function taskActivities(snapshot: WorkspaceSnapshot, taskId: string): WorkspaceActivity[] {
  return snapshot.activity.filter((activity) => activity.task_id === taskId);
}

export function taskStateSteps(
  snapshot: WorkspaceSnapshot,
  task: WorkspaceTask,
  sessions: TerminalSessionSnapshot[],
) {
  const taskSessions = sessionsForTask(sessions, task.id);
  const running = taskSessions.filter((session) => session.status === "running").length;
  const changes = snapshot.repository?.changes.length;
  return [
    {
      label: "Repository",
      status: snapshot.repository ? snapshot.repository.branch : "Unavailable",
      state: snapshot.repository ? "done" : "",
    },
    {
      label: "Task workspace",
      status: task.worktree,
      state: "done",
    },
    {
      label: "Terminal sessions",
      status: running > 0 ? `${running} running` : taskSessions.length > 0 ? "Stopped" : "Not started",
      state: running > 0 ? "active" : taskSessions.length > 0 ? "done" : "",
    },
    {
      label: "Working tree",
      status: changes == null ? "Unavailable" : changes === 0 ? "Clean" : `${changes} changed`,
      state: changes === 0 ? "done" : changes == null ? "" : "active",
    },
    {
      label: "Review gate",
      status: task.review === "none" ? "Not requested" : task.review,
      state: task.review === "approved" ? "done" : task.review === "pending" ? "active" : "",
    },
  ];
}
