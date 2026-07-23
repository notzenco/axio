import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyTerminalExit,
  reconcileTerminalSessions,
} from "../data/terminal-sessions";
import {
  closeTerminal,
  isNative,
  listenTerminalExit,
  spawnTerminalInstances,
  stopTerminal,
  terminalSessions,
} from "../services/tauri";
import type { TerminalProvider, TerminalSessionSnapshot } from "../types";

export function useTerminalSessions(taskId: string, onError: (message: string) => void) {
  const [sessions, setSessions] = useState<TerminalSessionSnapshot[]>([]);
  const [busy, setBusy] = useState(false);
  const refreshVersion = useRef(0);
  const activeTaskId = useRef(taskId);
  activeTaskId.current = taskId;

  const refresh = useCallback(async () => {
    const version = ++refreshVersion.current;
    if (!isNative || !taskId) {
      if (version === refreshVersion.current) setSessions([]);
      return;
    }
    try {
      const snapshots = await terminalSessions(taskId) ?? [];
      if (version === refreshVersion.current) {
        setSessions((current) => reconcileTerminalSessions(snapshots, current));
      }
    } catch (error) {
      if (version === refreshVersion.current) onError(String(error));
    }
  }, [onError, taskId]);

  useEffect(() => {
    setSessions([]);
    setBusy(false);
    let disposed = false;
    let unlisten = () => {};
    void listenTerminalExit((event) => {
      if (disposed) return;
      setSessions((current) => applyTerminalExit(current, event));
    }).then(
      (dispose) => {
        if (disposed) {
          dispose();
          return;
        }
        unlisten = dispose;
        void refresh();
      },
      (error) => {
        if (!disposed) {
          onError(String(error));
          void refresh();
        }
      },
    );
    return () => {
      disposed = true;
      refreshVersion.current += 1;
      unlisten();
    };
  }, [onError, refresh]);

  const spawn = async (provider: TerminalProvider, count: number) => {
    const spawnTaskId = taskId;
    setBusy(true);
    try {
      const created = await spawnTerminalInstances(provider, count, spawnTaskId);
      if (activeTaskId.current !== spawnTaskId) return false;
      if (created) setSessions((current) => [...current, ...created]);
      return Boolean(created);
    } catch (error) {
      if (activeTaskId.current === spawnTaskId) onError(String(error));
      return false;
    } finally {
      if (activeTaskId.current === spawnTaskId) setBusy(false);
    }
  };

  const stop = async (sessionId: string) => {
    try {
      const updated = await stopTerminal(sessionId);
      if (updated) {
        setSessions((current) => current.map((session) => session.id === sessionId ? updated : session));
      }
    } catch (error) {
      onError(String(error));
    }
  };

  const close = async (sessionId: string) => {
    try {
      await closeTerminal(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
    } catch (error) {
      onError(String(error));
    }
  };

  return { busy, close, refresh, sessions, spawn, stop };
}

export type TerminalSessionController = ReturnType<typeof useTerminalSessions>;
