import { useEffect, useState } from "react";

const STORAGE_KEY = "axio-panel-sizes-v1";
export const panelSizeLimits = {
  context: { default: 390, max: 720, min: 300 },
  workspace: { default: 236, max: 380, min: 190 },
} as const;

type PanelSizes = {
  context: number;
  workspace: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadPanelSizes(): PanelSizes {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<PanelSizes>;
    return {
      context: clamp(Number(saved.context) || panelSizeLimits.context.default, panelSizeLimits.context.min, panelSizeLimits.context.max),
      workspace: clamp(Number(saved.workspace) || panelSizeLimits.workspace.default, panelSizeLimits.workspace.min, panelSizeLimits.workspace.max),
    };
  } catch {
    return { context: panelSizeLimits.context.default, workspace: panelSizeLimits.workspace.default };
  }
}

export function usePanelSizes() {
  const [sizes, setSizes] = useState<PanelSizes>(loadPanelSizes);

  useEffect(() => {
    document.documentElement.style.setProperty("--context-width", `${sizes.context}px`);
    document.documentElement.style.setProperty("--sidebar-width", `${sizes.workspace}px`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
    } catch {
      // Panel sizes remain session-local when persistence is unavailable.
    }
  }, [sizes]);

  const setContextWidth = (context: number) => setSizes((current) => {
    const responsiveMax = window.innerWidth > 960
      ? Math.max(panelSizeLimits.context.min, window.innerWidth - current.workspace - 480)
      : panelSizeLimits.context.max;
    return {
      ...current,
      context: clamp(context, panelSizeLimits.context.min, Math.min(panelSizeLimits.context.max, responsiveMax)),
    };
  });
  const setWorkspaceWidth = (workspace: number) => setSizes((current) => {
    const responsiveMax = window.innerWidth > 960
      ? Math.max(panelSizeLimits.workspace.min, window.innerWidth - current.context - 480)
      : panelSizeLimits.workspace.max;
    return {
      ...current,
      workspace: clamp(workspace, panelSizeLimits.workspace.min, Math.min(panelSizeLimits.workspace.max, responsiveMax)),
    };
  });

  return { contextWidth: sizes.context, setContextWidth, setWorkspaceWidth, workspaceWidth: sizes.workspace };
}
