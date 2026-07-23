import { Checkmark12Regular } from "@fluentui/react-icons";
import { taskStateSteps } from "../../data/task-runtime";
import type { TerminalSessionSnapshot, WorkspaceSnapshot, WorkspaceTask } from "../../types";

export function PlanTool({ active, sessions, snapshot, task }: { active: boolean; sessions: TerminalSessionSnapshot[]; snapshot: WorkspaceSnapshot; task: WorkspaceTask }) {
  const steps = taskStateSteps(snapshot, task, sessions);
  const completed = steps.filter((step) => step.state === "done").length;
  const progress = `${Math.round((completed / steps.length) * 100)}%`;
  return (
    <section className={`inspector-panel plan-panel${active ? " active" : ""}`} id="panel-plan" role="tabpanel">
      <div className="plan-heading"><div><span className="eyebrow">Live task state</span><strong>{task.title}</strong></div><span>{completed} / {steps.length}</span></div>
      <p className="plan-source">Derived from the selected repository, task, terminal sessions, and review gate.</p>
      <div className="plan-meter"><i style={{ width: progress }}></i></div>
      <ol>{steps.map(({ label, status, state }, index) => <li className={state} key={label}><i className="plan-step-marker">{state === "done" ? <Checkmark12Regular /> : index + 1}</i><span>{label}</span><small>{status}</small></li>)}</ol>
    </section>
  );
}
