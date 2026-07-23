import { describe, expect, test } from "bun:test";
import { normalizeTerminalCount, terminalProviderLabel } from "../src/data/terminal-providers";
import { TerminalResizeScheduler } from "../src/data/terminal-resize";

describe("terminal provider controls", () => {
  test("normalizes instance counts to the supported batch boundary", () => {
    expect(normalizeTerminalCount(Number.NaN)).toBe(1);
    expect(normalizeTerminalCount(0)).toBe(1);
    expect(normalizeTerminalCount(3.9)).toBe(3);
    expect(normalizeTerminalCount(12)).toBe(8);
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
});
