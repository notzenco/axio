import { lazy, Suspense } from "react";
import type { AppSettings } from "../hooks/useSettings";
import type { TerminalSessionController } from "../hooks/useTerminalSessions";
import type { ContextPanel, WorkMode, WorkspaceSnapshot, WorkspaceTask } from "../types";
import { CanvasOverview } from "./workflow/CanvasOverview";
import { RecentActivity } from "./workflow/RecentActivity";
import { TaskComposer } from "./TaskComposer";
import { Timeline } from "./Timeline";
import { WorkspaceToolbar } from "./WorkspaceToolbar";

const TerminalWorkspace = lazy(() => import("./terminal/TerminalWorkspace").then((module) => ({
  default: module.TerminalWorkspace,
})));

interface TaskCanvasProps {
  mode: WorkMode;
  onModeChange: (mode: WorkMode) => void;
  onOpenTerminal: () => void;
  onOpenReview: () => void;
  onSend: (message: string, audience: string) => Promise<void>;
  onToolSelect: (panel: ContextPanel) => void;
  contextOpen: boolean;
  contextPanel: ContextPanel;
  preferences: AppSettings["composer"];
  showReviewBadge: boolean;
  snapshot: WorkspaceSnapshot;
  task: WorkspaceTask;
  terminal: TerminalSessionController;
  notify: (message: string) => void;
}

export function TaskCanvas({ contextOpen, contextPanel, mode, notify, onModeChange, onOpenReview, onOpenTerminal, onSend, onToolSelect, preferences, showReviewBadge, snapshot, task, terminal }: TaskCanvasProps) {
  return (
    <main className={`task-canvas work-mode-${mode}`} data-work-mode={mode}>
      <div className="aurora aurora-one"></div><div className="aurora aurora-two"></div>
      <header className="task-header glass-surface">
        <WorkspaceToolbar contextOpen={contextOpen} mode={mode} panel={contextPanel} onModeChange={onModeChange} onToolSelect={onToolSelect} />
        {task.review === "pending" && showReviewBadge && <button className="contextual-review-button" type="button" onClick={onOpenReview}><span></span>{task.changed_files} files need review</button>}
      </header>
      <div className="work-mode-content">
        {mode === "canvas" ? (
          <>
            <CanvasOverview snapshot={snapshot} task={task} sessions={terminal.sessions} onReview={onOpenReview} />
            <RecentActivity snapshot={snapshot} task={task} sessions={terminal.sessions} onReview={onOpenReview} onViewAll={() => onModeChange("activity")} />
          </>
        ) : mode === "activity" ? (
          <section className="activity-workspace" aria-labelledby="activity-heading">
            <div className="activity-title"><div><span className="status-pulse"></span><h1 id="activity-heading">{task.title}</h1></div><p>Every decision, tool call, and review checkpoint in one durable record.</p></div>
            <Timeline snapshot={snapshot} task={task} onReview={onOpenReview} />
          </section>
        ) : <Suspense fallback={<div className="terminal-loading">Loading terminal mode…</div>}><TerminalWorkspace notify={notify} snapshot={snapshot} task={task} terminal={terminal} /></Suspense>}
      </div>
      {mode !== "terminal" && <TaskComposer task={task} preferences={preferences} onOpenTerminal={onOpenTerminal} onSend={onSend} />}
    </main>
  );
}
