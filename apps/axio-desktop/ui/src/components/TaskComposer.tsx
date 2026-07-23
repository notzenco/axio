import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Chat20Regular, Folder20Regular, Send20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import type { AppSettings } from "../hooks/useSettings";
import type { WorkspaceTask } from "../types";

interface TaskComposerProps {
  onOpenTerminal: () => void;
  onSend: (message: string, audience: string) => Promise<void>;
  preferences: AppSettings["composer"];
  task: WorkspaceTask;
}

export function TaskComposer({ onOpenTerminal, onSend, preferences, task }: TaskComposerProps) {
  const [message, setMessage] = useState("");
  const worktree = task.worktree.split("/").slice(1).join("/") || task.worktree;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = message.trim();
    if (!value) return;
    await onSend(value, "Task log");
    setMessage("");
  };

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const shouldSubmit = preferences.sendOnEnter
      ? event.key === "Enter" && !event.shiftKey
      : event.key === "Enter" && (event.ctrlKey || event.metaKey);
    if (shouldSubmit) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form id="composer" className="composer glass-surface" onSubmit={submit}>
      <div className="composer-glow"></div>
      <textarea id="prompt" rows={2} placeholder="Record a direction, decision, or handoff…" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={onPromptKeyDown}></textarea>
      <div className="composer-footer">
        <span className="context-chip audience-button"><span className="presence-stack"><i></i></span><span>Task log</span></span>
        <span className="context-chip"><Folder20Regular /><span>{worktree}</span></span>
        <span className="context-chip"><Chat20Regular /> Direction</span>
        <button id="terminal-context" className="composer-tool" type="button" aria-label="Open live terminal" title="Open live terminal" onClick={onOpenTerminal}><WindowConsole20Regular /></button>
        <span className="send-hint">{preferences.sendOnEnter ? "Enter to send · Shift Enter for a new line" : "Ctrl Enter or Send to submit"}</span>
        <button className="send-button" type="submit" aria-label="Record direction in task activity"><Send20Regular /></button>
      </div>
    </form>
  );
}
