import { Open20Regular, WindowConsole20Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { terminalProviderLabel } from "../../data/terminal-providers";
import { cleanTerminalText, TerminalReplayBuffer } from "../../data/terminal-output";
import { listenTerminalOutput, terminalOutput } from "../../services/tauri";
import type { TerminalOutputEvent, TerminalSessionSnapshot } from "../../types";

const MAX_PREVIEW_CHARACTERS = 48_000;

function sessionLabel(session: TerminalSessionSnapshot) {
  return `${terminalProviderLabel(session.provider)} ${session.ordinal}`;
}

export function OutputTool({ active, onOpenTerminal, sessions }: { active: boolean; onOpenTerminal: () => void; sessions: TerminalSessionSnapshot[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [wrapOutput, setWrapOutput] = useState(false);
  const [text, setText] = useState("");
  const [byteCount, setByteCount] = useState(0);
  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? sessions.at(-1),
    [selectedId, sessions],
  );

  useEffect(() => {
    if (selectedSession && selectedSession.id !== selectedId) setSelectedId(selectedSession.id);
  }, [selectedId, selectedSession]);

  useEffect(() => {
    if (!active || !selectedSession) {
      setText("");
      setByteCount(0);
      return;
    }
    let disposed = false;
    let ready = false;
    let nextOffset = 0;
    let frame = 0;
    let unlisten = () => {};
    const decoder = new TextDecoder();
    const pending = new TerminalReplayBuffer();
    let pendingText = "";
    const flush = () => {
      frame = 0;
      if (!pendingText || disposed) return;
      const addition = pendingText;
      pendingText = "";
      setText((current) => cleanTerminalText(`${current}${addition}`).slice(-MAX_PREVIEW_CHARACTERS));
    };
    const append = (event: TerminalOutputEvent) => {
      const eventEnd = event.offset + event.data.length;
      if (eventEnd <= nextOffset) return;
      const start = Math.max(0, nextOffset - event.offset);
      pendingText += decoder.decode(Uint8Array.from(event.data.slice(start)), { stream: true });
      setByteCount((current) => current + event.data.length - start);
      nextOffset = eventEnd;
      if (!frame) frame = requestAnimationFrame(flush);
    };

    void listenTerminalOutput((event) => {
      if (disposed || event.session_id !== selectedSession.id) return;
      if (ready) append(event);
      else pending.push(event);
    }).then(async (dispose) => {
      if (disposed) {
        dispose();
        return;
      }
      unlisten = dispose;
      try {
        const replay = await terminalOutput(selectedSession.id);
        if (!replay || disposed) return;
        setText(cleanTerminalText(decoder.decode(Uint8Array.from(replay.data))).slice(-MAX_PREVIEW_CHARACTERS));
        setByteCount(replay.data.length);
        nextOffset = replay.end_offset;
        ready = true;
        const replayBatch = pending.drain(selectedSession.id, nextOffset);
        if (replayBatch.gap) {
          pendingText += "\n[Output skipped while replay was loading]\n";
        }
        replayBatch.events.forEach(append);
      } catch {
        if (!disposed) setText("Output is unavailable for this session.");
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      unlisten();
    };
  }, [active, selectedSession]);

  return (
    <section className={`inspector-panel terminal-panel${active ? " active" : ""}${wrapOutput ? " wrap-output" : ""}`} id="panel-output" role="tabpanel">
      {selectedSession ? <>
        <div className="terminal-toolbar">
          <span><i className={selectedSession.status === "running" ? "live" : ""}></i>{selectedSession.status}{selectedSession.exit_code == null ? "" : ` · exit ${selectedSession.exit_code}`}</span>
          <div>
            <select aria-label="Output session" value={selectedSession.id} onChange={(event) => setSelectedId(event.target.value)}>
              {sessions.map((session) => <option key={session.id} value={session.id}>{sessionLabel(session)}</option>)}
            </select>
            <button type="button" aria-pressed={wrapOutput} onClick={() => setWrapOutput(!wrapOutput)}>Wrap</button>
          </div>
        </div>
        <div className="command-record"><span>Live session · {byteCount.toLocaleString()} bytes captured</span><code>{sessionLabel(selectedSession)} · {selectedSession.cwd}</code></div>
        <pre aria-label={`${sessionLabel(selectedSession)} output`}><code>{text || "Waiting for terminal output…"}</code></pre>
      </> : <div className="output-empty">
        <WindowConsole20Regular />
        <strong>No terminal output</strong>
        <p>Launch a provider in Terminal mode. Its real task-scoped output will appear here.</p>
        <button type="button" onClick={onOpenTerminal}><Open20Regular />Open Terminal</button>
      </div>}
    </section>
  );
}
