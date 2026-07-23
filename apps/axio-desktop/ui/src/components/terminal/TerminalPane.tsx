import { Dismiss20Regular, Stop20Regular } from "@fluentui/react-icons";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import {
  resizeTerminal,
  terminalOutput,
  writeTerminalInput,
} from "../../services/tauri";
import { subscribeTerminalOutput } from "../../services/terminal-events";
import type { TerminalOutputEvent, TerminalSessionSnapshot } from "../../types";
import { TerminalInputBuffer } from "../../data/terminal-input";
import { TerminalReplayBuffer } from "../../data/terminal-output";
import { terminalProviderLabel } from "../../data/terminal-providers";
import { TerminalRenderQueue } from "../../data/terminal-rendering";
import { TerminalResizeScheduler } from "../../data/terminal-resize";

interface TerminalPaneProps {
  busy: boolean;
  onClose: (sessionId: string) => void;
  onError: (message: string) => void;
  onStop: (sessionId: string) => void;
  session: TerminalSessionSnapshot;
}

function queueOrderedEvent(
  renderer: TerminalRenderQueue,
  event: TerminalOutputEvent,
  nextOffset: { current: number },
) {
  const eventEnd = event.offset + event.data.length;
  if (eventEnd <= nextOffset.current) return;
  const start = Math.max(0, nextOffset.current - event.offset);
  renderer.push(Uint8Array.from(start === 0 ? event.data : event.data.slice(start)));
  nextOffset.current = eventEnd;
}

export function TerminalPane({ busy, onClose, onError, onStop, session }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const terminal = new Terminal({
      allowProposedApi: false,
      cursorBlink: session.status === "running",
      fontFamily: '"Cascadia Mono", "SFMono-Regular", Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.25,
      scrollback: 5000,
      theme: {
        background: "#05070b",
        foreground: "#c4cad4",
        cursor: "#b49cff",
        selectionBackground: "#6f55c955",
        black: "#151820",
        brightBlack: "#697180",
        green: "#75d68a",
        brightGreen: "#94e7a5",
        yellow: "#ffbf59",
        brightYellow: "#ffd17f",
        blue: "#7997ff",
        brightBlue: "#9eb2ff",
        magenta: "#aa8cff",
        brightMagenta: "#c0a9ff",
        cyan: "#67d9e7",
        brightCyan: "#8ce9f2",
        red: "#ff7278",
        brightRed: "#ff9297",
        white: "#c4cad4",
        brightWhite: "#f3f5f8",
      },
    });
    terminal.open(container);
    const focusTerminal = () => terminal.focus();
    container.addEventListener("pointerdown", focusTerminal);
    const encoder = new TextEncoder();
    const renderer = new TerminalRenderQueue(
      (data, complete) => terminal.write(data, complete),
      (callback) => window.requestAnimationFrame(callback),
      (frameId) => window.cancelAnimationFrame(frameId),
    );
    const nextOffset = { current: 0 };
    const pending = new TerminalReplayBuffer();
    let replayReady = false;
    let disposed = false;
    let unlisten = () => {};
    let inputTimer = 0;
    let inputWrites = Promise.resolve();
    const inputBuffer = new TerminalInputBuffer();
    const flushInput = () => {
      inputTimer = 0;
      if (disposed) return;
      for (const data of inputBuffer.drain()) {
        inputWrites = inputWrites
          .then(async () => {
            await writeTerminalInput(session.id, data);
          })
          .catch((error) => {
            if (!disposed) onError(String(error));
          });
      }
    };

    const inputDisposable = terminal.onData((data) => {
      inputBuffer.append(encoder.encode(data));
      if (!inputTimer) inputTimer = window.setTimeout(flushInput, 8);
    });
    const resizeScheduler = new TerminalResizeScheduler(({ rows, columns }) => {
      if (!disposed) void resizeTerminal(session.id, rows, columns)?.catch(() => {});
    });
    let observedRows = 0;
    let observedColumns = 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      const columns = Math.max(20, Math.floor(width / 7.25));
      const rows = Math.max(4, Math.floor(height / 15));
      if (observedColumns === columns && observedRows === rows) return;
      observedColumns = columns;
      observedRows = rows;
      if (terminal.cols !== columns || terminal.rows !== rows) terminal.resize(columns, rows);
      resizeScheduler.schedule({ rows, columns });
    });
    observer.observe(container);

    void subscribeTerminalOutput(session.id, (event) => {
      if (disposed) return;
      if (!replayReady) pending.push(event);
      else queueOrderedEvent(renderer, event, nextOffset);
    }).then(
      async (dispose) => {
        if (disposed) {
          dispose();
          return;
        }
        unlisten = dispose;
        const replay = await terminalOutput(session.id);
        if (replay) {
          if (replay.start_offset > 0) terminal.writeln("\x1b[2m[Earlier output was trimmed]\x1b[0m");
          renderer.push(Uint8Array.from(replay.data));
          nextOffset.current = replay.end_offset;
        }
        replayReady = true;
        const replayBatch = pending.drain(session.id, nextOffset.current);
        if (replayBatch.gap) renderer.markSkippedOutput();
        for (const event of replayBatch.events) queueOrderedEvent(renderer, event, nextOffset);
      },
      (error) => {
        if (!disposed) onError(String(error));
      },
    ).catch((error) => {
      if (!disposed) onError(String(error));
    });

    return () => {
      clearTimeout(inputTimer);
      flushInput();
      disposed = true;
      unlisten();
      observer.disconnect();
      resizeScheduler.dispose();
      renderer.dispose();
      container.removeEventListener("pointerdown", focusTerminal);
      inputDisposable.dispose();
      terminal.dispose();
    };
  }, [onError, session.id]);

  const running = session.status === "running";
  return (
    <article className="terminal-pane">
      <header>
        <div>
          <span className={`terminal-state ${session.status}`}></span>
          <strong>{terminalProviderLabel(session.provider)} {session.ordinal}</strong>
          <small>{session.pid ? `PID ${session.pid}` : session.status}</small>
        </div>
        <div>
          {running || session.status === "stopping"
            ? <button type="button" disabled={!running || busy} aria-label={`Stop ${terminalProviderLabel(session.provider)} ${session.ordinal}`} title={busy ? "Stopping…" : "Stop session"} onClick={() => onStop(session.id)}><Stop20Regular /></button>
            : <button type="button" disabled={busy} aria-label={`Close ${terminalProviderLabel(session.provider)} ${session.ordinal}`} title={busy ? "Closing…" : "Close pane"} onClick={() => onClose(session.id)}><Dismiss20Regular /></button>}
        </div>
      </header>
      <div className="terminal-viewport" ref={containerRef}></div>
      <footer>
        <span>{session.cwd}</span>
        <span>{session.exit_code == null ? session.status : `exit ${session.exit_code}`}</span>
      </footer>
    </article>
  );
}
