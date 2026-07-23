import { panelSizeLimits } from "../hooks/usePanelSizes";
import type { ContextPanel, WorkspaceTask } from "../types";
import { PanelResizeHandle } from "./PanelResizeHandle";
import { BrowserTool } from "./context/BrowserTool";
import { FileExplorerTool } from "./context/FileExplorerTool";
import { OutputTool } from "./context/OutputTool";
import { PlanTool } from "./context/PlanTool";
import { ReviewTool } from "./context/ReviewTool";

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

const tools: { id: ContextPanel; icon: string; label: string; title: string }[] = [
  { id: "browser", icon: "", label: "Browser", title: "Task browser" },
  { id: "files", icon: "", label: "Files", title: "File explorer" },
  { id: "diff", icon: "", label: "Review", title: "Review changes" },
  { id: "terminal", icon: "", label: "Output", title: "Command output" },
  { id: "plan", icon: "", label: "Plan", title: "Task plan" },
];

export function ContextDock({ onClose, onDecideReview, onPanelChange, onResize, onToggleWidth, panel, task, width }: ContextDockProps) {
  const activeTool = tools.find((tool) => tool.id === panel) ?? tools[0];
  return (
    <aside id="inspector" className="inspector glass-panel">
      <PanelResizeHandle label="Resize context dock" side="right" min={panelSizeLimits.context.min} max={panelSizeLimits.context.max} value={width} onChange={onResize} onReset={() => onResize(panelSizeLimits.context.default)} />
      <nav className="context-tool-rail" aria-label="Context tools">
        {tools.map((tool) => <button key={tool.id} className={`fluent${panel === tool.id ? " active" : ""}`} type="button" aria-label={tool.label} aria-pressed={panel === tool.id} title={tool.label} onClick={() => onPanelChange(tool.id)}>{tool.icon}</button>)}
      </nav>
      <div className="context-tool-surface">
        <header className="inspector-header">
          <div><span className="eyebrow">Context tool</span><strong>{activeTool.title}</strong></div>
          <div className="inspector-actions">
            <button id="inspector-expand" className="icon-button fluent" type="button" aria-label={width >= 600 ? "Restore context dock width" : "Expand context dock"} aria-pressed={width >= 600} onClick={onToggleWidth}>&#xE8A7;</button>
            <button id="inspector-close" className="icon-button fluent" type="button" aria-label="Close context dock" onClick={onClose}>&#xE8BB;</button>
          </div>
        </header>
        <BrowserTool active={panel === "browser"} />
        <FileExplorerTool active={panel === "files"} />
        <ReviewTool active={panel === "diff"} task={task} onDecideReview={onDecideReview} />
        <OutputTool active={panel === "terminal"} />
        <PlanTool active={panel === "plan"} task={task} />
      </div>
    </aside>
  );
}
