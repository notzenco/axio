import type { TerminalOutputEvent } from "../types";

type TerminalOutputHandler = (event: TerminalOutputEvent) => void;

const MAX_PENDING_REPLAY_BYTES = 512 * 1024;
const MAX_PENDING_REPLAY_EVENTS = 1_024;

interface BufferedOutputEvent {
  data: number[];
  offset: number;
}

export interface TerminalReplayBatch {
  events: TerminalOutputEvent[];
  gap: boolean;
}

export interface TerminalPreviewBatch {
  byteCount: number;
  text: string;
}

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

export class TerminalReplayBuffer {
  private readonly events: BufferedOutputEvent[] = [];
  private byteLength = 0;
  private head = 0;
  private headOffset = 0;

  constructor(
    private readonly maximumBytes = MAX_PENDING_REPLAY_BYTES,
    private readonly maximumEvents = MAX_PENDING_REPLAY_EVENTS,
  ) {
    if (!Number.isInteger(maximumBytes) || maximumBytes < 1) {
      throw new RangeError("terminal replay byte limit must be a positive integer");
    }
    if (!Number.isInteger(maximumEvents) || maximumEvents < 1) {
      throw new RangeError("terminal replay event limit must be a positive integer");
    }
  }

  push(event: TerminalOutputEvent) {
    if (event.data.length === 0) return;
    this.events.push({ data: event.data, offset: event.offset });
    this.byteLength += event.data.length;
    this.trimToLimits();
  }

  drain(sessionId: string, afterOffset: number): TerminalReplayBatch {
    const events = this.events
      .slice(this.head)
      .map((event, index) => {
        const start = index === 0 ? this.headOffset : 0;
        return {
          session_id: sessionId,
          offset: event.offset + start,
          data: start === 0 ? event.data : event.data.slice(start),
        };
      })
      .sort((left, right) => left.offset - right.offset);
    this.clear();

    const replay: TerminalOutputEvent[] = [];
    let gap = false;
    let nextOffset = afterOffset;
    for (const event of events) {
      const eventEnd = event.offset + event.data.length;
      if (eventEnd <= nextOffset) continue;
      if (event.offset > nextOffset) {
        gap = true;
        nextOffset = event.offset;
      }
      const start = Math.max(0, nextOffset - event.offset);
      replay.push({
        session_id: sessionId,
        offset: event.offset + start,
        data: start === 0 ? event.data : event.data.slice(start),
      });
      nextOffset = eventEnd;
    }
    return { events: replay, gap };
  }

  private clear() {
    this.events.length = 0;
    this.byteLength = 0;
    this.head = 0;
    this.headOffset = 0;
  }

  private trimToLimits() {
    let overflow = Math.max(0, this.byteLength - this.maximumBytes);
    while (
      this.head < this.events.length
      && (overflow > 0 || this.events.length - this.head > this.maximumEvents)
    ) {
      const event = this.events[this.head];
      const available = event.data.length - this.headOffset;
      if (overflow > 0 && overflow < available && this.events.length - this.head <= this.maximumEvents) {
        this.headOffset += overflow;
        this.byteLength -= overflow;
        break;
      }
      overflow = Math.max(0, overflow - available);
      this.byteLength -= available;
      this.head += 1;
      this.headOffset = 0;
    }

    if (this.head > 1_024 && this.head * 2 > this.events.length) {
      this.events.splice(0, this.head);
      this.head = 0;
    }
  }
}

export class TerminalPreviewBuffer {
  private readonly chunks: string[] = [];
  private characterLength = 0;
  private capturedBytes = 0;
  private head = 0;
  private headOffset = 0;

  constructor(private readonly maximumCharacters: number) {
    if (!Number.isInteger(maximumCharacters) || maximumCharacters < 1) {
      throw new RangeError("terminal preview limit must be a positive integer");
    }
  }

  append(text: string, byteCount: number) {
    this.capturedBytes += byteCount;
    if (!text) return;
    this.chunks.push(text);
    this.characterLength += text.length;
    this.trimToLimit();
  }

  drain(): TerminalPreviewBatch {
    const text = this.chunks
      .slice(this.head)
      .map((chunk, index) => index === 0 ? chunk.slice(this.headOffset) : chunk)
      .join("");
    const batch = { byteCount: this.capturedBytes, text };
    this.clear();
    return batch;
  }

  private clear() {
    this.chunks.length = 0;
    this.characterLength = 0;
    this.capturedBytes = 0;
    this.head = 0;
    this.headOffset = 0;
  }

  private trimToLimit() {
    let overflow = this.characterLength - this.maximumCharacters;
    if (overflow <= 0) return;
    this.characterLength = this.maximumCharacters;

    while (overflow > 0) {
      const chunk = this.chunks[this.head];
      const available = chunk.length - this.headOffset;
      if (overflow < available) {
        this.headOffset += overflow;
        break;
      }
      overflow -= available;
      this.head += 1;
      this.headOffset = 0;
    }

    if (this.head > 1_024 && this.head * 2 > this.chunks.length) {
      this.chunks.splice(0, this.head);
      this.head = 0;
    }
  }
}

export function cleanTerminalText(value: string) {
  return value
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r(?!\n)/g, "\n")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
}
