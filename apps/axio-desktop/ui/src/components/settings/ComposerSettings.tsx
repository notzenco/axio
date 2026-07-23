import { Chat20Regular } from "@fluentui/react-icons";
import type { AppSettings } from "../../hooks/useSettings";
import { matchesSetting, SettingSection, SettingSwitch } from "./SettingControls";

interface Props {
  onChange: (patch: Partial<AppSettings["composer"]>) => void;
  query: string;
  settings: AppSettings["composer"];
}

export function ComposerSettings({ onChange, query, settings }: Props) {
  const send = matchesSetting(query, "send enter keyboard composer direction message");
  if (!send) return null;
  return <SettingSection icon={<Chat20Regular />} title="Composer" description="Control how task directions are recorded.">
    {send && <SettingSwitch label="Send with Enter" description="Use Shift Enter for a new line; turn off to use Ctrl Enter" checked={settings.sendOnEnter} onChange={(sendOnEnter) => onChange({ sendOnEnter })} />}
  </SettingSection>;
}
