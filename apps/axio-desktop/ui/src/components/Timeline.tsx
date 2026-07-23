import { Checkmark16Regular, ChevronDown16Regular, DocumentEdit20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import { activityForTask } from "../data/activity-order";
import type { AgentSession, WorkspaceActivity, WorkspaceSnapshot, WorkspaceTask } from "../types";

const colorFor = (agent?: AgentSession) => agent?.kind === "codex" ? "cyan" : agent?.kind === "claude_code" ? "amber" : "violet";

function ActivityDetail({ activity, onReview, task }: { activity: WorkspaceActivity; onReview: () => void; task: WorkspaceTask }) {
  if (activity.kind === "tool") return (
    <details className="tool-call-disclosure" open>
      <summary><WindowConsole20Regular /><span><strong>Tool call</strong><small>{activity.detail ?? "Local command"}</small></span><b><Checkmark16Regular /> Verified</b><ChevronDown16Regular /></summary>
      <div className="tool-call-body"><span>Command completed successfully in the local worktree.</span><code>{activity.detail ?? "Local command"}</code></div>
    </details>
  );
  if (activity.kind === "change") return (
    <div className="change-summary" title={activity.detail ?? undefined}>
      <div className="change-heading"><DocumentEdit20Regular /><strong>Files changed</strong><b>{task.changed_files}</b><span className="diff-total">local worktree</span></div>
      {["ui/src/App.tsx", "ui/src/components/TaskCanvas.tsx", "ui/styles/task.css"].slice(0, Math.max(1, task.changed_files)).map((path) => <div className="file-change" key={path}><code>{path}</code><span className="add">+</span><span className="remove">−</span><i className="diff-bar"></i></div>)}
    </div>
  );
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
        return <article className={`event-card event-${activity.kind}`} key={activity.id}><div className={`timeline-node ${color}`}></div><header><span className={`agent-badge ${color}`}>{author.slice(0, 1)}</span><strong>{author}</strong><time>{activity.timestamp}</time><span className="event-kind">{activity.kind}</span></header><p>{activity.summary}</p><ActivityDetail activity={activity} task={task} onReview={onReview} /></article>;
      })}
    </section>
  );
}
