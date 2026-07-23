import { useEffect, useState } from "react";
import type { ContextPanel } from "../types";

export type AccentColor = "violet" | "cyan" | "amber";
export type DefaultAudience = "all" | "first-agent";

export interface AppSettings {
  accessibility: {
    highContrast: boolean;
    largerControls: boolean;
    reduceMotion: boolean;
  };
  appearance: {
    accent: AccentColor;
    compactTimeline: boolean;
    glass: number;
  };
  composer: {
    defaultAudience: DefaultAudience;
    sendOnEnter: boolean;
  };
  workspace: {
    autoOpenReview: boolean;
    defaultContextPanel: ContextPanel;
    inspectorOnLaunch: boolean;
    showReviewBadge: boolean;
    showStatusBar: boolean;
    showToolbarLabels: boolean;
    sidebarOnLaunch: boolean;
  };
}

export const defaultSettings: AppSettings = {
  accessibility: { highContrast: false, largerControls: false, reduceMotion: false },
  appearance: { accent: "violet", compactTimeline: false, glass: 72 },
  composer: { defaultAudience: "all", sendOnEnter: true },
  workspace: {
    autoOpenReview: true,
    defaultContextPanel: "diff",
    inspectorOnLaunch: false,
    showReviewBadge: true,
    showStatusBar: true,
    showToolbarLabels: true,
    sidebarOnLaunch: true,
  },
};

const STORAGE_KEY = "axio-settings-v1";
const LEGACY_STORAGE_KEY = "axio-appearance";
const accents: Record<AccentColor, [string, string]> = {
  amber: ["#ffb63d", "#d88916"],
  cyan: ["#67d9e7", "#269aaa"],
  violet: ["#9a7cff", "#7959f4"],
};

function loadSettings(): AppSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<AppSettings> | null;
    if (saved) {
      return {
        accessibility: { ...defaultSettings.accessibility, ...saved.accessibility },
        appearance: { ...defaultSettings.appearance, ...saved.appearance },
        composer: { ...defaultSettings.composer, ...saved.composer },
        workspace: { ...defaultSettings.workspace, ...saved.workspace },
      };
    }
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? "null");
    if (legacy) return {
      ...defaultSettings,
      accessibility: { ...defaultSettings.accessibility, reduceMotion: Boolean(legacy.reduceMotion) },
      appearance: {
        ...defaultSettings.appearance,
        compactTimeline: Boolean(legacy.compact),
        glass: Number(legacy.glass ?? defaultSettings.appearance.glass),
      },
    };
  } catch {
    // Invalid local settings fall back to safe defaults.
  }
  return defaultSettings;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    const [accent, accentStrong] = accents[settings.appearance.accent];
    document.body.classList.toggle("compact", settings.appearance.compactTimeline);
    document.body.classList.toggle("reduce-motion", settings.accessibility.reduceMotion);
    document.body.classList.toggle("high-contrast", settings.accessibility.highContrast);
    document.body.classList.toggle("larger-controls", settings.accessibility.largerControls);
    document.body.classList.toggle("statusbar-hidden", !settings.workspace.showStatusBar);
    document.body.classList.toggle("toolbar-labels-hidden", !settings.workspace.showToolbarLabels);
    document.documentElement.style.setProperty("--glass-alpha", String(settings.appearance.glass / 100));
    document.documentElement.style.setProperty("--violet", accent);
    document.documentElement.style.setProperty("--violet-strong", accentStrong);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Settings remain session-local when persistence is unavailable.
    }
  }, [settings]);

  function update<K extends keyof AppSettings>(section: K, patch: Partial<AppSettings[K]>) {
    setSettings((current) => ({ ...current, [section]: { ...current[section], ...patch } }));
  }

  return {
    reset: () => setSettings(defaultSettings),
    settings,
    update,
  };
}
