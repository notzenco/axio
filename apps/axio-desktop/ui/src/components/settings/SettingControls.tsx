import type { ReactNode } from "react";

export function matchesSetting(query: string, ...terms: string[]) {
  const normalized = query.trim().toLowerCase();
  return !normalized || terms.some((term) => term.toLowerCase().includes(normalized));
}

export function SettingSection({ children, description, icon, title }: { children: ReactNode; description: string; icon: string; title: string }) {
  return <section className="settings-section"><header><span className="fluent settings-section-icon">{icon}</span><div><h2>{title}</h2><p>{description}</p></div></header><div className="settings-section-body">{children}</div></section>;
}

export function SettingSwitch({ checked, description, label, onChange }: { checked: boolean; description: string; label: string; onChange: (checked: boolean) => void }) {
  return <label className="setting-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

export function SettingSelect({ children, description, label, onChange, value }: { children: ReactNode; description: string; label: string; onChange: (value: string) => void; value: string }) {
  return <label className="setting-select"><span><strong>{label}</strong><small>{description}</small></span><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

export function SettingSlider({ description, label, max, min, onChange, suffix = "", value }: { description: string; label: string; max: number; min: number; onChange: (value: number) => void; suffix?: string; value: number }) {
  return <label className="setting-slider"><span><span><strong>{label}</strong><small>{description}</small></span><output>{value}{suffix}</output></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
