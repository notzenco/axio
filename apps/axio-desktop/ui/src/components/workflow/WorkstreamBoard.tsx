import { ArrowRight20Regular, Circle20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import { agentRuntimes } from "../../data/task-runtime";
import { terminalProviderLabel } from "../../data/terminal-providers";
import type { AgentSession, TerminalSessionSnapshot, WorkspaceTask } from "../../types";

export function WorkstreamBoard({ agents, onReview, sessions, task }: { agents: AgentSession[]; onReview: () => void; sessions: TerminalSessionSnapshot[]; task: WorkspaceTask }) {
  const runtimes = agentRuntimes(agents, task, sessions);
  const assignedProviders = new Set(runtimes.map(({ agent }) => agent.kind));
  const unassignedSessions = sessions.filter((session) => !assignedProviders.has(session.provider));
  const streamCount = runtimes.length + unassignedSessions.length;
  return (
    <section className="workstream-section" aria-labelledby="workstream-heading">
      <div className="section-heading"><h2 id="workstream-heading">Task runtimes</h2><span>{sessions.filter((session) => session.status === "running").length} live · {sessions.length} total</span></div>
      <div className="workstream-convergence">
        <div className="workstream-list">
          {runtimes.map(({ agent, runningSessions, sessionCount, status }) => {
            const color = agent.kind === "codex" ? "cyan" : agent.kind === "claude_code" ? "amber" : "violet";
            return <article className={`workstream ${color}`} key={agent.id}>
              <header><span className="agent-monogram">{agent.name.slice(0, 1)}</span><strong>{agent.name}</strong><span className="workstream-state">{status.replace("-", " ")}</span></header>
              <div className="runtime-facts">
                <span><WindowConsole20Regular /><strong>{runningSessions}</strong><small>running</small></span>
                <span><Circle20Regular /><strong>{sessionCount}</strong><small>task sessions</small></span>
                <span><strong>{task.worktree}</strong><small>task boundary</small></span>
              </div>
            </article>;
          })}
          {unassignedSessions.map((session) => <article className="workstream violet" key={session.id}>
            <header><span className="agent-monogram">{terminalProviderLabel(session.provider).slice(0, 1)}</span><strong>{terminalProviderLabel(session.provider)} {session.ordinal}</strong><span className="workstream-state">{session.status}</span></header>
            <div className="runtime-facts"><span><WindowConsole20Regular /><strong>{session.pid ?? "—"}</strong><small>process ID</small></span><span><strong>{session.cwd}</strong><small>working directory</small></span></div>
          </article>)}
          {streamCount === 0 && <div className="workstream-empty"><WindowConsole20Regular /><strong>No task runtimes yet</strong><p>Open Terminal mode to launch a coding provider or shell.</p></div>}
        </div>
        <button className="review-gate-node" type="button" aria-label="Open review gate" onClick={onReview}>
          <span className="review-diamond"></span>
          <strong>Review gate</strong>
          <small>{task.review === "pending" ? "Needs attention" : task.review === "none" ? "Not requested" : task.review}</small>
        </button>
      </div>
      <div className="dependency-row" aria-label="Runtime relationship">
        <span className="dependency-label">Live relationship</span>
        <span>Terminal sessions <small>{sessions.length} task-scoped</small></span><ArrowRight20Regular />
        <span>Repository <small>{task.changed_files} changed</small></span><ArrowRight20Regular />
        <span className="review-dependency">Review gate <small>{task.review}</small></span>
      </div>
    </section>
  );
}
