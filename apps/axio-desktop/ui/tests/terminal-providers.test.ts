import { describe, expect, test } from "bun:test";
import { normalizeTerminalCount, terminalProviderLabel } from "../src/data/terminal-providers";

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
});
