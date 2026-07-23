import type { WorkspaceActivity } from "../types";

export function activityForTask(activity: WorkspaceActivity[], taskId: string) {
  return activity.filter((event) => event.task_id === taskId);
}
