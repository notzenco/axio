import { WorkstreamBoard } from "./WorkstreamBoard";
import { WorkflowPath } from "./WorkflowPath";
import type { TerminalSessionSnapshot, WorkspaceSnapshot, WorkspaceTask } from "../../types";

export function CanvasOverview({ onReview, sessions, snapshot, task }: { onReview: () => void; sessions: TerminalSessionSnapshot[]; snapshot: WorkspaceSnapshot; task: WorkspaceTask }) {
  const running = sessions.filter((session) => session.status === "running").length;
  const changes = snapshot.repository?.changes.length ?? 0;
  const phase = task.review === "pending" ? "Review" : running > 0 ? "Running" : changes > 0 ? "Changes" : task.status === "completed" ? "Completed" : "Ready";
  const phaseDetail = task.review === "pending"
    ? `${changes} changed ${changes === 1 ? "path" : "paths"} need attention.`
    : running > 0
      ? `${running} terminal ${running === 1 ? "session is" : "sessions are"} active.`
      : changes > 0
        ? "Repository changes are ready to inspect."
        : "Launch a provider or send the next direction.";
  return (
    <div className="canvas-overview">
      <div className="canvas-title-row">
        <div><h1>{task.title}</h1><p>{snapshot.repository ? `${snapshot.repository.name} · ${snapshot.repository.branch}` : "Repository unavailable"} · {task.worktree}</p></div>
        <button className="current-phase" type="button" onClick={task.review === "pending" ? onReview : undefined}>
          <span className="phase-ring"></span>
          <span><small>Current state</small><strong>{phase}</strong><em>{phaseDetail}</em></span>
        </button>
      </div>
      <WorkflowPath repository={snapshot.repository} sessions={sessions} task={task} />
      <WorkstreamBoard agents={snapshot.agents} sessions={sessions} task={task} onReview={onReview} />
    </div>
  );
}
