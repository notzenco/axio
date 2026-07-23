export const MAX_PENDING_TERMINAL_OUTPUT_BYTES = 512 * 1024;

const skippedOutputMarker = new TextEncoder()
  .encode("\r\n\u001b[2m[Output skipped while terminal was busy]\u001b[0m\r\n");

interface OutputBatch {
  data: Uint8Array;
  trimmed: boolean;
}

class BoundedOutputBuffer {
  private readonly chunks: Uint8Array[] = [];
  private head = 0;
  private headOffset = 0;
  private length = 0;
  private trimmed = false;

  constructor(private readonly maximumBytes: number) {
    if (!Number.isInteger(maximumBytes) || maximumBytes < 1) {
      throw new RangeError("terminal output buffer size must be a positive integer");
    }
  }

  get byteLength() {
    return this.length;
  }

  append(data: Uint8Array) {
    if (data.length === 0) return;
    this.chunks.push(data);
    this.length += data.length;
    this.trimToLimit();
  }

  drain(): OutputBatch | undefined {
    if (this.length === 0) return undefined;
    const data = new Uint8Array(this.length);
    let offset = 0;
    for (let index = this.head; index < this.chunks.length; index += 1) {
      const chunk = this.chunks[index];
      const start = index === this.head ? this.headOffset : 0;
      const view = chunk.subarray(start);
      data.set(view, offset);
      offset += view.length;
    }
    const batch = { data, trimmed: this.trimmed };
    this.clear();
    return batch;
  }

  clear() {
    this.chunks.length = 0;
    this.head = 0;
    this.headOffset = 0;
    this.length = 0;
    this.trimmed = false;
  }

  private trimToLimit() {
    let overflow = this.length - this.maximumBytes;
    if (overflow <= 0) return;
    this.trimmed = true;
    this.length = this.maximumBytes;

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

type CancelFrame = (frameId: number) => void;
type ScheduleFrame = (callback: () => void) => number;
type WriteOutput = (data: Uint8Array, complete: () => void) => void;

export class TerminalRenderQueue {
  private readonly buffer: BoundedOutputBuffer;
  private disposed = false;
  private frameId = 0;
  private writing = false;

  constructor(
    private readonly write: WriteOutput,
    private readonly scheduleFrame: ScheduleFrame,
    private readonly cancelFrame: CancelFrame,
    maximumBytes = MAX_PENDING_TERMINAL_OUTPUT_BYTES,
  ) {
    this.buffer = new BoundedOutputBuffer(maximumBytes);
  }

  push(data: Uint8Array) {
    if (this.disposed || data.length === 0) return;
    this.buffer.append(data);
    this.schedule();
  }

  dispose() {
    this.disposed = true;
    if (this.frameId) this.cancelFrame(this.frameId);
    this.frameId = 0;
    this.buffer.clear();
  }

  private schedule() {
    if (this.disposed || this.writing || this.frameId || this.buffer.byteLength === 0) return;
    this.frameId = this.scheduleFrame(() => {
      this.frameId = 0;
      this.flush();
    });
  }

  private flush() {
    if (this.disposed || this.writing) return;
    const batch = this.buffer.drain();
    if (!batch) return;
    this.writing = true;
    const data = batch.trimmed ? joinBytes(skippedOutputMarker, batch.data) : batch.data;
    this.write(data, () => {
      this.writing = false;
      this.schedule();
    });
  }
}

function joinBytes(first: Uint8Array, second: Uint8Array) {
  const joined = new Uint8Array(first.length + second.length);
  joined.set(first);
  joined.set(second, first.length);
  return joined;
}
