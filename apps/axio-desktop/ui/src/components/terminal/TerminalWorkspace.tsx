import { Add20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import {
  MAX_TERMINAL_SESSIONS,
  normalizeTerminalCount,
  terminalLaunchLimit,
  terminalProviders,
} from "../../data/terminal-providers";
import type { TerminalSessionController } from "../../hooks/useTerminalSessions";
import { isNative } from "../../services/tauri";
import type { TerminalProvider, WorkspaceSnapshot, WorkspaceTask } from "../../types";
import { TerminalPane } from "./TerminalPane";

interface TerminalWorkspaceProps {
  notify: (message: string) => void;
  terminal: TerminalSessionController;
  snapshot: WorkspaceSnapshot;
  task: WorkspaceTask;
}

export function TerminalWorkspace({ notify, snapshot, task, terminal }: TerminalWorkspaceProps) {
  const [provider, setProvider] = useState<TerminalProvider>("codex");
  const [count, setCount] = useState(1);
  const {
    activeCount,
    busy,
    capacityStatus,
    close,
    refreshCapacity,
    sessions,
    spawn,
    stop,
  } = terminal;
  const launchLimit = terminalLaunchLimit(activeCount);
  const displayCount = launchLimit > 0 ? normalizeTerminalCount(count, launchLimit) : 1;
  const capacityReady = capacityStatus === "ready";

  useEffect(() => {
    if (launchLimit > 0) setCount((current) => normalizeTerminalCount(current, launchLimit));
  }, [launchLimit]);

  const launch = async () => {
    if (!capacityReady || launchLimit === 0) return;
    const normalizedCount = normalizeTerminalCount(count, launchLimit);
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
          <label><span>Provider</span><select value={provider} onChange={(event) => setProvider(event.target.value as TerminalProvider)}>{terminalProviders.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select></label>
          <label><span>Instances</span><input type="number" min="1" max={Math.max(1, launchLimit)} value={displayCount} disabled={!capacityReady || launchLimit === 0} onChange={(event) => setCount(normalizeTerminalCount(event.target.valueAsNumber, launchLimit))} /></label>
          <button className="primary-button" type="button" disabled={!isNative || busy || capacityStatus === "loading" || (capacityReady && launchLimit === 0)} onClick={() => capacityStatus === "error" ? void refreshCapacity() : void launch()}><Add20Regular />{busy ? "Launching…" : capacityStatus === "loading" ? "Checking…" : capacityStatus === "error" ? "Retry" : launchLimit === 0 ? "At capacity" : "Launch"}</button>
        </div>
      </header>
      <div className="terminal-scope-note"><strong>{task.title}</strong><span>Shared working directory: {snapshot.repository?.root}</span><span>{capacityStatus === "loading" ? "Checking app-wide capacity…" : capacityStatus === "error" ? "Capacity unavailable" : `${activeCount} of ${MAX_TERMINAL_SESSIONS} active app-wide`}</span></div>
      {sessions.length > 0
        ? <div className="terminal-grid">{sessions.map((session) => <TerminalPane key={session.id} session={session} onError={notify} onStop={(id) => void stop(id)} onClose={(id) => void close(id)} />)}</div>
        : <div className="terminal-empty"><WindowConsole20Regular /><strong>{isNative ? "No terminal sessions yet" : "Terminal mode requires the native Axio app"}</strong><p>{isNative ? "Choose a provider and launch one or more independent instances. Axio does not persist terminal output or credentials." : "The browser preview cannot start local processes."}</p></div>}
    </section>
  );
}
