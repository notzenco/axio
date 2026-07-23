import type { PointerEvent } from "react";
import {
  ChevronDown12Regular,
  Dismiss20Regular,
  Maximize20Regular,
  Navigation20Regular,
  Search20Regular,
  Settings20Regular,
  Subtract20Regular,
} from "@fluentui/react-icons";
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
        className="icon-button"
        type="button"
        aria-label={layout.sidebarOpen ? "Close workspace sidebar" : "Open workspace sidebar"}
        title={layout.focusMode ? "Exit focus mode to open the workspace sidebar" : undefined}
        aria-pressed={layout.sidebarOpen && !layout.focusMode}
        onClick={() => {
          if (layout.focusMode) layout.setFocusMode(false);
          layout.setSidebarOpen(!layout.sidebarOpen || layout.focusMode);
        }}
      ><Navigation20Regular /></button>
      <div className="wordmark" data-tauri-drag-region><span className="axio-mark">A</span><span>Axio</span></div>
      <button className="project-pill" type="button" onClick={onOpenPalette}>
        <span className="project-light"></span><span id="project-name">{project}</span><ChevronDown12Regular />
      </button>
      <button className="command-trigger" type="button" onClick={onOpenPalette}>
        <Search20Regular /><span>Switch task or run a command</span><kbd>Ctrl K</kbd>
      </button>
      <div className="titlebar-actions">
        <span className="local-pill"><i></i> Local</span>
        <button id="settings-button" className="icon-button" type="button" aria-label="Settings" title="Settings" onClick={onOpenSettings}><Settings20Regular /></button>
      </div>
      <div className="window-controls">
        <button type="button" onClick={() => onWindowAction("minimize")} aria-label="Minimize"><Subtract20Regular /></button>
        <button type="button" onClick={() => onWindowAction("maximize")} aria-label="Maximize"><Maximize20Regular /></button>
        <button className="window-close" type="button" onClick={() => onWindowAction("close")} aria-label="Close"><Dismiss20Regular /></button>
      </div>
    </header>
  );
}
