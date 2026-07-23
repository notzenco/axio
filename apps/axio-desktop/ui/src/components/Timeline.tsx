import { ChevronDown16Regular, DocumentEdit20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import { activityForTask } from "../data/activity-order";
import type { AgentSession, RepositorySnapshot, WorkspaceActivity, WorkspaceSnapshot, WorkspaceTask } from "../types";

const colorFor = (agent?: AgentSession) => agent?.kind === "codex" ? "cyan" : agent?.kind === "claude_code" ? "amber" : "violet";

function ActivityDetail({ activity, onReview, repository, task }: { activity: WorkspaceActivity; onReview: () => void; repository?: RepositorySnapshot | null; task: WorkspaceTask }) {
  if (activity.kind === "tool") return (
    <details className="tool-call-disclosure" open>
      <summary><WindowConsole20Regular /><span><strong>Recorded tool event</strong><small>{activity.detail ?? "No command detail"}</small></span><b>Result unavailable</b><ChevronDown16Regular /></summary>
      <div className="tool-call-body"><span>This activity record is not linked to a live terminal result.</span><code>{activity.detail ?? "No command detail"}</code></div>
    </details>
  );
  if (activity.kind === "change") {
    const changes = repository?.changes ?? [];
    return <div className="change-summary" title={activity.detail ?? undefined}>
      <div className="change-heading"><DocumentEdit20Regular /><strong>Files changed</strong><b>{task.changed_files}</b><span className="diff-total">local worktree</span></div>
      {changes.slice(0, 3).map((change) => <div className="file-change" key={change.path}><code>{change.path}</code><span className="add">{change.additions == null ? "" : `+${change.additions}`}</span><span className="remove">{change.deletions == null ? "" : `−${change.deletions}`}</span><i className="diff-bar"></i></div>)}
      {changes.length === 0 && <div className="event-detail">{activity.detail ?? "No live repository changes are available."}</div>}
    </div>;
  }
  if (activity.kind === "approval" && task.review === "pending") return (
    <div className="approval-card"><div className="approval-icon">!</div><div><strong>{activity.summary}</strong><p>{activity.detail ?? "Review is required to continue."}</p></div><button className="approval-button" type="button" onClick={onReview}>Review changes</button></div>
  );
  return activity.detail ? <div className="event-detail">{activity.detail}</div> : null;
}

export function Timeline({ compact = false, onReview, snapshot, task }: { compact?: boolean; onReview: () => void; snapshot: WorkspaceSnapshot; task: WorkspaceTask }) {
  const allEvents = activityForTask(snapshot.activity, task.id);
  const events = compact ? allEvents.slice(-3) : allEvents;
  if (!events.length) return <section id="timeline" className="timeline" aria-label="Task activity"><div className="timeline-empty"><span>A</span><strong>This task is ready</strong><p>Send the first direction to begin the local activity narrative.</p></div></section>;
  return (
    <section id={compact ? "recent-timeline" : "timeline"} className={`timeline${compact ? " compact-timeline" : ""}`} aria-label={compact ? "Recent task activity" : "Task activity"}>
      {events.map((activity) => {
        const agent = snapshot.agents.find((candidate) => candidate.id === activity.agent_id);
        const color = colorFor(agent);
        const author = agent?.name ?? (activity.kind === "message" ? "You" : "Axio");
        return <article className={`event-card event-${activity.kind}`} key={activity.id}><div className={`timeline-node ${color}`}></div><header><span className={`agent-badge ${color}`}>{author.slice(0, 1)}</span><strong>{author}</strong><time>{activity.timestamp}</time><span className="event-kind">{activity.kind}</span></header><p>{activity.summary}</p><ActivityDetail activity={activity} repository={snapshot.repository} task={task} onReview={onReview} /></article>;
      })}
    </section>
  );
}
