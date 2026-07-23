import type { AppSettings } from "../../hooks/useSettings";
import { matchesSetting, SettingSection, SettingSwitch } from "./SettingControls";

interface Props {
  onChange: (patch: Partial<AppSettings["workspace"]>) => void;
  query: string;
  settings: AppSettings["workspace"];
}

export function WorkspaceSettings({ onChange, query, settings }: Props) {
  const sidebar = matchesSetting(query, "sidebar workspace launch startup open");
  const inspector = matchesSetting(query, "dock context browser files review output plan launch startup open");
  const review = matchesSetting(query, "review changes automatic inspector attention");
  const status = matchesSetting(query, "status bar footer health branch checks");
  if (!sidebar && !inspector && !review && !status) return null;
  return <SettingSection icon="" title="Workspace" description="Choose what Axio shows when you begin and review work.">
    {sidebar && <SettingSwitch label="Open workspace sidebar" description="Show tasks and worktrees when Axio starts" checked={settings.sidebarOnLaunch} onChange={(sidebarOnLaunch) => onChange({ sidebarOnLaunch })} />}
    {inspector && <SettingSwitch label="Open context dock" description="Keep browser, files, review, output, and plan tools visible" checked={settings.inspectorOnLaunch} onChange={(inspectorOnLaunch) => onChange({ inspectorOnLaunch })} />}
    {review && <SettingSwitch label="Open pending reviews automatically" description="Reveal the review inspector when selecting a task that needs attention" checked={settings.autoOpenReview} onChange={(autoOpenReview) => onChange({ autoOpenReview })} />}
    {status && <SettingSwitch label="Show status bar" description="Display branch, worktree, agents, and check health" checked={settings.showStatusBar} onChange={(showStatusBar) => onChange({ showStatusBar })} />}
  </SettingSection>;
}
