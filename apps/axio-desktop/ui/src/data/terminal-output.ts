import type { TerminalOutputEvent } from "../types";

type TerminalOutputHandler = (event: TerminalOutputEvent) => void;

export class TerminalOutputRouter {
  private readonly handlers = new Map<string, Set<TerminalOutputHandler>>();

  subscribe(sessionId: string, handler: TerminalOutputHandler) {
    const handlers = this.handlers.get(sessionId) ?? new Set<TerminalOutputHandler>();
    handlers.add(handler);
    this.handlers.set(sessionId, handlers);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) this.handlers.delete(sessionId);
    };
  }

  dispatch(event: TerminalOutputEvent) {
    for (const handler of this.handlers.get(event.session_id) ?? []) handler(event);
  }
}

export function cleanTerminalText(value: string) {
  return value
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r(?!\n)/g, "\n")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
}
