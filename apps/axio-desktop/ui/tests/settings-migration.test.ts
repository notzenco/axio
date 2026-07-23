import { describe, expect, test } from "bun:test";
import { normalizeContextPanel } from "../src/hooks/useSettings";

describe("settings migration", () => {
  test("renames the legacy terminal inspector to output", () => {
    expect(normalizeContextPanel("terminal")).toBe("output");
  });

  test("falls back when a saved inspector is unknown", () => {
    expect(normalizeContextPanel("unknown")).toBe("diff");
  });
});
