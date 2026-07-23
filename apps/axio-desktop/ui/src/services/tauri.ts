import type { AgentStatus, RepositoryFileContent, WorkspaceLifecycleSnapshot, WorkspaceSnapshot } from "../types";

type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

declare global {
  interface Window {
    __TAURI__?: {
      core?: { invoke?: Invoke };
      window?: { getCurrentWindow?: () => { startDragging?: () => Promise<void> } };
    };
  }
}

const invoke = window.__TAURI__?.core?.invoke;

export const isNative = Boolean(invoke);

export function workspaceSnapshot() {
  return invoke?.<WorkspaceSnapshot>("workspace_snapshot");
}

export function workspaceLifecycle() {
  return invoke?.<WorkspaceLifecycleSnapshot>("workspace_lifecycle");
}

export function pickWorkspaceFolder() {
  return invoke?.<string | null>("pick_workspace_folder");
}

export function openWorkspace(path: string) {
  return invoke?.<WorkspaceLifecycleSnapshot>("open_workspace", { path });
}

export function closeWorkspace() {
  return invoke?.<WorkspaceLifecycleSnapshot>("close_workspace");
}

export function removeRecentWorkspace(path: string) {
  return invoke?.<WorkspaceLifecycleSnapshot>("remove_recent_workspace", { path });
}

export function refreshRepository() {
  return invoke?.<WorkspaceSnapshot>("refresh_repository");
}

export function readRepositoryFile(path: string) {
  return invoke?.<RepositoryFileContent>("read_repository_file", { path });
}

export function selectTask(id: string) {
  return invoke?.<WorkspaceSnapshot>("select_task", { id });
}

export function createTask(title: string) {
  return invoke?.<WorkspaceSnapshot>("create_task", { title });
}

export function sendDirection(taskId: string, message: string, audience: string) {
  return invoke?.<WorkspaceSnapshot>("send_direction", { taskId, message, audience });
}

export function reviewTask(taskId: string, approved: boolean) {
  return invoke?.<WorkspaceSnapshot>("review_task", { taskId, approved });
}

export function setAgentStatus(id: string, next: AgentStatus) {
  return invoke?.<WorkspaceSnapshot>("set_agent_status", { id, next });
}

export async function runWindowAction(action: string) {
  if (!invoke) return false;
  await invoke<void>("window_action", { action });
  return true;
}

export async function startWindowDrag() {
  if (!invoke) return false;
  const nativeWindow = window.__TAURI__?.window?.getCurrentWindow?.();
  if (nativeWindow?.startDragging) await nativeWindow.startDragging();
  else await invoke<void>("window_action", { action: "drag" });
  return true;
}
