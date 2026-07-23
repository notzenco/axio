import { useCallback, useEffect, useRef, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { ContextDock } from "./components/ContextDock";
import { NewTaskDialog } from "./components/NewTaskDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { Sidebar } from "./components/Sidebar";
import { Statusbar } from "./components/Statusbar";
import { TaskCanvas } from "./components/TaskCanvas";
import { Titlebar } from "./components/Titlebar";
import { copyFallbackSnapshot } from "./data/demo-state";
import { useLayout } from "./hooks/useLayout";
import { useSettings } from "./hooks/useSettings";
import type { UpdateSettings } from "./components/SettingsDialog";
import {
  createTask,
  reviewTask,
  selectTask,
  sendDirection,
  setAgentStatus,
  workspaceSnapshot,
} from "./services/tauri";
import type { AgentSession, AgentStatus, WorkspaceSnapshot } from "./types";

export function App() {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(copyFallbackSnapshot);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  const { reset: resetSettings, settings, update: updateSettings } = useSettings();
  const layout = useLayout(settings.workspace);
  const selectedTask = snapshot.tasks.find((task) => task.id === snapshot.selected_task) ?? snapshot.tasks[0];

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  }, []);

  useEffect(() => {
    workspaceSnapshot()?.then(setSnapshot).catch((error) => {
      setSnapshot(copyFallbackSnapshot());
      notify(`Using local preview data: ${error}`);
    });
    return () => window.clearTimeout(toastTimer.current);
  }, [notify]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const chooseTask = async (id: string) => {
    try {
      const nativeSnapshot = await selectTask(id);
      if (nativeSnapshot) {
        setSnapshot(nativeSnapshot);
        if (settings.workspace.autoOpenReview && nativeSnapshot.tasks.find((task) => task.id === id)?.review === "pending") layout.showInspectorPanel("diff", true);
      } else {
        if (settings.workspace.autoOpenReview && snapshot.tasks.find((task) => task.id === id)?.review === "pending") layout.showInspectorPanel("diff", true);
        setSnapshot((current) => ({ ...current, selected_task: id, tasks: current.tasks.map((task) => task.id === id ? { ...task, unread: 0 } : task) }));
      }
    } catch (error) {
      notify(String(error));
    }
  };

  const addTask = async (title: string) => {
    const nativeSnapshot = await createTask(title);
    if (nativeSnapshot) setSnapshot(nativeSnapshot);
    else setSnapshot((current) => {
      const ordinal = current.tasks.length + 1;
      const id = `task-${ordinal}`;
      return {
        ...current,
        selected_task: id,
        tasks: [...current.tasks, { id, title, status: "active", worktree: `axio/task-${ordinal}`, agent_ids: current.agents.map((agent) => agent.id), unread: 0, changed_files: 0, review: "none" }],
      };
    });
    notify("Task created with an isolated worktree");
  };

  const addDirection = async (message: string, audience: string) => {
    if (!selectedTask) return;
    try {
      const nativeSnapshot = await sendDirection(selectedTask.id, message);
      if (nativeSnapshot) setSnapshot(nativeSnapshot);
      else setSnapshot((current) => ({
        ...current,
        activity: [...current.activity, {
          id: `activity-${current.activity.length + 1}`,
          task_id: selectedTask.id,
          agent_id: null,
          kind: "message",
          summary: message,
          detail: `Direction queued for ${audience}`,
          timestamp: "now",
        }],
      }));
      notify("Direction added to the task");
      requestAnimationFrame(() => document.querySelector("#timeline")?.lastElementChild?.scrollIntoView({ behavior: settings.accessibility.reduceMotion ? "auto" : "smooth", block: "nearest" }));
    } catch (error) {
      notify(String(error));
    }
  };

  const decideReview = async (approved: boolean) => {
    if (!selectedTask) return;
    try {
      const nativeSnapshot = await reviewTask(selectedTask.id, approved);
      if (nativeSnapshot) setSnapshot(nativeSnapshot);
      else setSnapshot((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === selectedTask.id ? { ...task, review: approved ? "approved" : "rejected", status: approved ? "completed" : "waiting" } : task) }));
      notify(approved ? "Changes approved" : "Changes returned for revision");
    } catch (error) {
      notify(String(error));
    }
  };

  const transitionAgent = async (agent: AgentSession) => {
    const next: AgentStatus = agent.status === "running" ? "waiting" : agent.status === "waiting" ? "running" : "starting";
    try {
      const nativeSnapshot = await setAgentStatus(agent.id, next);
      if (nativeSnapshot) setSnapshot(nativeSnapshot);
      else setSnapshot((current) => ({ ...current, agents: current.agents.map((candidate) => candidate.id === agent.id ? { ...candidate, status: next } : candidate) }));
      notify(`${agent.name} is now ${next}`);
    } catch (error) {
      notify(String(error));
    }
  };

  const runPaletteCommand = (command: string) => {
    if (command === "new") setNewTaskOpen(true);
    else if (command === "focus") layout.setFocusMode(!layout.focusMode);
    else if (command === "review") layout.showInspectorPanel("diff", true);
    else if (command === "settings") setSettingsOpen(true);
    else void chooseTask(command);
  };

  const handleSettingsUpdate: UpdateSettings = (section, patch) => {
    updateSettings(section, patch);
    if (section !== "workspace") return;
    const workspacePatch = patch as Partial<typeof settings.workspace>;
    if (workspacePatch.sidebarOnLaunch !== undefined) layout.setSidebarOpen(workspacePatch.sidebarOnLaunch);
    if (workspacePatch.inspectorOnLaunch !== undefined) layout.setInspectorOpen(workspacePatch.inspectorOnLaunch);
    if (workspacePatch.defaultContextPanel !== undefined) layout.setInspectorPanel(workspacePatch.defaultContextPanel);
  };

  const handleSettingsReset = () => {
    resetSettings();
    layout.setSidebarOpen(true);
    layout.setInspectorOpen(false);
    layout.setInspectorPanel("diff");
  };

  const chooseContextTool = (panel: typeof layout.inspectorPanel) => {
    if (layout.focusMode) {
      layout.showInspectorPanel(panel, panel === "diff");
      return;
    }
    if (layout.inspectorOpen && layout.inspectorPanel === panel) {
      layout.setInspectorOpen(false);
      return;
    }
    layout.showInspectorPanel(panel, panel === "diff");
  };

  if (!selectedTask) return null;
  return (
    <>
      <div className="app-shell">
        <Titlebar layout={layout} notify={notify} onOpenPalette={() => setPaletteOpen(true)} onOpenSettings={() => setSettingsOpen(true)} project={snapshot.project} />
        <div className="workspace-shell">
          <Sidebar snapshot={snapshot} panel={layout.sidebarPanel} width={layout.workspaceWidth} onResize={layout.setWorkspaceWidth} onPanelChange={layout.showSidebarPanel} onNewTask={() => setNewTaskOpen(true)} onNotify={notify} onSelectTask={chooseTask} onTransitionAgent={transitionAgent} />
          <button id="overlay-scrim" className="overlay-scrim" type="button" aria-label="Close open panel" tabIndex={-1} onClick={layout.closeOverlay}></button>
          <TaskCanvas contextOpen={layout.inspectorOpen} contextPanel={layout.inspectorPanel} focusMode={layout.focusMode} preferences={settings.composer} showReviewBadge={settings.workspace.showReviewBadge} snapshot={snapshot} task={selectedTask} onOpenAgents={() => layout.showSidebarPanel("agents")} onFocusToggle={() => layout.setFocusMode(!layout.focusMode)} onToolSelect={chooseContextTool} onOpenOutput={() => layout.showInspectorPanel("terminal")} onOpenReview={() => layout.showInspectorPanel("diff", true)} onSend={addDirection} />
          <ContextDock task={selectedTask} panel={layout.inspectorPanel} width={layout.contextWidth} onResize={layout.setContextWidth} onToggleWidth={layout.toggleContextWidth} onPanelChange={(panel) => layout.showInspectorPanel(panel)} onClose={() => layout.setInspectorOpen(false)} onDecideReview={decideReview} />
        </div>
        <Statusbar snapshot={snapshot} task={selectedTask} onWorkspace={() => layout.showSidebarPanel("tasks")} onAgents={() => layout.showSidebarPanel("agents")} onOutput={() => layout.showInspectorPanel("terminal")} />
      </div>
      <NewTaskDialog open={newTaskOpen} onClose={() => setNewTaskOpen(false)} onCreate={addTask} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onUpdate={handleSettingsUpdate} onReset={handleSettingsReset} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onCommand={runPaletteCommand} tasks={snapshot.tasks} />
      <div id="toast" className={`toast glass-surface${toast ? " visible" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
