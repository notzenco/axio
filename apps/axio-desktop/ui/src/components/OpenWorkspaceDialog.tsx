import { Dismiss20Regular, FolderOpen20Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { RecentWorkspace } from "../types";
import { useLightDismiss } from "../hooks/useLightDismiss";

interface OpenWorkspaceDialogProps {
  activePath?: string;
  onBrowse: () => Promise<string | null>;
  onClose: () => void;
  onCloseWorkspace: () => Promise<void>;
  onOpen: (path: string) => Promise<void>;
  onRemove: (path: string) => Promise<void>;
  open: boolean;
  recentWorkspaces: RecentWorkspace[];
}

export function OpenWorkspaceDialog({
  activePath,
  onBrowse,
  onClose,
  onCloseWorkspace,
  onOpen,
  onRemove,
  open,
  recentWorkspaces,
}: OpenWorkspaceDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setPath("");
      setError("");
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  useLightDismiss(dialogRef, useCallback(onClose, [onClose]));

  const openPath = async (selectedPath: string) => {
    setSubmitting(true);
    setError("");
    try {
      await onOpen(selectedPath);
      onClose();
    } catch (openError) {
      setError(String(openError));
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const selectedPath = path.trim();
    if (!selectedPath) {
      setError("Choose a Git repository folder.");
      return;
    }
    await openPath(selectedPath);
  };

  const browse = async () => {
    setSubmitting(true);
    setError("");
    try {
      const selectedPath = await onBrowse();
      if (selectedPath) await openPath(selectedPath);
    } catch (browseError) {
      setError(String(browseError));
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog className="modal workspace-modal" aria-labelledby="workspace-dialog-title" ref={dialogRef}>
      <form noValidate onSubmit={submit}>
        <header>
          <div><span className="modal-symbol"><FolderOpen20Regular /></span><div><strong id="workspace-dialog-title">Open workspace</strong><p>Choose a local Git repository. Axio never moves or deletes it.</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close workspace picker"><Dismiss20Regular /></button>
        </header>
        <label className="workspace-path-field">
          Repository folder
          <input ref={inputRef} value={path} onChange={(event) => { setPath(event.target.value); setError(""); }} placeholder="C:\Projects\my-repository" aria-invalid={Boolean(error)} />
        </label>
        <p className="field-error" role="alert" hidden={!error}>{error}</p>
        <footer><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="secondary-button" type="button" disabled={submitting} onClick={() => void browse()}>Browse…</button><button className="primary-button" type="submit" disabled={submitting}>Open path</button></footer>
        <section className="recent-workspaces" aria-labelledby="recent-workspaces-label">
          <div className="panel-label"><span id="recent-workspaces-label">Recent workspaces</span><span>{recentWorkspaces.length}</span></div>
          {recentWorkspaces.length === 0
            ? <p className="workspace-empty">Repositories you open will appear here.</p>
            : recentWorkspaces.map((workspace) => (
              <div className={`recent-workspace-row${workspace.path === activePath ? " active" : ""}`} key={workspace.path}>
                <button type="button" onClick={() => void openPath(workspace.path)} disabled={submitting}>
                  <strong>{workspace.name}</strong>
                  <small>{workspace.path}</small>
                </button>
                <button className="quiet-button" type="button" aria-label={`Remove ${workspace.name} from recents`} onClick={() => void onRemove(workspace.path)}>Remove</button>
              </div>
            ))}
        </section>
        {activePath && <div className="workspace-close-row"><span><strong>Close current workspace</strong><small>The repository stays untouched on disk.</small></span><button className="secondary-button" type="button" onClick={() => void onCloseWorkspace()}>Close workspace</button></div>}
      </form>
    </dialog>
  );
}
