export const MAX_TERMINAL_INPUT_BYTES = 64 * 1024;

export class TerminalInputBuffer {
  private readonly chunks: Uint8Array[] = [];
  private length = 0;

  append(data: Uint8Array) {
    if (data.length === 0) return;
    this.chunks.push(data);
    this.length += data.length;
  }

  drain(maxBatchBytes = MAX_TERMINAL_INPUT_BYTES) {
    if (!Number.isInteger(maxBatchBytes) || maxBatchBytes < 1) {
      throw new RangeError("terminal input batch size must be a positive integer");
    }

    const batches: Uint8Array[] = [];
    let chunkIndex = 0;
    let chunkOffset = 0;
    let remaining = this.length;

    while (remaining > 0) {
      const batch = new Uint8Array(Math.min(maxBatchBytes, remaining));
      let batchOffset = 0;
      while (batchOffset < batch.length) {
        const chunk = this.chunks[chunkIndex];
        const copyLength = Math.min(chunk.length - chunkOffset, batch.length - batchOffset);
        batch.set(chunk.subarray(chunkOffset, chunkOffset + copyLength), batchOffset);
        batchOffset += copyLength;
        chunkOffset += copyLength;
        if (chunkOffset === chunk.length) {
          chunkIndex += 1;
          chunkOffset = 0;
        }
      }
      batches.push(batch);
      remaining -= batch.length;
    }

    this.chunks.length = 0;
    this.length = 0;
    return batches;
  }
}
