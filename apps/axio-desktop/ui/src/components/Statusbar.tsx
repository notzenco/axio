import { Bot20Regular, Branch20Regular, CheckmarkCircle20Regular, Folder20Regular } from "@fluentui/react-icons";
import type { TerminalSessionSnapshot, WorkspaceSnapshot, WorkspaceTask } from "../types";

interface StatusbarProps {
  onAgents: () => void;
  onOutput: () => void;
  onReview: () => void;
  onWorkspace: () => void;
  snapshot: WorkspaceSnapshot;
  sessions: TerminalSessionSnapshot[];
  task?: WorkspaceTask;
}

export function Statusbar({ onAgents, onOutput, onReview, onWorkspace, sessions, snapshot, task }: StatusbarProps) {
  const activeCount = sessions.filter((session) => session.status === "running").length;
  const worktree = task ? task.worktree.split("/").slice(1).join("/") || task.worktree : "No workspace";
  return (
    <footer className="statusbar">
      <button type="button" onClick={onWorkspace}><span className="health-dot"></span><span>{task ? "Local engine" : "Open workspace"}</span></button>
      <button type="button" onClick={onWorkspace}><Folder20Regular /><span>{worktree}</span></button>
      <span><Branch20Regular /><span>{snapshot.branch}</span></span>
      <div className="status-spacer" data-tauri-drag-region></div>
      {task && <button type="button" onClick={onAgents}><Bot20Regular /><span>{activeCount} live {activeCount === 1 ? "session" : "sessions"}</span></button>}
      {task && (snapshot.repository
        ? <button type="button" onClick={onReview}><CheckmarkCircle20Regular /><span>{snapshot.repository.changes.length} working tree changes</span></button>
        : <button type="button" onClick={onOutput}><CheckmarkCircle20Regular /><span>Preview checks</span></button>)}
      <span className="status-local">Local only</span>
    </footer>
  );
}
