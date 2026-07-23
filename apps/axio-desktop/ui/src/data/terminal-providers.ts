import type { TerminalProvider } from "../types";

export const terminalProviders = [
  { id: "codex", label: "Codex" },
  { id: "claude_code", label: "Claude Code" },
  { id: "open_code", label: "OpenCode" },
  { id: "shell", label: "Shell" },
] satisfies { id: TerminalProvider; label: string }[];

export function terminalProviderLabel(provider: TerminalProvider) {
  return terminalProviders.find((candidate) => candidate.id === provider)?.label ?? provider;
}

export function normalizeTerminalCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(8, Math.max(1, Math.trunc(value)));
}
