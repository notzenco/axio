import { useCallback, useEffect, useState } from "react";
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

  const refresh = useCallback(async () => {
    if (!isNative || !taskId) {
      setSessions([]);
      return;
    }
    try {
      setSessions(await terminalSessions(taskId) ?? []);
    } catch (error) {
      onError(String(error));
    }
  }, [onError, taskId]);

  useEffect(() => {
    setSessions([]);
    void refresh();
    let disposed = false;
    let unlisten = () => {};
    void listenTerminalExit((event) => {
      if (disposed) return;
      setSessions((current) => current.map((session) => session.id === event.session_id
        ? { ...session, status: event.status, exit_code: event.exit_code }
        : session));
    }).then((dispose) => {
      if (disposed) dispose();
      else unlisten = dispose;
    });
    return () => {
      disposed = true;
      unlisten();
    };
  }, [refresh]);

  const spawn = async (provider: TerminalProvider, count: number) => {
    setBusy(true);
    try {
      const created = await spawnTerminalInstances(provider, count, taskId);
      if (created) setSessions((current) => [...current, ...created]);
      return Boolean(created);
    } catch (error) {
      onError(String(error));
      return false;
    } finally {
      setBusy(false);
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
