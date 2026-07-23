import type { AgentSession, WorkspaceSnapshot, WorkspaceTask } from "../types";
import { Add20Regular, ChevronDown12Regular } from "@fluentui/react-icons";
import { panelSizeLimits } from "../hooks/usePanelSizes";
import { PanelResizeHandle } from "./PanelResizeHandle";

interface SidebarProps {
  onSelectTask: (id: string) => void;
  onTransitionAgent: (agent: AgentSession) => void;
  onResize: (width: number) => void;
  onNewTask: () => void;
  onOpenWorkspace: () => void;
  onNotify: (message: string) => void;
  onPanelChange: (panel: "tasks" | "agents") => void;
  panel: "tasks" | "agents";
  snapshot: WorkspaceSnapshot;
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

export function Sidebar({ onNewTask, onNotify, onOpenWorkspace, onPanelChange, onResize, onSelectTask, onTransitionAgent, panel, snapshot, width }: SidebarProps) {
  const activeCount = snapshot.agents.filter((agent) => ["running", "waiting", "starting"].includes(agent.status)).length;
  return (
    <aside id="sidebar" className="sidebar glass-panel">
      <PanelResizeHandle label="Resize workspace panel" side="left" min={panelSizeLimits.workspace.min} max={panelSizeLimits.workspace.max} value={width} onChange={onResize} onReset={() => onResize(panelSizeLimits.workspace.default)} />
      <header className="sidebar-header">
        <button className="workspace-switcher" type="button" onClick={onOpenWorkspace} aria-label={`Switch workspace, current workspace ${snapshot.project}`}><span className="eyebrow">Workspace</span><strong>{snapshot.project}</strong><small>{snapshot.repository?.root ?? "Open a local repository"}</small></button>
        <button id="new-task" className="icon-button" type="button" aria-label="New task" title="New task" onClick={onNewTask}><Add20Regular /></button>
      </header>
      <div className="sidebar-tabs" role="tablist" aria-label="Workspace context">
        {(["tasks", "agents"] as const).map((name) => <button key={name} className={panel === name ? "active" : ""} type="button" role="tab" aria-selected={panel === name} onClick={() => onPanelChange(name)}>{name === "tasks" ? "Tasks" : "Agents"}</button>)}
      </div>
      <section id="sidebar-tasks" className={`sidebar-panel${panel === "tasks" ? " active" : ""}`} aria-label="Tasks and worktrees">
        <div id="task-list" className="task-list" aria-live="polite">
          {snapshot.tasks.map((task) => <TaskRow key={task.id} task={task} selected={task.id === snapshot.selected_task} onSelect={() => onSelectTask(task.id)} />)}
        </div>
        <details className="context-disclosure">
          <summary><span>Worktrees</span><span>{snapshot.tasks.length + 1}</span><ChevronDown12Regular /></summary>
          <div className="worktree-list">
            {snapshot.tasks.map((task) => {
              const selected = task.id === snapshot.selected_task;
              const branch = task.worktree.split("/").slice(1).join("/") || task.worktree;
              return <button key={task.id} className={`worktree-row${selected ? " active" : ""}`} type="button" onClick={() => onSelectTask(task.id)}><span className={`branch-dot ${selected ? "cyan" : ""}`}></span><span><strong>{branch}</strong><small>{task.worktree}</small></span></button>;
            })}
            <button className="worktree-row" type="button" onClick={() => onNotify("Main is available as the primary workspace branch")}><span className="branch-dot"></span><span><strong>{snapshot.branch}</strong><small>primary branch</small></span></button>
          </div>
        </details>
      </section>
      <section id="sidebar-agents" className={`sidebar-panel${panel === "agents" ? " active" : ""}`} aria-label="Agents">
        <div className="panel-label"><span>Task agents</span><span>{activeCount} active</span></div>
        <div className="agent-list" aria-live="polite">
          {snapshot.agents.map((agent) => {
            const nextLabel = agent.status === "running" ? "Pause" : agent.status === "waiting" ? "Resume" : "Start";
            return <button key={agent.id} className={`agent-row status-${agent.status}`} type="button" aria-label={`${nextLabel} ${agent.name}, currently ${agent.status}`} onClick={() => onTransitionAgent(agent)}><i className={`agent-dot ${agent.kind === "codex" ? "cyan" : agent.kind === "claude_code" ? "amber" : "violet"}`}></i><span>{agent.name}</span><span className="agent-state"><small>{agent.status}</small><strong>{nextLabel}</strong></span></button>;
          })}
        </div>
        <div className="local-card">
          <div className="local-card-heading"><span className="health-dot"></span><strong>Local engine</strong><span>Healthy</span></div>
          <p>Agent state, worktrees, and review gates stay on this machine.</p>
          <div className="usage-row"><span>Context window used</span><strong>18%</strong></div>
          <div className="usage-meter"><i></i></div>
        </div>
      </section>
    </aside>
  );
}
