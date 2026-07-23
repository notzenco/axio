import { Add20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { terminalProviders, normalizeTerminalCount } from "../../data/terminal-providers";
import { useTerminalSessions } from "../../hooks/useTerminalSessions";
import { isNative } from "../../services/tauri";
import type { TerminalProvider, WorkspaceSnapshot, WorkspaceTask } from "../../types";
import { TerminalPane } from "./TerminalPane";

interface TerminalWorkspaceProps {
  notify: (message: string) => void;
  snapshot: WorkspaceSnapshot;
  task: WorkspaceTask;
}

export function TerminalWorkspace({ notify, snapshot, task }: TerminalWorkspaceProps) {
  const [provider, setProvider] = useState<TerminalProvider>("codex");
  const [count, setCount] = useState(1);
  const { busy, close, sessions, spawn, stop } = useTerminalSessions(task.id, notify);

  const launch = async () => {
    const normalizedCount = normalizeTerminalCount(count);
    setCount(normalizedCount);
    if (await spawn(provider, normalizedCount)) {
      notify(`${normalizedCount} terminal ${normalizedCount === 1 ? "session" : "sessions"} launched`);
    }
  };

  return (
    <section className="terminal-workspace" aria-labelledby="terminal-workspace-heading">
      <header className="terminal-workspace-header">
        <div>
          <span className="terminal-workspace-icon"><WindowConsole20Regular /></span>
          <div><h1 id="terminal-workspace-heading">Terminal sessions</h1><p>Run multiple coding agents in {snapshot.repository?.name ?? snapshot.project}. Each pane owns an independent PTY.</p></div>
        </div>
        <div className="terminal-launch-controls">
          <label><span>Agent</span><select value={provider} onChange={(event) => setProvider(event.target.value as TerminalProvider)}>{terminalProviders.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select></label>
          <label><span>Instances</span><input type="number" min="1" max="8" value={count} onChange={(event) => setCount(normalizeTerminalCount(event.target.valueAsNumber))} /></label>
          <button className="primary-button" type="button" disabled={!isNative || busy} onClick={() => void launch()}><Add20Regular />{busy ? "Launching…" : "Launch"}</button>
        </div>
      </header>
      <div className="terminal-scope-note"><strong>{task.title}</strong><span>Shared working directory: {snapshot.repository?.root}</span><span>{sessions.filter((session) => session.status === "running").length} of 12 running</span></div>
      {sessions.length > 0
        ? <div className="terminal-grid">{sessions.map((session) => <TerminalPane key={session.id} session={session} onError={notify} onStop={(id) => void stop(id)} onClose={(id) => void close(id)} />)}</div>
        : <div className="terminal-empty"><WindowConsole20Regular /><strong>{isNative ? "No terminal sessions yet" : "Terminal mode requires the native Axio app"}</strong><p>{isNative ? "Choose an agent and launch one or more independent instances. Axio does not persist terminal output or credentials." : "The browser preview cannot start local processes."}</p></div>}
    </section>
  );
}
