import { Checkmark12Regular } from "@fluentui/react-icons";
import type { WorkspaceTask } from "../../types";

export function PlanTool({ active, task }: { active: boolean; task: WorkspaceTask }) {
  const steps = [
    ["Define the product boundary", "Done", "done"],
    ["Design the unified shell", "Done", "done"],
    ["Connect local task state", "Done", "done"],
    ["Add review gates", "Done", "done"],
    ["Verify native interactions", "In progress", "active"],
    ["Prepare the release", "Queued", ""],
  ];
  return (
    <section className={`inspector-panel plan-panel${active ? " active" : ""}`} id="panel-plan" role="tabpanel">
      <div className="plan-heading"><div><span className="eyebrow">Read-only plan</span><strong>{task.title}</strong></div><span>4 / 6</span></div>
      <p className="plan-source">Demo task plan · state is derived from local activity</p><div className="plan-meter"><i></i></div>
      <ol>{steps.map(([label, status, state], index) => <li className={state} key={label}><i className="plan-step-marker">{state === "done" ? <Checkmark12Regular /> : index + 1}</i><span>{label}</span><small>{status}</small></li>)}</ol>
    </section>
  );
}
