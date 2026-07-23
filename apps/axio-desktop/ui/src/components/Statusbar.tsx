import type { WorkspaceSnapshot, WorkspaceTask } from "../types";

interface StatusbarProps {
  onAgents: () => void;
  onOutput: () => void;
  onWorkspace: () => void;
  snapshot: WorkspaceSnapshot;
  task: WorkspaceTask;
}

export function Statusbar({ onAgents, onOutput, onWorkspace, snapshot, task }: StatusbarProps) {
  const activeCount = snapshot.agents.filter((agent) => ["running", "waiting", "starting"].includes(agent.status)).length;
  const worktree = task.worktree.split("/").slice(1).join("/") || task.worktree;
  return (
    <footer className="statusbar">
      <button type="button" onClick={onWorkspace}><span className="health-dot"></span><span>Local engine</span></button>
      <button type="button" onClick={onWorkspace}><span className="fluent">&#xE8B7;</span><span>{worktree}</span></button>
      <span><span className="fluent">&#xE8CE;</span><span>{snapshot.branch}</span></span>
      <div className="status-spacer" data-tauri-drag-region></div>
      <button type="button" onClick={onAgents}><span className="fluent">&#xE716;</span><span>{activeCount} agents</span></button>
      <button type="button" onClick={onOutput}><span className="fluent">&#xE9D9;</span><span>5 checks passed</span></button>
      <span className="status-local">Local only</span>
    </footer>
  );
}
