import { agentRuntimes } from "../data/task-runtime";
import { terminalProviderLabel } from "../data/terminal-providers";
import type { TerminalSessionSnapshot, WorkspaceSnapshot, WorkspaceTask } from "../types";
import { Add20Regular, ChevronDown12Regular } from "@fluentui/react-icons";
import { panelSizeLimits } from "../hooks/usePanelSizes";
import { PanelResizeHandle } from "./PanelResizeHandle";

interface SidebarProps {
  onSelectTask: (id: string) => void;
  onOpenTerminal: () => void;
  onResize: (width: number) => void;
  onNewTask: () => void;
  onOpenWorkspace: () => void;
  onNotify: (message: string) => void;
  onPanelChange: (panel: "tasks" | "agents") => void;
  panel: "tasks" | "agents";
  snapshot: WorkspaceSnapshot;
  sessions: TerminalSessionSnapshot[];
  task?: WorkspaceTask;
  width: number;
}

function TaskRow({ selected, task, onSelect }: { selected: boolean; task: WorkspaceTask; onSelect: () => void }) {
  const color = task.status === "waiting" ? "amber" : task.status === "completed" ? "green" : "cyan";
  const label = task.review === "pending" ? "Review" : task.status === "completed" ? "Done" : "Active";
  return (
    <button className={`task-row${selected ? " active" : ""}`} type="button" aria-label={`${task.title}, ${task.review === "pending" ? "review required" : task.status}`} onClick={onSelect}>
      <span className={`task-state ${color}`}></span><span>{task.title}</span><b className="task-state-label">{label}</b>
    </button>
  );
}

export function Sidebar({ onNewTask, onNotify, onOpenTerminal, onOpenWorkspace, onPanelChange, onResize, onSelectTask, panel, sessions, snapshot, task, width }: SidebarProps) {
  const runtimes = task ? agentRuntimes(snapshot.agents, task, sessions) : [];
  const runtimeProviders = new Set(runtimes.map(({ agent }) => agent.kind));
  const unassignedSessions = sessions.filter((session) => !runtimeProviders.has(session.provider));
  const activeCount = sessions.filter((session) => session.status === "running").length;
  const failedCount = sessions.filter((session) => session.status === "failed").length;
  const hasWorkspace = Boolean(snapshot.repository);
  return (
    <aside id="sidebar" className="sidebar glass-panel">
      <PanelResizeHandle label="Resize workspace panel" side="left" min={panelSizeLimits.workspace.min} max={panelSizeLimits.workspace.max} value={width} onChange={onResize} onReset={() => onResize(panelSizeLimits.workspace.default)} />
      <header className="sidebar-header">
        <button className="workspace-switcher" type="button" onClick={onOpenWorkspace} aria-label={`Switch workspace, current workspace ${snapshot.project}`}><span className="eyebrow">Workspace</span><strong>{snapshot.project}</strong><small>{snapshot.repository?.root ?? "Open a local repository"}</small></button>
        <button id="new-task" className="icon-button" type="button" aria-label={hasWorkspace ? "New task" : "Open a workspace before creating a task"} title={hasWorkspace ? "New task" : "Open a workspace first"} disabled={!hasWorkspace} onClick={onNewTask}><Add20Regular /></button>
      </header>
      <div className="sidebar-tabs" role="tablist" aria-label="Workspace context">
        {(["tasks", "agents"] as const).map((name) => <button key={name} className={panel === name ? "active" : ""} type="button" role="tab" aria-selected={panel === name} onClick={() => onPanelChange(name)}>{name === "tasks" ? "Tasks" : "Agents"}</button>)}
      </div>
      <section id="sidebar-tasks" className={`sidebar-panel${panel === "tasks" ? " active" : ""}`} aria-label="Tasks and worktrees">
        <div id="task-list" className="task-list" aria-live="polite">
          {snapshot.tasks.map((task) => <TaskRow key={task.id} task={task} selected={task.id === snapshot.selected_task} onSelect={() => onSelectTask(task.id)} />)}
          {!hasWorkspace && <button className="sidebar-empty-action" type="button" onClick={onOpenWorkspace}><strong>No workspace open</strong><small>Choose a local Git repository</small></button>}
        </div>
        {hasWorkspace && <details className="context-disclosure">
          <summary><span>Worktrees</span><span>{snapshot.tasks.length + 1}</span><ChevronDown12Regular /></summary>
          <div className="worktree-list">
            {snapshot.tasks.map((task) => {
              const selected = task.id === snapshot.selected_task;
              const branch = task.worktree.split("/").slice(1).join("/") || task.worktree;
              return <button key={task.id} className={`worktree-row${selected ? " active" : ""}`} type="button" onClick={() => onSelectTask(task.id)}><span className={`branch-dot ${selected ? "cyan" : ""}`}></span><span><strong>{branch}</strong><small>{task.worktree}</small></span></button>;
            })}
            <button className="worktree-row" type="button" onClick={() => onNotify("Main is available as the primary workspace branch")}><span className="branch-dot"></span><span><strong>{snapshot.branch}</strong><small>primary branch</small></span></button>
          </div>
        </details>}
      </section>
      <section id="sidebar-agents" className={`sidebar-panel${panel === "agents" ? " active" : ""}`} aria-label="Agents">
        <div className="panel-label"><span>Configured providers</span><span>{activeCount} live</span></div>
        <div className="agent-list" aria-live="polite">
          {runtimes.map(({ agent, runningSessions, sessionCount, status }) => (
            <button key={agent.id} className={`agent-row status-${status}`} type="button" aria-label={`Open terminal for ${agent.name}, ${status}`} onClick={onOpenTerminal}>
              <i className={`agent-dot ${agent.kind === "codex" ? "cyan" : agent.kind === "claude_code" ? "amber" : "violet"}`}></i>
              <span>{agent.name}</span>
              <span className="agent-state">
                <small>{status.replace("-", " ")}</small>
                <strong>{runningSessions > 0 ? `${runningSessions} running` : sessionCount > 0 ? `${sessionCount} stopped` : "Open terminal"}</strong>
              </span>
            </button>
          ))}
          {unassignedSessions.map((session) => (
            <button key={session.id} className={`agent-row status-${session.status}`} type="button" aria-label={`Open ${terminalProviderLabel(session.provider)} ${session.ordinal}, ${session.status}`} onClick={onOpenTerminal}>
              <i className={`agent-dot ${session.provider === "codex" ? "cyan" : session.provider === "claude_code" ? "amber" : "violet"}`}></i>
              <span>{terminalProviderLabel(session.provider)} {session.ordinal}</span>
              <span className="agent-state"><small>{session.status}</small><strong>{session.pid ? `PID ${session.pid}` : "Open terminal"}</strong></span>
            </button>
          ))}
          {hasWorkspace && task && runtimes.length === 0 && sessions.length === 0 && <p className="sidebar-empty-copy">No live sessions. Launch a provider or shell in Terminal mode.</p>}
          {!hasWorkspace && <p className="sidebar-empty-copy">Agents appear after a repository is open.</p>}
        </div>
        {hasWorkspace && <div className="local-card">
          <div className="local-card-heading"><span className="health-dot"></span><strong>Terminal runtime</strong><span>{failedCount > 0 ? "Needs attention" : "Local"}</span></div>
          <p>Session status comes from the native PTY runtime. Terminal output and credentials are not persisted.</p>
          <div className="usage-row"><span>Task sessions</span><strong>{sessions.length} total · {activeCount} running</strong></div>
        </div>}
      </section>
    </aside>
  );
}
