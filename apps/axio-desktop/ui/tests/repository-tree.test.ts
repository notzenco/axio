import { describe, expect, test } from "bun:test";
import { repositoryTree } from "../src/data/repository-tree";

describe("repositoryTree", () => {
  test("builds folders and files from live repository paths", () => {
    expect(repositoryTree(["apps/desktop/main.ts", "Cargo.toml"], "")).toEqual([
      { depth: 0, folder: true, name: "apps", path: "apps" },
      { depth: 1, folder: true, name: "desktop", path: "apps/desktop" },
      { depth: 2, folder: false, name: "main.ts", path: "apps/desktop/main.ts" },
      { depth: 0, folder: false, name: "Cargo.toml", path: "Cargo.toml" },
    ]);
  });

  test("searches full paths without hiding their location", () => {
    expect(repositoryTree(["apps/desktop/main.ts", "crates/core/lib.rs"], "core")).toEqual([
      { depth: 2, folder: false, name: "lib.rs", path: "crates/core/lib.rs" },
    ]);
  });
});
