import { PaintBrush20Regular } from "@fluentui/react-icons";
import type { AccentColor, AppSettings } from "../../hooks/useSettings";
import { matchesSetting, SettingSection, SettingSlider, SettingSwitch } from "./SettingControls";

interface Props {
  onChange: (patch: Partial<AppSettings["appearance"]>) => void;
  query: string;
  settings: AppSettings["appearance"];
}

export function AppearanceSettings({ onChange, query, settings }: Props) {
  const accentVisible = matchesSetting(query, "accent colour violet cyan amber theme");
  const glassVisible = matchesSetting(query, "glass intensity transparency blur");
  const compactVisible = matchesSetting(query, "compact timeline density activity");
  if (!accentVisible && !glassVisible && !compactVisible) return null;
  return <SettingSection icon={<PaintBrush20Regular />} title="Appearance" description="Shape the visual character of your workspace.">
    {accentVisible && <div className="setting-row accent-setting"><span><strong>Accent colour</strong><small>Used for focus, selection, and primary actions</small></span><div className="accent-options" role="radiogroup" aria-label="Accent colour">{(["violet", "cyan", "amber"] as AccentColor[]).map((accent) => <button key={accent} type="button" className={`accent-swatch ${accent}${settings.accent === accent ? " active" : ""}`} role="radio" aria-checked={settings.accent === accent} aria-label={accent} onClick={() => onChange({ accent })}></button>)}</div></div>}
    {glassVisible && <SettingSlider label="Glass intensity" description="Adjust panel opacity and background depth" min={30} max={100} suffix="%" value={settings.glass} onChange={(glass) => onChange({ glass })} />}
    {compactVisible && <SettingSwitch label="Compact timeline" description="Fit more agent activity on screen" checked={settings.compactTimeline} onChange={(compactTimeline) => onChange({ compactTimeline })} />}
  </SettingSection>;
}
