export interface TerminalDimensions {
  rows: number;
  columns: number;
}

export class TerminalResizeScheduler {
  private pending: TerminalDimensions | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly resize: (dimensions: TerminalDimensions) => void,
    private readonly delayMs = 60,
  ) {}

  schedule(dimensions: TerminalDimensions) {
    this.pending = dimensions;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  flush() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    const dimensions = this.pending;
    this.pending = undefined;
    if (dimensions) this.resize(dimensions);
  }

  dispose() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.pending = undefined;
  }
}
