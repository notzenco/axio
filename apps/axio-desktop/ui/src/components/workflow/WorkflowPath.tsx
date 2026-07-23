import { ArrowDownload20Regular, Checkmark20Regular } from "@fluentui/react-icons";
import type { RepositorySnapshot, TerminalSessionSnapshot, WorkspaceTask } from "../../types";

export function WorkflowPath({ repository, sessions, task }: { repository?: RepositorySnapshot | null; sessions: TerminalSessionSnapshot[]; task: WorkspaceTask }) {
  const running = sessions.some((session) => session.status === "running");
  const hasSessions = sessions.length > 0;
  const changes = repository?.changes.length ?? 0;
  const phases = [
    { label: "Workspace", complete: Boolean(repository), active: false, status: repository ? "Connected" : "Unavailable" },
    { label: "Sessions", complete: hasSessions && !running, active: running, status: running ? "Running" : hasSessions ? "Stopped" : "Not started" },
    { label: "Changes", complete: changes === 0 && hasSessions, active: changes > 0, status: changes > 0 ? `${changes} changed` : "Clean" },
    { label: "Review", complete: task.review === "approved", active: task.review === "pending", status: task.review === "none" ? "Not requested" : task.review },
    { label: "Task", complete: task.status === "completed", active: task.status === "active" && !running && task.review !== "pending", status: task.status },
  ];
  return (
    <ol className="workflow-path" aria-label="Live task state">
      {phases.map((phase, index) => (
        <li className={`${phase.complete ? "complete" : ""}${phase.active ? " active" : ""}`} key={phase.label}>
          <span className="phase-marker">{phase.complete ? <Checkmark20Regular /> : index === phases.length - 1 ? <ArrowDownload20Regular /> : <i></i>}</span>
          <span><strong>{phase.label}</strong><small>{phase.status}</small></span>
        </li>
      ))}
    </ol>
  );
}
