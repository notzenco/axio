import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLightDismiss } from "../hooks/useLightDismiss";

interface NewTaskDialogProps {
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  open: boolean;
}

interface Draft {
  agents: string[];
  prompt: string;
  repository: string;
  worktree: string;
}

const emptyDraft = (): Draft => ({
  agents: ["codex", "claude"],
  prompt: "",
  repository: "axio",
  worktree: "isolated",
});

export function NewTaskDialog({ onClose, onCreate, open }: NewTaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const discardRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [initialDraft, setInitialDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const serialized = useMemo(() => JSON.stringify(draft), [draft]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setInitialDraft(JSON.stringify(draft));
      setError("");
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) dialog.close();
  }, [draft, open]);

  useEffect(() => {
    const dialog = discardRef.current;
    if (!dialog) return;
    if (confirmOpen && !dialog.open) dialog.showModal();
    else if (!confirmOpen && dialog.open) dialog.close();
  }, [confirmOpen]);

  const requestClose = useCallback(() => {
    if (serialized !== initialDraft) setConfirmOpen(true);
    else onClose();
  }, [initialDraft, onClose, serialized]);

  useLightDismiss(dialogRef, requestClose);
  useLightDismiss(discardRef, useCallback(() => setConfirmOpen(false), []));

  const updateAgent = (agent: string, checked: boolean) => {
    setDraft((current) => ({
      ...current,
      agents: checked ? [...current.agents, agent] : current.agents.filter((candidate) => candidate !== agent),
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const title = draft.prompt.trim();
    if (!title) {
      setError("Describe the outcome before creating the task.");
      inputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onCreate(title);
      setDraft(emptyDraft());
      setError("");
      onClose();
    } catch (submissionError) {
      setError(String(submissionError));
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const discard = () => {
    setConfirmOpen(false);
    setDraft(emptyDraft());
    setError("");
    onClose();
  };

  return (
    <>
      <dialog id="new-task-dialog" className="modal" ref={dialogRef}>
        <form noValidate onSubmit={submit}>
          <header><div><span className="axio-mark">A</span><div><strong>Start a task</strong><p>Create a deliberate boundary for the work.</p></div></div><button className="icon-button fluent" type="button" onClick={requestClose} aria-label="Close">&#xE8BB;</button></header>
          <label>Outcome<textarea ref={inputRef} rows={4} placeholder="What should the agents deliver?" aria-describedby="new-task-error" aria-invalid={Boolean(error)} value={draft.prompt} onChange={(event) => { setDraft({ ...draft, prompt: event.target.value }); if (event.target.value.trim()) setError(""); }} required></textarea></label>
          <p id="new-task-error" className="field-error" role="alert" hidden={!error}>{error}</p>
          <div className="modal-grid">
            <label>Repository<select value={draft.repository} onChange={(event) => setDraft({ ...draft, repository: event.target.value })}><option value="axio">axio</option><option value="rabbitfish">rabbitfish</option></select></label>
            <label>Worktree<select value={draft.worktree} onChange={(event) => setDraft({ ...draft, worktree: event.target.value })}><option value="isolated">Create an isolated worktree</option><option value="main">Use main</option></select></label>
          </div>
          <fieldset><legend>Agents</legend>
            <label><input type="checkbox" checked={draft.agents.includes("codex")} onChange={(event) => updateAgent("codex", event.target.checked)} /><span className="agent-badge cyan">C</span> Codex</label>
            <label><input type="checkbox" checked={draft.agents.includes("claude")} onChange={(event) => updateAgent("claude", event.target.checked)} /><span className="agent-badge amber">C</span> Claude Code</label>
            <label><input type="checkbox" checked={draft.agents.includes("opencode")} onChange={(event) => updateAgent("opencode", event.target.checked)} /><span className="agent-badge violet">O</span> OpenCode</label>
          </fieldset>
          <footer><button className="secondary-button" type="button" onClick={requestClose}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>Create task</button></footer>
        </form>
      </dialog>
      <dialog id="discard-changes-dialog" className="modal confirmation-modal" aria-labelledby="discard-changes-title" aria-describedby="discard-changes-description" ref={discardRef}>
        <form method="dialog" onSubmit={(event) => event.preventDefault()}>
          <header><div><span className="fluent modal-symbol warning-symbol">&#xE7BA;</span><div><strong id="discard-changes-title">Discard changes?</strong><p>Your task setup has not been saved.</p></div></div><button className="icon-button fluent" type="button" onClick={() => setConfirmOpen(false)} aria-label="Keep editing">&#xE8BB;</button></header>
          <p id="discard-changes-description" className="confirmation-copy">If you leave now, the outcome and task options you changed will be lost.</p>
          <footer><button className="secondary-button" type="button" autoFocus onClick={() => setConfirmOpen(false)}>Keep editing</button><button className="danger-button" type="button" onClick={discard}>Discard changes</button></footer>
        </form>
      </dialog>
    </>
  );
}
