import {
  ArrowClockwise20Regular,
  CheckmarkCircle16Regular,
  ChevronDown16Regular,
  Document20Regular,
  NoteAdd20Regular,
  Play16Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import { diffFiles, type DiffFileKey } from "../../data/diff-files";
import type { RepositorySnapshot, WorkspaceTask } from "../../types";

const checks = ["Tests", "Lint", "Typecheck", "Build", "E2E smoke"];

export function ReviewTool({ active, onDecideReview, onRefresh, repository, task }: { active: boolean; onDecideReview: (approved: boolean) => void; onRefresh: () => void; repository?: RepositorySnapshot | null; task: WorkspaceTask }) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const liveChanges = repository?.changes ?? [];
  return (
    <section className={`inspector-panel review-panel${active ? " active" : ""}`} id="panel-diff" role="tabpanel">
      <div className="review-scroll">
        <div className="review-status-row"><span><i></i> In review</span><span>Since 10:34</span><b>Needs review</b></div>
        <section className="review-section">
          <h3>Summary</h3>
          <p>{repository ? `${liveChanges.length} changed ${liveChanges.length === 1 ? "path" : "paths"} in ${repository.name} on ${repository.branch}.` : "Preview data. Launch the native desktop build to inspect real Git changes."}</p>
        </section>
        <section className="review-section">
          <h3>Related activity</h3>
          <div className="related-activity"><span className="agent-monogram cyan">C</span><span>Codex mapped the desktop boundary</span><time>10:24</time><CheckmarkCircle16Regular /></div>
          <div className="related-activity"><span className="agent-monogram amber">C</span><span>Claude Code implemented workspace</span><time>10:29</time><CheckmarkCircle16Regular /></div>
        </section>
        <section className="review-section">
          <h3>Changed files ({repository ? liveChanges.length : task.changed_files}) <ChevronDown16Regular /></h3>
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
            )) : (Object.keys(diffFiles) as DiffFileKey[]).map((key) => {
              const file = diffFiles[key];
              return (
                <button key={key} className={activeFile === key ? "active" : ""} type="button" onClick={() => setActiveFile(activeFile === key ? null : key)}>
                  <Document20Regular /><span>{file.path}</span><small><b>{file.added}</b> <em>{file.removed}</em></small>
                  {activeFile === key && <code>{file.lines.slice(0, 3).map(([, number, value]) => `${number} ${value}`).join("\n")}</code>}
                </button>
              );
            })}
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
          <p>No notes added yet. Add notes to capture context for this review.</p>
          <button type="button"><NoteAdd20Regular /> Add note</button>
        </section>
      </div>
      <footer className="review-actions">
        <button className="secondary-button refresh-review-button" type="button" onClick={onRefresh} aria-label="Refresh Git status"><ArrowClockwise20Regular /></button>
        <button className="secondary-button" type="button" disabled={task.review !== "pending"} onClick={() => onDecideReview(false)}>Return</button>
        <button className="resolve-review-button" type="button" disabled={task.review !== "pending"} onClick={() => onDecideReview(true)}><CheckmarkCircle16Regular /> Resolve review gate</button>
      </footer>
    </section>
  );
}
