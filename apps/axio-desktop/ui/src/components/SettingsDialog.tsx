import {
  Accessibility20Regular,
  Chat20Regular,
  Dismiss20Regular,
  PaintBrush20Regular,
  PanelLeft20Regular,
  Search20Regular,
  Settings20Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { AppSettings } from "../hooks/useSettings";
import { useLightDismiss } from "../hooks/useLightDismiss";
import { AccessibilitySettings } from "./settings/AccessibilitySettings";
import { AppearanceSettings } from "./settings/AppearanceSettings";
import { ComposerSettings } from "./settings/ComposerSettings";
import { WorkspaceSettings } from "./settings/WorkspaceSettings";

type SettingsCategory = keyof AppSettings;
export type UpdateSettings = <K extends SettingsCategory>(section: K, patch: Partial<AppSettings[K]>) => void;

interface SettingsDialogProps {
  onClose: () => void;
  onReset: () => void;
  onUpdate: UpdateSettings;
  open: boolean;
  settings: AppSettings;
}

const categories: { id: SettingsCategory; icon: ComponentType; label: string }[] = [
  { id: "appearance", icon: PaintBrush20Regular, label: "Appearance" },
  { id: "workspace", icon: PanelLeft20Regular, label: "Workspace" },
  { id: "composer", icon: Chat20Regular, label: "Composer" },
  { id: "accessibility", icon: Accessibility20Regular, label: "Accessibility" },
];

const searchTerms = [
  "appearance accent colour violet cyan amber glass intensity transparency compact timeline density",
  "workspace sidebar inspector launch startup default context tool browser files review output plan toolbar navigation labels icons badge count status bar branch checks",
  "composer send enter keyboard direction message default target audience agent routing",
  "accessibility reduced motion animation high contrast larger controls buttons targets",
];

export function SettingsDialog({ onClose, onReset, onUpdate, open, settings }: SettingsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("appearance");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery("");
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  useLightDismiss(ref, useCallback(onClose, [onClose]));

  const normalized = query.trim().toLowerCase();
  const hasResults = !normalized || searchTerms.some((terms) => terms.includes(normalized));
  const showAll = normalized.length > 0;

  return (
    <dialog id="settings-dialog" className="modal settings-modal" ref={ref}>
      <form method="dialog" onSubmit={(event) => { event.preventDefault(); onClose(); }}>
        <header className="settings-header">
          <div><span className="modal-symbol"><Settings20Regular /></span><div><strong>Settings</strong><p>Personalise how Axio looks and behaves.</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings"><Dismiss20Regular /></button>
        </header>
        <label className="settings-search">
          <Search20Regular />
          <input ref={inputRef} type="search" placeholder="Search settings" value={query} onChange={(event) => setQuery(event.target.value)} />
          {query && <button className="icon-button" type="button" aria-label="Clear settings search" onClick={() => { setQuery(""); inputRef.current?.focus(); }}><Dismiss20Regular /></button>}
        </label>
        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Settings categories">
            {categories.map((category) => {
              const Icon = category.icon;
              return <button key={category.id} type="button" className={activeCategory === category.id && !showAll ? "active" : ""} aria-current={activeCategory === category.id && !showAll ? "page" : undefined} onClick={() => { setActiveCategory(category.id); setQuery(""); }}><Icon />{category.label}</button>;
            })}
          </nav>
          <div className="settings-content">
            {(showAll || activeCategory === "appearance") && <AppearanceSettings query={query} settings={settings.appearance} onChange={(patch) => onUpdate("appearance", patch)} />}
            {(showAll || activeCategory === "workspace") && <WorkspaceSettings query={query} settings={settings.workspace} onChange={(patch) => onUpdate("workspace", patch)} />}
            {(showAll || activeCategory === "composer") && <ComposerSettings query={query} settings={settings.composer} onChange={(patch) => onUpdate("composer", patch)} />}
            {(showAll || activeCategory === "accessibility") && <AccessibilitySettings query={query} settings={settings.accessibility} onChange={(patch) => onUpdate("accessibility", patch)} />}
            {!hasResults && <div className="settings-empty" role="status"><Search20Regular /><strong>No settings found</strong><p>Try a broader word such as “review”, “colour”, or “motion”.</p></div>}
          </div>
        </div>
        <footer className="settings-footer"><button className="quiet-button" type="button" onClick={onReset}>Reset all</button><button className="primary-button" type="submit">Done</button></footer>
      </form>
    </dialog>
  );
}
