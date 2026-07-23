import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const desktopRoot = join(repositoryRoot, "apps", "axio-desktop");
const result = spawnSync("bun", ["run", "typecheck"], {
  cwd: desktopRoot,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
