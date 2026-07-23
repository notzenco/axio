import {
  ArrowClockwise20Regular,
  CheckmarkCircle16Regular,
  ChevronDown16Regular,
  Document20Regular,
  NoteAdd20Regular,
  Play16Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import { taskActivities } from "../../data/task-runtime";
import type { WorkspaceSnapshot, WorkspaceTask } from "../../types";

const checks = ["Tests", "Lint", "Typecheck", "Build", "E2E smoke"];

export function ReviewTool({ active, onDecideReview, onRefresh, snapshot, task }: { active: boolean; onDecideReview: (approved: boolean) => void; onRefresh: () => void; snapshot: WorkspaceSnapshot; task: WorkspaceTask }) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const repository = snapshot.repository;
  const liveChanges = repository?.changes ?? [];
  const relatedActivity = taskActivities(snapshot, task.id).slice(-2);
  const hasChanges = Boolean(repository && liveChanges.length > 0);
  const canResolve = task.review === "pending" && hasChanges;
  const reviewLabel = task.review === "none" ? "No review requested" : task.review;
  return (
    <section className={`inspector-panel review-panel${active ? " active" : ""}`} id="panel-diff" role="tabpanel">
      <div className="review-scroll">
        <div className="review-status-row"><span><i></i>{reviewLabel}</span><b>{repository ? `${liveChanges.length} changed` : "Repository unavailable"}</b></div>
        <section className="review-section">
          <h3>Summary</h3>
          <p>{repository ? `${liveChanges.length} changed ${liveChanges.length === 1 ? "path" : "paths"} in ${repository.name} on ${repository.branch}.` : "Launch the native desktop build and open a repository to inspect real Git changes."}</p>
        </section>
        <section className="review-section">
          <h3>Related activity</h3>
          {relatedActivity.map((activity) => <div className="related-activity" key={activity.id}><span className="agent-monogram cyan">{activity.kind.slice(0, 1).toUpperCase()}</span><span>{activity.summary}</span><time>{activity.timestamp}</time><CheckmarkCircle16Regular /></div>)}
          {relatedActivity.length === 0 && <p className="empty-tool-state">No activity has been recorded for this task.</p>}
        </section>
        <section className="review-section">
          <h3>Changed files ({repository ? liveChanges.length : "unavailable"}) <ChevronDown16Regular /></h3>
          <div className="review-file-list">
            {repository ? liveChanges.map((file) => (
              <button key={file.path} className={activeFile === file.path ? "active" : ""} type="button" onClick={() => setActiveFile(activeFile === file.path ? null : file.path)}>
                <Document20Regular /><span>{file.path}</span>
                <small>
                  <b>{file.additions == null ? "" : `+${file.additions}`}</b>
                  {" "}
                  <em>{file.deletions == null ? "" : `−${file.deletions}`}</em>
                  {file.additions == null && file.deletions == null ? file.status : ""}
                </small>
                {activeFile === file.path && <code>{file.status === "??" ? "Untracked file" : `Git status: ${file.status}`}</code>}
              </button>
            )) : <p className="empty-tool-state">Repository changes are unavailable outside the native workspace.</p>}
            {repository && liveChanges.length === 0 && <p className="empty-tool-state">Working tree is clean.</p>}
          </div>
        </section>
        <section className="review-section">
          <h3>Checks (not run) <ChevronDown16Regular /></h3>
          <div className="review-checks">
            {checks.map((check) => <span className="not-run" key={check}><CheckmarkCircle16Regular />{check}<b>Not run</b></span>)}
          </div>
          <button className="run-checks-button" type="button" disabled><span>Command execution is not connected yet</span><Play16Regular /></button>
        </section>
        <section className="review-section review-notes">
          <h3>Notes</h3>
          <p>Review notes are not connected yet.</p>
          <button type="button" disabled><NoteAdd20Regular /> Notes unavailable</button>
        </section>
      </div>
      <footer className="review-actions">
        <button className="secondary-button refresh-review-button" type="button" onClick={onRefresh} aria-label="Refresh Git status"><ArrowClockwise20Regular /></button>
        <button className="secondary-button" type="button" disabled={task.review !== "pending"} onClick={() => onDecideReview(false)}>Return</button>
        <button className="resolve-review-button" type="button" disabled={!canResolve} title={!hasChanges ? "A review can only be resolved when the repository has changes" : undefined} onClick={() => onDecideReview(true)}><CheckmarkCircle16Regular /> Resolve review gate</button>
      </footer>
    </section>
  );
}
