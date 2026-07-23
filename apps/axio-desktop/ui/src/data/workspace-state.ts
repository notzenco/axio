import type { WorkspaceSnapshot } from "../types";

export function createEmptySnapshot(): WorkspaceSnapshot {
  return {
    project: "No workspace",
    branch: "—",
    agents: [],
    tasks: [],
    selected_task: "",
    repository: null,
    activity: [],
  };
}
