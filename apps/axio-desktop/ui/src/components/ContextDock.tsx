import { panelSizeLimits } from "../hooks/usePanelSizes";
import type { ContextPanel, TerminalSessionSnapshot, WorkspaceSnapshot, WorkspaceTask } from "../types";
import { ArrowMaximize20Regular, Dismiss20Regular } from "@fluentui/react-icons";
import { PanelResizeHandle } from "./PanelResizeHandle";
import { BrowserTool } from "./context/BrowserTool";
import { FileExplorerTool } from "./context/FileExplorerTool";
import { OutputTool } from "./context/OutputTool";
import { PlanTool } from "./context/PlanTool";
import { ReviewTool } from "./context/ReviewTool";
import { contextTools } from "./context/contextTools";

interface ContextDockProps {
  onClose: () => void;
  onDecideReview: (approved: boolean) => void;
  onResize: (width: number) => void;
  onRefreshRepository: () => void;
  onOpenTerminal: () => void;
  onToggleWidth: () => void;
  panel: ContextPanel;
  snapshot: WorkspaceSnapshot;
  sessions: TerminalSessionSnapshot[];
  task: WorkspaceTask;
  width: number;
}

export function ContextDock({ onClose, onDecideReview, onOpenTerminal, onRefreshRepository, onResize, onToggleWidth, panel, sessions, snapshot, task, width }: ContextDockProps) {
  const activeTool = contextTools.find((tool) => tool.id === panel) ?? contextTools[0];
  const ActiveIcon = activeTool.icon;
  return (
    <aside id="inspector" className="inspector glass-panel">
      <PanelResizeHandle label="Resize context dock" side="right" min={panelSizeLimits.context.min} max={panelSizeLimits.context.max} value={width} onChange={onResize} onReset={() => onResize(panelSizeLimits.context.default)} />
      <div className="context-tool-surface">
        <header className="inspector-header">
          <div className="context-heading"><ActiveIcon /><span><span className="eyebrow">Context tool</span><strong>{activeTool.title}</strong></span></div>
          <div className="inspector-actions">
            <button id="inspector-expand" className="icon-button" type="button" aria-label={width >= 600 ? "Restore context dock width" : "Expand context dock"} aria-pressed={width >= 600} onClick={onToggleWidth}><ArrowMaximize20Regular /></button>
            <button id="inspector-close" className="icon-button" type="button" aria-label="Close context dock" onClick={onClose}><Dismiss20Regular /></button>
          </div>
        </header>
        <BrowserTool active={panel === "browser"} />
        <FileExplorerTool active={panel === "files"} repository={snapshot.repository} onRefresh={onRefreshRepository} />
        <ReviewTool active={panel === "diff"} snapshot={snapshot} task={task} onDecideReview={onDecideReview} onRefresh={onRefreshRepository} />
        <OutputTool active={panel === "output"} sessions={sessions} onOpenTerminal={onOpenTerminal} />
        <PlanTool active={panel === "plan"} sessions={sessions} snapshot={snapshot} task={task} />
      </div>
    </aside>
  );
}
