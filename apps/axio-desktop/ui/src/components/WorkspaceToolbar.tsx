import { AppsListDetail20Regular, Grid20Regular } from "@fluentui/react-icons";
import type { ContextPanel, WorkMode } from "../types";
import { workspaceTools } from "./context/contextTools";

interface WorkspaceToolbarProps {
  contextOpen: boolean;
  mode: WorkMode;
  onModeChange: (mode: WorkMode) => void;
  onToolSelect: (panel: ContextPanel) => void;
  panel: ContextPanel;
}

const workModes = [
  { id: "activity", icon: AppsListDetail20Regular, label: "Activity" },
  { id: "canvas", icon: Grid20Regular, label: "Canvas" },
] satisfies { id: WorkMode; icon: typeof Grid20Regular; label: string }[];

export function WorkspaceToolbar({ contextOpen, mode, onModeChange, onToolSelect, panel }: WorkspaceToolbarProps) {
  return (
    <nav className="workspace-toolbar" aria-label="Workspace navigation">
      <div className="work-mode-switcher" role="tablist" aria-label="Work modes">
        {workModes.map((workMode) => {
          const Icon = workMode.icon;
          return <button key={workMode.id} className={mode === workMode.id ? "active" : ""} type="button" role="tab" aria-label={workMode.label} aria-selected={mode === workMode.id} title={workMode.label} onClick={() => onModeChange(workMode.id)}><Icon /><span>{workMode.label}</span></button>;
        })}
      </div>
      <div className="workspace-tool-shelf" aria-label="Context tools">
        {workspaceTools.map((tool) => {
          const Icon = tool.icon;
          const active = contextOpen && panel === tool.id;
          return <button key={tool.id} className={active ? "active" : ""} type="button" aria-label={`Open ${tool.label}`} aria-pressed={active} title={`Open ${tool.label} in the context dock`} onClick={() => onToolSelect(tool.id)}><Icon /><span>{tool.label}</span></button>;
        })}
      </div>
    </nav>
  );
}
