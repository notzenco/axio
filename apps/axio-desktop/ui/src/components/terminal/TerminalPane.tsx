import { Dismiss20Regular, Stop20Regular } from "@fluentui/react-icons";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import {
  listenTerminalOutput,
  resizeTerminal,
  terminalOutput,
  writeTerminalInput,
} from "../../services/tauri";
import type { TerminalOutputEvent, TerminalSessionSnapshot } from "../../types";
import { terminalProviderLabel } from "../../data/terminal-providers";

interface TerminalPaneProps {
  onClose: (sessionId: string) => void;
  onError: (message: string) => void;
  onStop: (sessionId: string) => void;
  session: TerminalSessionSnapshot;
}

function writeOrderedEvent(terminal: Terminal, event: TerminalOutputEvent, nextOffset: { current: number }) {
  const eventEnd = event.offset + event.data.length;
  if (eventEnd <= nextOffset.current) return;
  const start = Math.max(0, nextOffset.current - event.offset);
  terminal.write(Uint8Array.from(event.data.slice(start)));
  nextOffset.current = eventEnd;
}

export function TerminalPane({ onClose, onError, onStop, session }: TerminalPaneProps) {
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
    const nextOffset = { current: 0 };
    const pending: TerminalOutputEvent[] = [];
    let replayReady = false;
    let disposed = false;
    let unlisten = () => {};
    let refreshFrame = 0;
    const refreshAfterPaint = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => {
        if (!disposed) terminal.refresh(0, terminal.rows - 1);
      });
    };

    const inputDisposable = terminal.onData((data) => {
      void writeTerminalInput(session.id, encoder.encode(data))?.catch((error) => onError(String(error)));
    });
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      const columns = Math.max(20, Math.floor(width / 7.25));
      const rows = Math.max(4, Math.floor(height / 15));
      if (terminal.cols !== columns || terminal.rows !== rows) terminal.resize(columns, rows);
      void resizeTerminal(session.id, rows, columns)?.catch(() => {});
    });
    observer.observe(container);

    void listenTerminalOutput((event) => {
      if (disposed || event.session_id !== session.id) return;
      if (!replayReady) pending.push(event);
      else writeOrderedEvent(terminal, event, nextOffset);
    }).then(async (dispose) => {
      if (disposed) {
        dispose();
        return;
      }
      unlisten = dispose;
      try {
        const replay = await terminalOutput(session.id);
        if (replay) {
          if (replay.start_offset > 0) terminal.writeln("\x1b[2m[Earlier output was trimmed]\x1b[0m");
          terminal.write(Uint8Array.from(replay.data));
          nextOffset.current = replay.end_offset;
        }
        replayReady = true;
        pending.sort((left, right) => left.offset - right.offset);
        for (const event of pending) writeOrderedEvent(terminal, event, nextOffset);
        terminal.focus();
        refreshAfterPaint();
      } catch (error) {
        onError(String(error));
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(refreshFrame);
      unlisten();
      observer.disconnect();
      container.removeEventListener("pointerdown", focusTerminal);
      inputDisposable.dispose();
      terminal.dispose();
    };
  }, [onError, session.id]);

  const running = session.status === "running";
  return (
    <article className="terminal-pane glass-surface">
      <header>
        <div>
          <span className={`terminal-state ${session.status}`}></span>
          <strong>{terminalProviderLabel(session.provider)} {session.ordinal}</strong>
          <small>{session.pid ? `PID ${session.pid}` : session.status}</small>
        </div>
        <div>
          {running || session.status === "stopping"
            ? <button type="button" disabled={!running} aria-label={`Stop ${terminalProviderLabel(session.provider)} ${session.ordinal}`} title="Stop session" onClick={() => onStop(session.id)}><Stop20Regular /></button>
            : <button type="button" aria-label={`Close ${terminalProviderLabel(session.provider)} ${session.ordinal}`} title="Close pane" onClick={() => onClose(session.id)}><Dismiss20Regular /></button>}
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
