import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Chat20Regular, ChevronDown12Regular, Folder20Regular, Send20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import type { AppSettings } from "../hooks/useSettings";
import type { WorkspaceSnapshot, WorkspaceTask } from "../types";

interface TaskComposerProps {
  onOpenTerminal: () => void;
  onSend: (message: string, audience: string) => Promise<void>;
  preferences: AppSettings["composer"];
  snapshot: WorkspaceSnapshot;
  task: WorkspaceTask;
}

export function TaskComposer({ onOpenTerminal, onSend, preferences, snapshot, task }: TaskComposerProps) {
  const [message, setMessage] = useState("");
  const [audienceIndex, setAudienceIndex] = useState(0);
  const audiences = ["All agents", ...snapshot.agents.filter((agent) => task.agent_ids.includes(agent.id)).map((agent) => agent.name)];
  const audience = audiences[audienceIndex % audiences.length];
  const worktree = task.worktree.split("/").slice(1).join("/") || task.worktree;

  useEffect(() => {
    setAudienceIndex(preferences.defaultAudience === "first-agent" && audiences.length > 1 ? 1 : 0);
  }, [preferences.defaultAudience, task.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = message.trim();
    if (!value) return;
    await onSend(value, audience);
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
      <textarea id="prompt" rows={2} placeholder="Ask, redirect, or start parallel work…" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={onPromptKeyDown}></textarea>
      <div className="composer-footer">
        <button id="audience-button" className="context-chip audience-button" type="button" title="Change target" onClick={() => setAudienceIndex((current) => (current + 1) % audiences.length)}><span className="presence-stack"><i></i><i></i></span><span>{audience}</span><ChevronDown12Regular /></button>
        <span className="context-chip"><Folder20Regular /><span>{worktree}</span></span>
        <span className="context-chip"><Chat20Regular /> Direction</span>
        <button id="terminal-context" className="composer-tool" type="button" aria-label="Open live terminal" title="Open live terminal" onClick={onOpenTerminal}><WindowConsole20Regular /></button>
        <span className="send-hint">{preferences.sendOnEnter ? "Enter to send · Shift Enter for a new line" : "Ctrl Enter or Send to submit"}</span>
        <button className="send-button" type="submit" aria-label={`Send to ${audience}`}><Send20Regular /></button>
      </div>
    </form>
  );
}
