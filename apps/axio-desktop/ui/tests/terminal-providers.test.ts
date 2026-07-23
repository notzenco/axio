import { describe, expect, test } from "bun:test";
import {
  MAX_TERMINAL_INPUT_BYTES,
  TerminalInputBuffer,
} from "../src/data/terminal-input";
import {
  normalizeTerminalCount,
  terminalLaunchLimit,
  terminalProviderLabel,
} from "../src/data/terminal-providers";
import { TerminalResizeScheduler } from "../src/data/terminal-resize";

describe("terminal provider controls", () => {
  test("normalizes instance counts to the supported batch boundary", () => {
    expect(normalizeTerminalCount(Number.NaN)).toBe(1);
    expect(normalizeTerminalCount(0)).toBe(1);
    expect(normalizeTerminalCount(3.9)).toBe(3);
    expect(normalizeTerminalCount(12)).toBe(8);
    expect(normalizeTerminalCount(8, 3)).toBe(3);
  });

  test("derives launch limits from app-wide active capacity", () => {
    expect(terminalLaunchLimit(Number.NaN)).toBe(8);
    expect(terminalLaunchLimit(-1)).toBe(8);
    expect(terminalLaunchLimit(0)).toBe(8);
    expect(terminalLaunchLimit(7)).toBe(5);
    expect(terminalLaunchLimit(11)).toBe(1);
    expect(terminalLaunchLimit(12)).toBe(0);
    expect(terminalLaunchLimit(99)).toBe(0);
  });

  test("keeps launch batches within capacity under sustained transitions", () => {
    let invalid = 0;
    let atCapacity = 0;

    for (let transition = 0; transition < 2_400_000; transition += 1) {
      const active = transition % 13;
      const limit = terminalLaunchLimit(active);
      if (limit === 0) {
        atCapacity += 1;
        continue;
      }
      const selected = normalizeTerminalCount((transition % 8) + 1, limit);
      if (selected < 1 || selected > limit || active + selected > 12) invalid += 1;
    }

    expect(invalid).toBe(0);
    expect(atCapacity).toBeGreaterThan(0);
  });

  test("uses human-readable provider labels", () => {
    expect(terminalProviderLabel("claude_code")).toBe("Claude Code");
    expect(terminalProviderLabel("open_code")).toBe("OpenCode");
  });

  test("coalesces resize storms across the full session limit", () => {
    const delivered = Array.from({ length: 12 }, () => [] as Array<{ rows: number; columns: number }>);
    const schedulers = delivered.map((requests) => new TerminalResizeScheduler(
      (dimensions) => requests.push(dimensions),
      60_000,
    ));

    for (let update = 0; update < 1_000; update += 1) {
      schedulers.forEach((scheduler, session) => {
        scheduler.schedule({ rows: 20 + update, columns: 80 + update + session });
      });
    }
    schedulers.forEach((scheduler) => scheduler.flush());

    expect(delivered.flat()).toHaveLength(12);
    delivered.forEach((requests, session) => {
      expect(requests).toEqual([{ rows: 1_019, columns: 1_079 + session }]);
    });
    schedulers.forEach((scheduler) => scheduler.schedule({ rows: 24, columns: 80 }));
    schedulers.forEach((scheduler) => scheduler.dispose());
    schedulers.forEach((scheduler) => scheduler.flush());
    expect(delivered.flat()).toHaveLength(12);
  });

  test("preserves multi-megabyte pastes in bounded batches across 12 sessions", () => {
    const inputLength = (2 * 1024 * 1024) + 17;
    const input = Uint8Array.from({ length: inputLength }, (_, index) => index % 251);

    for (let session = 0; session < 12; session += 1) {
      const buffer = new TerminalInputBuffer();
      const firstBoundary = 131_071 + session;
      buffer.append(input.subarray(0, firstBoundary));
      buffer.append(input.subarray(firstBoundary, firstBoundary + 3));
      buffer.append(input.subarray(firstBoundary + 3));

      const batches = buffer.drain();
      expect(batches).toHaveLength(Math.ceil(input.length / MAX_TERMINAL_INPUT_BYTES));
      expect(batches.every((batch) => batch.length <= MAX_TERMINAL_INPUT_BYTES)).toBe(true);

      let offset = 0;
      for (const batch of batches) {
        expect(batch).toEqual(input.subarray(offset, offset + batch.length));
        offset += batch.length;
      }
      expect(offset).toBe(input.length);
      expect(buffer.drain()).toEqual([]);
    }
  });

  test("rejects invalid terminal input batch sizes", () => {
    const buffer = new TerminalInputBuffer();
    buffer.append(Uint8Array.of(1));
    expect(() => buffer.drain(0)).toThrow(RangeError);
  });
});
