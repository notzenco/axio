import { FolderOpen24Regular } from "@fluentui/react-icons";

interface EmptyWorkspaceProps {
  onOpenWorkspace: () => void;
}

export function EmptyWorkspace({ onOpenWorkspace }: EmptyWorkspaceProps) {
  return (
    <main className="task-canvas empty-workspace" aria-labelledby="empty-workspace-title">
      <div className="empty-workspace-card glass-surface">
        <span className="empty-workspace-icon"><FolderOpen24Regular /></span>
        <span className="eyebrow">Local workspace</span>
        <h1 id="empty-workspace-title">Open a Git repository to begin</h1>
        <p>Axio will inspect the repository in place. It never moves or deletes the folder.</p>
        <button className="primary-button" type="button" onClick={onOpenWorkspace}>Choose repository</button>
      </div>
    </main>
  );
}
