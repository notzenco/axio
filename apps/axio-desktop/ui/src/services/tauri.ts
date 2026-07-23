import type {
  AgentStatus,
  RepositoryFileContent,
  TerminalExitEvent,
  TerminalOutputEvent,
  TerminalOutputSnapshot,
  TerminalProvider,
  TerminalSessionSnapshot,
  WorkspaceLifecycleSnapshot,
  WorkspaceSnapshot,
} from "../types";

type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
type Unlisten = () => void;
type Listen = <T>(event: string, handler: (event: { payload: T }) => void) => Promise<Unlisten>;

declare global {
  interface Window {
    __TAURI__?: {
      core?: { invoke?: Invoke };
      event?: { listen?: Listen };
      window?: { getCurrentWindow?: () => { startDragging?: () => Promise<void> } };
    };
  }
}

const invoke = window.__TAURI__?.core?.invoke;
const listen = window.__TAURI__?.event?.listen;

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

export function terminalSessions(taskId: string) {
  return invoke?.<TerminalSessionSnapshot[]>("terminal_sessions", { taskId });
}

export function terminalCapacity() {
  return invoke?.<number>("terminal_capacity");
}

export function spawnTerminalInstances(provider: TerminalProvider, count: number, taskId: string) {
  return invoke?.<TerminalSessionSnapshot[]>("spawn_terminal_instances", { provider, count, taskId });
}

export function terminalOutput(sessionId: string) {
  return invoke?.<TerminalOutputSnapshot>("terminal_output", { sessionId });
}

export function writeTerminalInput(sessionId: string, data: Uint8Array) {
  return invoke?.<void>("write_terminal_input", { sessionId, data: Array.from(data) });
}

export function resizeTerminal(sessionId: string, rows: number, columns: number) {
  return invoke?.<void>("resize_terminal", { sessionId, rows, columns });
}

export function stopTerminal(sessionId: string) {
  return invoke?.<TerminalSessionSnapshot>("stop_terminal", { sessionId });
}

export function closeTerminal(sessionId: string) {
  return invoke?.<void>("close_terminal", { sessionId });
}

export function listenTerminalOutput(handler: (event: TerminalOutputEvent) => void) {
  return listen?.<TerminalOutputEvent>("terminal-output", (event) => handler(event.payload))
    ?? Promise.resolve(() => {});
}

export function listenTerminalExit(handler: (event: TerminalExitEvent) => void) {
  return listen?.<TerminalExitEvent>("terminal-exit", (event) => handler(event.payload))
    ?? Promise.resolve(() => {});
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
