import type { TerminalProvider } from "../types";

export const terminalProviders = [
  { id: "codex", label: "Codex" },
  { id: "claude_code", label: "Claude Code" },
  { id: "open_code", label: "OpenCode" },
  { id: "shell", label: "Shell" },
] satisfies { id: TerminalProvider; label: string }[];

export const MAX_TERMINAL_SESSIONS = 12;
export const MAX_TERMINAL_SPAWN_COUNT = 8;

export function terminalProviderLabel(provider: TerminalProvider) {
  return terminalProviders.find((candidate) => candidate.id === provider)?.label ?? provider;
}

export function normalizeTerminalCount(value: number, maximum = MAX_TERMINAL_SPAWN_COUNT) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(1, maximum), Math.max(1, Math.trunc(value)));
}

export function terminalLaunchLimit(activeCount: number) {
  const normalizedActive = Number.isFinite(activeCount)
    ? Math.min(MAX_TERMINAL_SESSIONS, Math.max(0, Math.trunc(activeCount)))
    : 0;
  return Math.min(MAX_TERMINAL_SPAWN_COUNT, MAX_TERMINAL_SESSIONS - normalizedActive);
}
