import { WorkstreamBoard } from "./WorkstreamBoard";
import { WorkflowPath } from "./WorkflowPath";
import type { WorkspaceSnapshot, WorkspaceTask } from "../../types";

export function CanvasOverview({ onReview, snapshot, task }: { onReview: () => void; snapshot: WorkspaceSnapshot; task: WorkspaceTask }) {
  return (
    <div className="canvas-overview">
      <div className="canvas-title-row">
        <div><h1>{task.title}</h1><p>Deliver a unified task workspace with review gates and agent orchestration.</p></div>
        <button className="current-phase" type="button" onClick={onReview}>
          <span className="phase-ring"></span>
          <span><small>Current phase</small><strong>Review</strong><em>Review changes and resolve gate.</em></span>
        </button>
      </div>
      <WorkflowPath task={task} />
      <WorkstreamBoard agents={snapshot.agents} task={task} onReview={onReview} />
    </div>
  );
}
