import type { AppSettings, DefaultAudience } from "../../hooks/useSettings";
import { matchesSetting, SettingSection, SettingSelect, SettingSwitch } from "./SettingControls";

interface Props {
  onChange: (patch: Partial<AppSettings["composer"]>) => void;
  query: string;
  settings: AppSettings["composer"];
}

export function ComposerSettings({ onChange, query, settings }: Props) {
  const send = matchesSetting(query, "send enter keyboard composer direction message");
  const audience = matchesSetting(query, "default target audience agent routing");
  if (!send && !audience) return null;
  return <SettingSection icon="" title="Composer" description="Control how directions are targeted and submitted.">
    {send && <SettingSwitch label="Send with Enter" description="Use Shift Enter for a new line; turn off to use Ctrl Enter" checked={settings.sendOnEnter} onChange={(sendOnEnter) => onChange({ sendOnEnter })} />}
    {audience && <SettingSelect label="Default direction target" description="Choose the initial audience for each selected task" value={settings.defaultAudience} onChange={(defaultAudience) => onChange({ defaultAudience: defaultAudience as DefaultAudience })}><option value="all">All agents</option><option value="first-agent">First assigned agent</option></SettingSelect>}
  </SettingSection>;
}
