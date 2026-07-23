import { ArrowDownload20Regular, Checkmark20Regular } from "@fluentui/react-icons";
import type { WorkspaceTask } from "../../types";

const phases = ["Define", "Plan", "Implement", "Review", "Integrate"];

export function WorkflowPath({ task }: { task: WorkspaceTask }) {
  const reviewActive = task.review === "pending";
  return (
    <ol className="workflow-path" aria-label="Task workflow">
      {phases.map((phase, index) => {
        const complete = index < 3 || task.status === "completed";
        const active = reviewActive && index === 3;
        return (
          <li className={`${complete ? "complete" : ""}${active ? " active" : ""}`} key={phase}>
            <span className="phase-marker">{complete ? <Checkmark20Regular /> : index === 4 ? <ArrowDownload20Regular /> : <i></i>}</span>
            <span><strong>{phase}</strong><small>{complete ? "Complete" : active ? "In review" : "Pending"}</small></span>
          </li>
        );
      })}
    </ol>
  );
}
