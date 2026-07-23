import type { WorkspaceTask } from "../../types";

export function PlanTool({ active, task }: { active: boolean; task: WorkspaceTask }) {
  return (
    <section className={`inspector-panel plan-panel${active ? " active" : ""}`} id="panel-plan" role="tabpanel">
      <div className="plan-heading"><div><span className="eyebrow">Read-only plan</span><strong>{task.title}</strong></div><span>4 / 6</span></div>
      <p className="plan-source">Demo task plan · state is derived from local activity</p><div className="plan-meter"><i></i></div>
      <ol><li className="done"><span>Define the product boundary</span><small>Done</small></li><li className="done"><span>Design the unified shell</span><small>Done</small></li><li className="done"><span>Connect local task state</span><small>Done</small></li><li className="done"><span>Add review gates</span><small>Done</small></li><li className="active"><span>Verify native interactions</span><small>In progress</small></li><li><span>Prepare the release</span><small>Queued</small></li></ol>
    </section>
  );
}
