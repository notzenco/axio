import { panelSizeLimits } from "../hooks/usePanelSizes";
import type { ContextPanel, WorkspaceTask } from "../types";
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
  onPanelChange: (panel: ContextPanel) => void;
  onResize: (width: number) => void;
  onToggleWidth: () => void;
  panel: ContextPanel;
  task: WorkspaceTask;
  width: number;
}

export function ContextDock({ onClose, onDecideReview, onPanelChange, onResize, onToggleWidth, panel, task, width }: ContextDockProps) {
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
        <nav className="dock-tool-nav" aria-label="Dock tools">
          {contextTools.map((tool) => {
            const Icon = tool.icon;
            return <button key={tool.id} className={panel === tool.id ? "active" : ""} type="button" aria-label={tool.label} aria-pressed={panel === tool.id} title={tool.label} onClick={() => onPanelChange(tool.id)}><Icon /></button>;
          })}
        </nav>
        <BrowserTool active={panel === "browser"} />
        <FileExplorerTool active={panel === "files"} />
        <ReviewTool active={panel === "diff"} task={task} onDecideReview={onDecideReview} />
        <OutputTool active={panel === "terminal"} />
        <PlanTool active={panel === "plan"} task={task} />
      </div>
    </aside>
  );
}
