import { Accessibility20Regular } from "@fluentui/react-icons";
import type { AppSettings } from "../../hooks/useSettings";
import { matchesSetting, SettingSection, SettingSwitch } from "./SettingControls";

interface Props {
  onChange: (patch: Partial<AppSettings["accessibility"]>) => void;
  query: string;
  settings: AppSettings["accessibility"];
}

export function AccessibilitySettings({ onChange, query, settings }: Props) {
  const motion = matchesSetting(query, "reduced motion animation accessibility");
  const contrast = matchesSetting(query, "high contrast text visibility accessibility");
  const controls = matchesSetting(query, "larger controls buttons targets accessibility");
  if (!motion && !contrast && !controls) return null;
  return <SettingSection icon={<Accessibility20Regular />} title="Accessibility" description="Reduce visual strain and make controls easier to use.">
    {motion && <SettingSwitch label="Reduced motion" description="Disable ambient and entrance animation" checked={settings.reduceMotion} onChange={(reduceMotion) => onChange({ reduceMotion })} />}
    {contrast && <SettingSwitch label="Higher contrast" description="Strengthen secondary text and panel boundaries" checked={settings.highContrast} onChange={(highContrast) => onChange({ highContrast })} />}
    {controls && <SettingSwitch label="Larger controls" description="Increase interactive target sizes throughout the workspace" checked={settings.largerControls} onChange={(largerControls) => onChange({ largerControls })} />}
  </SettingSection>;
}
