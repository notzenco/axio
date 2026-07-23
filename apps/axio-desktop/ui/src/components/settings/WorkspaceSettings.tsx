import { PanelLeft20Regular } from "@fluentui/react-icons";
import type { AppSettings } from "../../hooks/useSettings";
import type { ContextPanel } from "../../types";
import { matchesSetting, SettingSection, SettingSelect, SettingSwitch } from "./SettingControls";

interface Props {
  onChange: (patch: Partial<AppSettings["workspace"]>) => void;
  query: string;
  settings: AppSettings["workspace"];
}

export function WorkspaceSettings({ onChange, query, settings }: Props) {
  const sidebar = matchesSetting(query, "sidebar workspace launch startup open");
  const inspector = matchesSetting(query, "dock context browser files review output plan launch startup open");
  const review = matchesSetting(query, "review changes automatic inspector attention");
  const toolbar = matchesSetting(query, "toolbar navigation labels icons review badge count");
  const defaultTool = matchesSetting(query, "default context tool browser files review output plan startup");
  const status = matchesSetting(query, "status bar footer health branch checks");
  if (!sidebar && !inspector && !review && !toolbar && !defaultTool && !status) return null;
  return <SettingSection icon={<PanelLeft20Regular />} title="Workspace" description="Choose what Axio shows when you begin and review work.">
    {sidebar && <SettingSwitch label="Open workspace sidebar" description="Show tasks and worktrees when Axio starts" checked={settings.sidebarOnLaunch} onChange={(sidebarOnLaunch) => onChange({ sidebarOnLaunch })} />}
    {inspector && <SettingSwitch label="Open context dock" description="Keep browser, files, review, output, and plan tools visible" checked={settings.inspectorOnLaunch} onChange={(inspectorOnLaunch) => onChange({ inspectorOnLaunch })} />}
    {defaultTool && <SettingSelect label="Default context tool" description="Choose which tool is selected when Axio starts" value={settings.defaultContextPanel} onChange={(defaultContextPanel) => onChange({ defaultContextPanel: defaultContextPanel as ContextPanel })}><option value="browser">Browser</option><option value="files">Files</option><option value="diff">Review</option><option value="terminal">Output</option><option value="plan">Plan</option></SettingSelect>}
    {review && <SettingSwitch label="Open pending reviews automatically" description="Reveal the review inspector when selecting a task that needs attention" checked={settings.autoOpenReview} onChange={(autoOpenReview) => onChange({ autoOpenReview })} />}
    {toolbar && <SettingSwitch label="Show toolbar labels" description="Show text beside task toolbar icons when space allows" checked={settings.showToolbarLabels} onChange={(showToolbarLabels) => onChange({ showToolbarLabels })} />}
    {toolbar && <SettingSwitch label="Show review count in toolbar" description="Display the changed-file count on pending Review controls" checked={settings.showReviewBadge} onChange={(showReviewBadge) => onChange({ showReviewBadge })} />}
    {status && <SettingSwitch label="Show status bar" description="Display branch, worktree, agents, and check health" checked={settings.showStatusBar} onChange={(showStatusBar) => onChange({ showStatusBar })} />}
  </SettingSection>;
}
