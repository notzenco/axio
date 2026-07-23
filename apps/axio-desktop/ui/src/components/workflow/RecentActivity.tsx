import {
  Checkmark16Regular,
  ChevronDown16Regular,
  ChevronRight16Regular,
  DocumentMultiple20Regular,
  WindowConsole20Regular,
} from "@fluentui/react-icons";
import type { WorkspaceSnapshot, WorkspaceTask } from "../../types";

export function RecentActivity({ onReview, onViewAll, snapshot, task }: { onReview: () => void; onViewAll: () => void; snapshot: WorkspaceSnapshot; task: WorkspaceTask }) {
  const taskActivity = snapshot.activity.filter((activity) => activity.task_id === task.id);
  const tool = taskActivity.find((activity) => activity.kind === "tool");
  const change = taskActivity.find((activity) => activity.kind === "change");
  const directions = taskActivity.filter((activity) => activity.kind === "message").slice(-2);
  return (
    <section className="recent-activity-section" aria-labelledby="recent-activity-heading">
      <div className="section-heading"><h2 id="recent-activity-heading">Recent activity</h2><button type="button" onClick={onViewAll}>View all activity</button></div>
      <div className="activity-record">
        <button className="activity-record-heading" type="button" onClick={onReview}>
          <span className="activity-dot violet"></span><time>10:34</time><strong>Review gate: {task.worktree.split("/").at(-1)}</strong><span>Confirm changes and advance to integration.</span><b>Needs review</b><ChevronRight16Regular />
        </button>
        <details className="activity-tool-record" open>
          <summary><WindowConsole20Regular /><span><strong>Tool call: Review gate UI changes</strong><small>Automated changes from Claude Code</small></span><time>10:34</time><span><DocumentMultiple20Regular /> {task.changed_files} files changed</span><b>+84&nbsp;&nbsp;−18</b><ChevronDown16Regular /></summary>
          <div className="activity-tool-sections">
            <span><ChevronRight16Regular /> Commands <b>6 executed</b></span>
            <span><ChevronRight16Regular /> Files <b>{task.changed_files} changed</b></span>
            <span><Checkmark16Regular /> Checks <b>5 passed</b></span>
          </div>
        </details>
      </div>
      {change && <button className="activity-compact-row" type="button" onClick={onViewAll}><span className="activity-dot amber"></span><time>{change.timestamp}</time><strong>Claude Code: {change.summary.toLowerCase()}</strong><span>{change.detail}</span><b>Changes pending review</b><ChevronRight16Regular /></button>}
      {tool && <button className="activity-compact-row" type="button" onClick={onViewAll}><span className="activity-dot cyan"></span><time>{tool.timestamp}</time><strong>Codex: {tool.summary.toLowerCase()}</strong><span>{tool.detail}</span><b className="verified"><Checkmark16Regular /> Verified</b><ChevronRight16Regular /></button>}
      {directions.map((direction, index) => (
        <button
          className="activity-compact-row direction-row"
          data-latest-activity={index === directions.length - 1 ? "true" : undefined}
          key={direction.id}
          type="button"
          onClick={onViewAll}
        >
          <span className="activity-dot violet"></span>
          <time>{direction.timestamp}</time>
          <strong>{direction.detail?.replace("Direction sent to ", "You → ") ?? "You sent a direction"}</strong>
          <span>{direction.summary}</span>
          <b>Sent</b>
          <ChevronRight16Regular />
        </button>
      ))}
    </section>
  );
}
