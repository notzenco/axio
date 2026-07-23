import { ChevronRight16Regular, DocumentMultiple20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import { activityForTask } from "../../data/activity-order";
import type { TerminalSessionSnapshot, WorkspaceSnapshot, WorkspaceTask } from "../../types";

export function RecentActivity({ onReview, onViewAll, sessions, snapshot, task }: { onReview: () => void; onViewAll: () => void; sessions: TerminalSessionSnapshot[]; snapshot: WorkspaceSnapshot; task: WorkspaceTask }) {
  const taskActivity = activityForTask(snapshot.activity, task.id).slice(-4);
  const changes = snapshot.repository?.changes ?? [];
  const running = sessions.filter((session) => session.status === "running").length;
  return (
    <section className="recent-activity-section" aria-labelledby="recent-activity-heading">
      <div className="section-heading"><h2 id="recent-activity-heading">Recent activity</h2><button type="button" onClick={onViewAll}>View all activity</button></div>
      {changes.length > 0 && <button className="activity-compact-row" type="button" onClick={onReview}><span className="activity-dot violet"></span><time>Git</time><strong>{changes.length} changed {changes.length === 1 ? "path" : "paths"}</strong><span>{changes.slice(0, 2).map((change) => change.path).join(" · ")}</span><b>Inspect</b><ChevronRight16Regular /></button>}
      {sessions.length > 0 && <button className="activity-compact-row" type="button" onClick={onViewAll}><span className="activity-dot cyan"></span><time>PTY</time><strong>{sessions.length} task terminal {sessions.length === 1 ? "session" : "sessions"}</strong><span>{running} running · {sessions.length - running} stopped or exited</span><b><WindowConsole20Regular /> Live state</b><ChevronRight16Regular /></button>}
      {taskActivity.map((activity) => (
        <button className="activity-compact-row" data-latest-activity="true" key={activity.id} type="button" onClick={onViewAll}>
          <span className="activity-dot amber"></span>
          <time>{activity.timestamp}</time>
          <strong>{activity.summary}</strong>
          <span>{activity.detail ?? "No additional detail"}</span>
          <b><DocumentMultiple20Regular />{activity.kind}</b>
          <ChevronRight16Regular />
        </button>
      ))}
      {changes.length === 0 && sessions.length === 0 && taskActivity.length === 0 && <div className="timeline-empty"><span>A</span><strong>This task is ready</strong><p>Launch a provider or send the first direction to begin.</p></div>}
    </section>
  );
}
