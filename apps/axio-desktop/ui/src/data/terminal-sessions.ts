import type {
  TerminalExitEvent,
  TerminalSessionSnapshot,
  TerminalSessionStatus,
} from "../types";

const statusRank: Record<TerminalSessionStatus, number> = {
  running: 0,
  stopping: 1,
  exited: 2,
  failed: 2,
};

export class TerminalSessionOperationGate {
  private readonly pending = new Set<string>();

  begin(sessionId: string) {
    if (this.pending.has(sessionId)) return false;
    this.pending.add(sessionId);
    return true;
  }

  finish(sessionId: string) {
    this.pending.delete(sessionId);
  }

  snapshot() {
    return new Set(this.pending);
  }
}

export function applyTerminalExit(
  sessions: TerminalSessionSnapshot[],
  event: TerminalExitEvent,
) {
  return sessions.map((session) => session.id === event.session_id
    ? { ...session, status: event.status, exit_code: event.exit_code }
    : session);
}

export function reconcileTerminalSessions(
  snapshots: TerminalSessionSnapshot[],
  current: TerminalSessionSnapshot[],
) {
  const currentById = new Map(current.map((session) => [session.id, session]));
  const snapshotIds = new Set(snapshots.map((session) => session.id));
  const reconciled = snapshots.map((snapshot) => {
    const existing = currentById.get(snapshot.id);
    if (!existing) return snapshot;
    const existingRank = statusRank[existing.status];
    const snapshotRank = statusRank[snapshot.status];
    return existingRank > snapshotRank || (existingRank === snapshotRank && existingRank >= 2)
      ? existing
      : snapshot;
  });

  for (const session of current) {
    if (!snapshotIds.has(session.id)) reconciled.push(session);
  }
  return reconciled;
}
