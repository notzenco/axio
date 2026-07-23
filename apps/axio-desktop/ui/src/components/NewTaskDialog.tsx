import { Dismiss20Regular, Warning20Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLightDismiss } from "../hooks/useLightDismiss";

interface NewTaskDialogProps {
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  open: boolean;
}

interface Draft {
  prompt: string;
}

const emptyDraft = (): Draft => ({
  prompt: "",
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
          <header><div><span className="axio-mark">A</span><div><strong>Start a task</strong><p>Create a local task record for this repository.</p></div></div><button className="icon-button" type="button" onClick={requestClose} aria-label="Close"><Dismiss20Regular /></button></header>
          <label>Outcome<textarea ref={inputRef} rows={4} placeholder="What should this task deliver?" aria-describedby="new-task-error new-task-boundary" aria-invalid={Boolean(error)} value={draft.prompt} onChange={(event) => { setDraft({ ...draft, prompt: event.target.value }); if (event.target.value.trim()) setError(""); }} required></textarea></label>
          <p id="new-task-error" className="field-error" role="alert" hidden={!error}>{error}</p>
          <p id="new-task-boundary" className="task-boundary-note"><strong>Current boundary</strong><span>Creating a task records local activity and review state. It does not create a Git worktree or launch a provider.</span></p>
          <footer><button className="secondary-button" type="button" onClick={requestClose}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>Create task</button></footer>
        </form>
      </dialog>
      <dialog id="discard-changes-dialog" className="modal confirmation-modal" aria-labelledby="discard-changes-title" aria-describedby="discard-changes-description" ref={discardRef}>
        <form method="dialog" onSubmit={(event) => event.preventDefault()}>
          <header><div><span className="modal-symbol warning-symbol"><Warning20Regular /></span><div><strong id="discard-changes-title">Discard changes?</strong><p>Your task setup has not been saved.</p></div></div><button className="icon-button" type="button" onClick={() => setConfirmOpen(false)} aria-label="Keep editing"><Dismiss20Regular /></button></header>
          <p id="discard-changes-description" className="confirmation-copy">If you leave now, the task outcome you entered will be lost.</p>
          <footer><button className="secondary-button" type="button" autoFocus onClick={() => setConfirmOpen(false)}>Keep editing</button><button className="danger-button" type="button" onClick={discard}>Discard changes</button></footer>
        </form>
      </dialog>
    </>
  );
}
