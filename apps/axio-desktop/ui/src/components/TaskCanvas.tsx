import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Chat20Regular, ChevronDown12Regular, Folder20Regular, Send20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import type { AppSettings } from "../hooks/useSettings";
import type { WorkspaceSnapshot, WorkspaceTask } from "../types";
import type { ContextPanel } from "../types";
import { Timeline } from "./Timeline";
import { WorkspaceToolbar } from "./WorkspaceToolbar";

interface TaskCanvasProps {
  onOpenAgents: () => void;
  onOpenOutput: () => void;
  onOpenReview: () => void;
  onFocusToggle: () => void;
  onSend: (message: string, audience: string) => Promise<void>;
  onToolSelect: (panel: ContextPanel) => void;
  contextOpen: boolean;
  contextPanel: ContextPanel;
  focusMode: boolean;
  preferences: AppSettings["composer"];
  showReviewBadge: boolean;
  snapshot: WorkspaceSnapshot;
  task: WorkspaceTask;
}

export function TaskCanvas({ contextOpen, contextPanel, focusMode, onFocusToggle, onOpenAgents, onOpenOutput, onOpenReview, onSend, onToolSelect, preferences, showReviewBadge, snapshot, task }: TaskCanvasProps) {
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
    <main className="task-canvas">
      <div className="aurora aurora-one"></div><div className="aurora aurora-two"></div>
      <header className="task-header glass-surface">
        <WorkspaceToolbar contextOpen={contextOpen} focusMode={focusMode} panel={contextPanel} reviewCount={task.changed_files} reviewPending={task.review === "pending"} showReviewBadge={showReviewBadge} onFocusToggle={onFocusToggle} onToolSelect={onToolSelect} />
        <div className="task-heading">
          <div className="task-kicker"><span className="status-pulse"></span><span>{task.status === "completed" ? "Complete" : task.status === "waiting" ? "Waiting" : "In progress"}</span><span>·</span><span id="task-worktree">{task.worktree}</span></div>
          <h1>{task.title}</h1>
          <div className="presence">
            {snapshot.agents.filter((agent) => task.agent_ids.includes(agent.id)).map((agent) => <button key={agent.id} className={`presence-chip ${agent.status}`} type="button" title={`${agent.name}: ${agent.status}. Open agent controls.`} onClick={onOpenAgents}><i className={agent.kind === "codex" ? "cyan" : agent.kind === "claude_code" ? "amber" : "violet"}></i><span>{agent.name}</span></button>)}
          </div>
        </div>
      </header>
      <Timeline snapshot={snapshot} task={task} onReview={onOpenReview} />
      <form id="composer" className="composer glass-surface" onSubmit={submit}>
        <div className="composer-glow"></div>
        <div className="composer-heading"><label htmlFor="prompt">Direct the workspace</label><span>Review gates on</span></div>
        <div className="composer-context" aria-label="Direction context">
          <button id="audience-button" className="context-chip audience-button" type="button" title="Change target" onClick={() => setAudienceIndex((current) => (current + 1) % audiences.length)}><span className="presence-stack"><i></i><i></i></span><span>{audience}</span><ChevronDown12Regular /></button>
          <span className="context-chip"><Folder20Regular /><span>{worktree}</span></span>
          <span className="context-chip"><Chat20Regular /> Direction</span>
        </div>
        <textarea id="prompt" rows={2} placeholder="Ask, redirect, or start parallel work…" value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={onPromptKeyDown}></textarea>
        <div className="composer-footer">
          <button id="terminal-context" className="composer-tool" type="button" aria-label="Open command output" title="Open command output" onClick={onOpenOutput}><WindowConsole20Regular /></button>
          <span className="send-hint">{preferences.sendOnEnter ? "Enter to send · Shift Enter for a new line" : "Ctrl Enter or Send to submit"}</span>
          <button className="send-button" type="submit"><span>Send to {audience.toLowerCase()}</span><Send20Regular /></button>
        </div>
      </form>
    </main>
  );
}
