import { ArrowRight20Regular, CheckmarkCircle20Regular, Circle20Regular } from "@fluentui/react-icons";
import type { AgentSession, WorkspaceTask } from "../../types";

const workstreamSteps: Record<string, string[]> = {
  codex: ["Context mapping", "State & routing", "UI shell & layout"],
  claude_code: ["Workspace model", "Canvas & gates", "Review integration"],
};

function Workstream({ agent }: { agent: AgentSession }) {
  const steps = workstreamSteps[agent.kind] ?? ["Understand task", "Make changes", "Verify result"];
  const color = agent.kind === "codex" ? "cyan" : agent.kind === "claude_code" ? "amber" : "violet";
  return (
    <article className={`workstream ${color}`}>
      <header>
        <span className="agent-monogram">{agent.name.slice(0, 1)}</span>
        <strong>{agent.name}</strong>
        <span className="workstream-state">{agent.status === "waiting" ? "Reviewing" : "Working"}</span>
      </header>
      <div className="workstream-flow">
        {steps.map((step, index) => (
          <div className={`workstream-step${index === steps.length - 1 && agent.status === "waiting" ? " current" : ""}`} key={step}>
            <span><strong>{step}</strong><small>{index === 2 ? "10:35" : index === 1 ? "10:28" : "10:24"}</small></span>
            {index === steps.length - 1 && agent.status === "waiting" ? <Circle20Regular /> : <CheckmarkCircle20Regular />}
            {index < steps.length - 1 && <ArrowRight20Regular className="step-arrow" />}
          </div>
        ))}
      </div>
    </article>
  );
}

export function WorkstreamBoard({ agents, onReview, task }: { agents: AgentSession[]; onReview: () => void; task: WorkspaceTask }) {
  const taskAgents = agents.filter((agent) => task.agent_ids.includes(agent.id));
  return (
    <section className="workstream-section" aria-labelledby="workstream-heading">
      <div className="section-heading"><h2 id="workstream-heading">Active workstreams</h2><span>{taskAgents.length} coordinated agents</span></div>
      <div className="workstream-convergence">
        <div className="workstream-list">{taskAgents.map((agent) => <Workstream agent={agent} key={agent.id} />)}</div>
        <button className="review-gate-node" type="button" aria-label="Open review gate" onClick={onReview}>
          <span className="review-diamond"></span>
          <strong>Review gate</strong>
          <small>{task.review === "pending" ? "In review" : "Ready"}</small>
        </button>
      </div>
      <div className="dependency-row" aria-label="Shared dependencies">
        <span className="dependency-label">Dependencies</span>
        <span>Shared Rust state <small>Codex</small></span><ArrowRight20Regular />
        <span>Task workspace UI <small>Claude Code</small></span><ArrowRight20Regular />
        <span className="review-dependency">Review gate <small>UI changes</small></span>
      </div>
    </section>
  );
}
