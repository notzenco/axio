import { FullScreenMaximize20Regular, FullScreenMinimize20Regular } from "@fluentui/react-icons";
import type { ContextPanel } from "../types";
import { contextTools } from "./context/contextTools";

interface WorkspaceToolbarProps {
  contextOpen: boolean;
  focusMode: boolean;
  onFocusToggle: () => void;
  onToolSelect: (panel: ContextPanel) => void;
  panel: ContextPanel;
  reviewCount: number;
  reviewPending: boolean;
  showReviewBadge: boolean;
}

export function WorkspaceToolbar({ contextOpen, focusMode, onFocusToggle, onToolSelect, panel, reviewCount, reviewPending, showReviewBadge }: WorkspaceToolbarProps) {
  const FocusIcon = focusMode ? FullScreenMinimize20Regular : FullScreenMaximize20Regular;
  return (
    <nav className="workspace-toolbar" aria-label="Workspace tools">
      <button className={focusMode ? "active" : ""} type="button" aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"} aria-pressed={focusMode} title={focusMode ? "Exit focus mode" : "Enter focus mode"} onClick={onFocusToggle}>
        <FocusIcon /><span>{focusMode ? "Exit focus" : "Focus"}</span>
      </button>
      <i className="workspace-toolbar-divider"></i>
      {contextTools.map((tool) => {
        const Icon = tool.icon;
        const active = contextOpen && panel === tool.id;
        const accessibleLabel = `${tool.label}${tool.id === "diff" && reviewPending ? `, ${reviewCount} files require review` : ""}`;
        return <button key={tool.id} className={`${active ? "active" : ""}${tool.id === "diff" && reviewPending ? " attention" : ""}`} type="button" aria-label={accessibleLabel} aria-pressed={active} title={accessibleLabel} onClick={() => onToolSelect(tool.id)}><Icon /><span>{tool.label}</span>{tool.id === "diff" && reviewPending && showReviewBadge && <b>{reviewCount}</b>}</button>;
      })}
    </nav>
  );
}
