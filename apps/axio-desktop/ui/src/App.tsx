import { useCallback, useEffect, useRef, useState } from "react";
import { CommandPalette } from "./components/CommandPalette";
import { ContextDock } from "./components/ContextDock";
import { EmptyWorkspace } from "./components/EmptyWorkspace";
import { NewTaskDialog } from "./components/NewTaskDialog";
import { OpenWorkspaceDialog } from "./components/OpenWorkspaceDialog";
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
  closeWorkspace,
  openWorkspace,
  pickWorkspaceFolder,
  refreshRepository,
  removeRecentWorkspace,
  reviewTask,
  selectTask,
  sendDirection,
  setAgentStatus,
  workspaceLifecycle,
} from "./services/tauri";
import type { AgentSession, AgentStatus, RecentWorkspace, WorkspaceSnapshot } from "./types";

export function App() {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(copyFallbackSnapshot);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
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
    let cancelled = false;
    let firstFrame: number | undefined;
    let secondFrame: number | undefined;
    workspaceLifecycle()?.then((lifecycle) => {
      if (cancelled) return;
      setSnapshot(lifecycle.workspace);
      setRecentWorkspaces(lifecycle.recent_workspaces);
      if (lifecycle.persistence_warning) notify(lifecycle.persistence_warning);
      if (lifecycle.workspace.repository) {
        firstFrame = window.requestAnimationFrame(() => {
          secondFrame = window.requestAnimationFrame(() => {
            refreshRepository()?.then((refreshed) => {
              if (!cancelled) setSnapshot(refreshed);
            }).catch((error) => {
              if (!cancelled) notify(`Repository refresh failed: ${error}`);
            });
          });
        });
      }
    }).catch((error) => {
      if (cancelled) return;
      setSnapshot(copyFallbackSnapshot());
      notify(`Using local preview data: ${error}`);
    });
    return () => {
      cancelled = true;
      if (firstFrame !== undefined) window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(toastTimer.current);
    };
  }, [notify]);

  const applyWorkspaceLifecycle = (lifecycle: Awaited<ReturnType<typeof openWorkspace>>) => {
    if (!lifecycle) return;
    setSnapshot(lifecycle.workspace);
    setRecentWorkspaces(lifecycle.recent_workspaces);
    if (lifecycle.persistence_warning) notify(lifecycle.persistence_warning);
  };

  const openRepositoryWorkspace = async (path: string) => {
    const lifecycle = await openWorkspace(path);
    applyWorkspaceLifecycle(lifecycle);
    if (lifecycle) notify(`Opened ${lifecycle.workspace.project}`);
  };

  const browseRepositoryWorkspace = async () => {
    const selectedPath = await pickWorkspaceFolder();
    if (selectedPath === undefined) {
      notify("The native folder chooser is available in the desktop build");
      return null;
    }
    return selectedPath;
  };

  const closeRepositoryWorkspace = async () => {
    applyWorkspaceLifecycle(await closeWorkspace());
    setWorkspaceOpen(false);
    notify("Workspace closed; repository files were not changed");
  };

  const forgetRecentWorkspace = async (path: string) => {
    applyWorkspaceLifecycle(await removeRecentWorkspace(path));
    notify("Removed from recent workspaces");
  };

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
        if (settings.workspace.autoOpenReview && nativeSnapshot.tasks.find((task) => task.id === id)?.review === "pending") layout.showInspectorPanel("diff");
      } else {
        if (settings.workspace.autoOpenReview && snapshot.tasks.find((task) => task.id === id)?.review === "pending") layout.showInspectorPanel("diff");
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
      const nativeSnapshot = await sendDirection(selectedTask.id, message, audience);
      if (nativeSnapshot) setSnapshot(nativeSnapshot);
      else setSnapshot((current) => ({
        ...current,
        activity: [...current.activity, {
          id: `activity-${current.activity.length + 1}`,
          task_id: selectedTask.id,
          agent_id: null,
          kind: "message",
          summary: message,
          detail: `Direction sent to ${audience}`,
          timestamp: "now",
        }],
      }));
      notify(`Sent to ${audience} · ${selectedTask.title}`);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.querySelector("[data-latest-activity='true'], #timeline > :last-child")?.scrollIntoView({
          behavior: settings.accessibility.reduceMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }));
    } catch (error) {
      notify(String(error));
    }
  };

  const refreshActiveRepository = async () => {
    try {
      const nativeSnapshot = await refreshRepository();
      if (!nativeSnapshot) {
        notify("Live repository data is available in the desktop build");
        return;
      }
      setSnapshot(nativeSnapshot);
      notify(`Refreshed ${nativeSnapshot.repository?.name ?? nativeSnapshot.project}`);
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
    if (command === "new") selectedTask ? setNewTaskOpen(true) : setWorkspaceOpen(true);
    else if (command === "focus") layout.setFocusMode(!layout.focusMode);
    else if (command === "review") layout.showInspectorPanel("diff");
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
    layout.setInspectorOpen(true);
    layout.setInspectorPanel("diff");
  };

  const chooseContextTool = (panel: typeof layout.inspectorPanel) => {
    if (layout.focusMode) {
      layout.showInspectorPanel(panel);
      return;
    }
    if (layout.inspectorOpen && layout.inspectorPanel === panel) {
      layout.setInspectorOpen(false);
      return;
    }
    layout.showInspectorPanel(panel);
  };

  return (
    <>
      <div className="app-shell">
        <Titlebar layout={layout} notify={notify} onOpenPalette={() => setPaletteOpen(true)} onOpenSettings={() => setSettingsOpen(true)} project={snapshot.project} />
        <div className={`workspace-shell${selectedTask ? "" : " workspace-empty-shell"}`}>
          <Sidebar snapshot={snapshot} panel={layout.sidebarPanel} width={layout.workspaceWidth} onResize={layout.setWorkspaceWidth} onPanelChange={layout.showSidebarPanel} onNewTask={() => setNewTaskOpen(true)} onOpenWorkspace={() => setWorkspaceOpen(true)} onNotify={notify} onSelectTask={chooseTask} onTransitionAgent={transitionAgent} />
          <button id="overlay-scrim" className="overlay-scrim" type="button" aria-label="Close open panel" tabIndex={-1} onClick={layout.closeOverlay}></button>
          {selectedTask
            ? <TaskCanvas contextOpen={layout.inspectorOpen} contextPanel={layout.inspectorPanel} notify={notify} preferences={settings.composer} showReviewBadge={settings.workspace.showReviewBadge} snapshot={snapshot} task={selectedTask} onToolSelect={chooseContextTool} onOpenOutput={() => layout.showInspectorPanel("terminal")} onOpenReview={() => layout.showInspectorPanel("diff")} onSend={addDirection} />
            : <EmptyWorkspace onOpenWorkspace={() => setWorkspaceOpen(true)} />}
          {selectedTask && <ContextDock snapshot={snapshot} task={selectedTask} panel={layout.inspectorPanel} width={layout.contextWidth} onResize={layout.setContextWidth} onToggleWidth={layout.toggleContextWidth} onClose={() => layout.setInspectorOpen(false)} onDecideReview={decideReview} onRefreshRepository={refreshActiveRepository} />}
        </div>
        <Statusbar snapshot={snapshot} task={selectedTask} onWorkspace={() => layout.showSidebarPanel("tasks")} onAgents={() => layout.showSidebarPanel("agents")} onOutput={() => layout.showInspectorPanel("terminal")} onReview={() => layout.showInspectorPanel("diff")} />
      </div>
      <NewTaskDialog open={newTaskOpen} onClose={() => setNewTaskOpen(false)} onCreate={addTask} />
      <OpenWorkspaceDialog activePath={snapshot.repository?.root} open={workspaceOpen} recentWorkspaces={recentWorkspaces} onBrowse={browseRepositoryWorkspace} onClose={() => setWorkspaceOpen(false)} onOpen={openRepositoryWorkspace} onRemove={forgetRecentWorkspace} onCloseWorkspace={closeRepositoryWorkspace} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onUpdate={handleSettingsUpdate} onReset={handleSettingsReset} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onCommand={runPaletteCommand} tasks={snapshot.tasks} />
      <div id="toast" className={`toast glass-surface${toast ? " visible" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
