import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyTerminalExit,
  reconcileTerminalSessions,
  TerminalSessionOperationGate,
} from "../data/terminal-sessions";
import {
  closeTerminal,
  isNative,
  listenTerminalExit,
  spawnTerminalInstances,
  stopTerminal,
  terminalCapacity,
  terminalSessions,
} from "../services/tauri";
import type { TerminalProvider, TerminalSessionSnapshot } from "../types";

export function useTerminalSessions(taskId: string, onError: (message: string) => void) {
  const [sessions, setSessions] = useState<TerminalSessionSnapshot[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeCount, setActiveCount] = useState<number | null>(isNative ? null : 0);
  const [capacityStatus, setCapacityStatus] = useState<"loading" | "ready" | "error">(
    isNative ? "loading" : "ready",
  );
  const refreshVersion = useRef(0);
  const capacityVersion = useRef(0);
  const spawnPending = useRef(false);
  const sessionOperations = useRef(new TerminalSessionOperationGate());
  const [pendingSessionIds, setPendingSessionIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
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

  const refreshCapacity = useCallback(async () => {
    const version = ++capacityVersion.current;
    if (!isNative) {
      if (version === capacityVersion.current) {
        setActiveCount(0);
        setCapacityStatus("ready");
      }
      return;
    }
    setCapacityStatus((current) => current === "error" ? "loading" : current);
    try {
      const count = await terminalCapacity() ?? 0;
      if (version === capacityVersion.current) {
        setActiveCount(count);
        setCapacityStatus("ready");
      }
    } catch (error) {
      if (version === capacityVersion.current) {
        setCapacityStatus("error");
        onError(String(error));
      }
    }
  }, [onError]);

  useEffect(() => {
    setSessions([]);
    let disposed = false;
    let unlisten = () => {};
    void refreshCapacity();
    void listenTerminalExit((event) => {
      if (disposed) return;
      setSessions((current) => applyTerminalExit(current, event));
      void refreshCapacity();
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
      capacityVersion.current += 1;
      unlisten();
    };
  }, [onError, refresh, refreshCapacity]);

  const spawn = async (provider: TerminalProvider, count: number) => {
    if (spawnPending.current) return false;
    spawnPending.current = true;
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
      void refreshCapacity();
      spawnPending.current = false;
      setBusy(false);
    }
  };

  const stop = async (sessionId: string) => {
    if (!sessionOperations.current.begin(sessionId)) return;
    const operationTaskId = taskId;
    setPendingSessionIds(sessionOperations.current.snapshot());
    try {
      const updated = await stopTerminal(sessionId);
      if (updated && activeTaskId.current === operationTaskId) {
        setSessions((current) => current.map((session) => session.id === sessionId ? updated : session));
      }
    } catch (error) {
      if (activeTaskId.current === operationTaskId) onError(String(error));
    } finally {
      sessionOperations.current.finish(sessionId);
      setPendingSessionIds(sessionOperations.current.snapshot());
    }
  };

  const close = async (sessionId: string) => {
    if (!sessionOperations.current.begin(sessionId)) return;
    const operationTaskId = taskId;
    refreshVersion.current += 1;
    setPendingSessionIds(sessionOperations.current.snapshot());
    try {
      await closeTerminal(sessionId);
      if (activeTaskId.current === operationTaskId) {
        setSessions((current) => current.filter((session) => session.id !== sessionId));
      }
    } catch (error) {
      if (activeTaskId.current === operationTaskId) onError(String(error));
    } finally {
      sessionOperations.current.finish(sessionId);
      setPendingSessionIds(sessionOperations.current.snapshot());
    }
  };

  return {
    activeCount,
    busy,
    capacityStatus,
    close,
    pendingSessionIds,
    refresh,
    refreshCapacity,
    sessions,
    spawn,
    stop,
  };
}

export type TerminalSessionController = ReturnType<typeof useTerminalSessions>;
