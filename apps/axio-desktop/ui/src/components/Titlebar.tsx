import type { PointerEvent } from "react";
import type { LayoutController } from "../hooks/useLayout";
import { runWindowAction, startWindowDrag } from "../services/tauri";

interface TitlebarProps {
  layout: LayoutController;
  notify: (message: string) => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  project: string;
}

export function Titlebar({ layout, notify, onOpenPalette, onOpenSettings, project }: TitlebarProps) {
  const onWindowAction = async (action: string) => {
    try {
      if (!await runWindowAction(action)) notify("Native window controls are active in the Tauri build");
    } catch (error) {
      notify(String(error));
    }
  };

  const onDrag = async (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest("button, input, textarea, select, a, dialog, summary, [role='tab']")) return;
    try {
      if (event.altKey || event.target.closest("[data-tauri-drag-region]")) await startWindowDrag();
    } catch (error) {
      notify(String(error));
    }
  };

  return (
    <header className="titlebar" data-tauri-drag-region onPointerDown={onDrag}>
      <button
        id="sidebar-toggle"
        className="icon-button fluent"
        type="button"
        aria-label={layout.sidebarOpen ? "Close workspace sidebar" : "Open workspace sidebar"}
        title={layout.focusMode ? "Exit focus mode to open the workspace sidebar" : undefined}
        aria-pressed={layout.sidebarOpen && !layout.focusMode}
        onClick={() => {
          if (layout.focusMode) layout.setFocusMode(false);
          layout.setSidebarOpen(!layout.sidebarOpen || layout.focusMode);
        }}
      >&#xE700;</button>
      <div className="wordmark" data-tauri-drag-region><span className="axio-mark">A</span><span>Axio</span></div>
      <button className="project-pill" type="button" onClick={onOpenPalette}>
        <span className="project-light"></span><span id="project-name">{project}</span><span className="fluent mini-icon">&#xE70D;</span>
      </button>
      <button className="command-trigger" type="button" onClick={onOpenPalette}>
        <span className="fluent">&#xE721;</span><span>Switch task or run a command</span><kbd>Ctrl K</kbd>
      </button>
      <div className="titlebar-actions">
        <span className="local-pill"><i></i> Local</span>
        <button id="focus-toggle" className="text-button" type="button" aria-label={layout.focusMode ? "Exit focus mode" : "Enter focus mode"} aria-pressed={layout.focusMode} onClick={() => layout.setFocusMode(!layout.focusMode)}>
          <span className="fluent">&#xE740;</span><span>{layout.focusMode ? "Exit focus mode" : "Focus"}</span>
        </button>
        <button id="inspector-toggle" className="icon-button fluent" type="button" aria-label={layout.inspectorOpen ? "Hide context dock" : "Open context dock"} aria-pressed={layout.inspectorOpen && !layout.focusMode} onClick={() => {
          if (layout.focusMode) layout.setFocusMode(false);
          layout.setInspectorOpen(!layout.inspectorOpen || layout.focusMode);
        }}>&#xE8A0;</button>
        <button id="settings-button" className="icon-button fluent" type="button" aria-label="Settings" title="Settings" onClick={onOpenSettings}>&#xE713;</button>
      </div>
      <div className="window-controls">
        <button className="fluent" type="button" onClick={() => onWindowAction("minimize")} aria-label="Minimize">&#xE921;</button>
        <button className="fluent" type="button" onClick={() => onWindowAction("maximize")} aria-label="Maximize">&#xE922;</button>
        <button className="fluent window-close" type="button" onClick={() => onWindowAction("close")} aria-label="Close">&#xE8BB;</button>
      </div>
    </header>
  );
}
