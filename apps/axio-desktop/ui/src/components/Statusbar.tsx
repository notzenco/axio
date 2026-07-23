import { Bot20Regular, Branch20Regular, CheckmarkCircle20Regular, Folder20Regular } from "@fluentui/react-icons";
import type { WorkspaceSnapshot, WorkspaceTask } from "../types";

interface StatusbarProps {
  onAgents: () => void;
  onOutput: () => void;
  onReview: () => void;
  onWorkspace: () => void;
  snapshot: WorkspaceSnapshot;
  task: WorkspaceTask;
}

export function Statusbar({ onAgents, onOutput, onReview, onWorkspace, snapshot, task }: StatusbarProps) {
  const activeCount = snapshot.agents.filter((agent) => ["running", "waiting", "starting"].includes(agent.status)).length;
  const worktree = task.worktree.split("/").slice(1).join("/") || task.worktree;
  return (
    <footer className="statusbar">
      <button type="button" onClick={onWorkspace}><span className="health-dot"></span><span>Local engine</span></button>
      <button type="button" onClick={onWorkspace}><Folder20Regular /><span>{worktree}</span></button>
      <span><Branch20Regular /><span>{snapshot.branch}</span></span>
      <div className="status-spacer" data-tauri-drag-region></div>
      <button type="button" onClick={onAgents}><Bot20Regular /><span>{activeCount} agents</span></button>
      {snapshot.repository
        ? <button type="button" onClick={onReview}><CheckmarkCircle20Regular /><span>{snapshot.repository.changes.length} working tree changes</span></button>
        : <button type="button" onClick={onOutput}><CheckmarkCircle20Regular /><span>Preview checks</span></button>}
      <span className="status-local">Local only</span>
    </footer>
  );
}
