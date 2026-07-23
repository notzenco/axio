import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSettings } from "./useSettings";
import type { ContextPanel, SidebarPanel } from "../types";
import { panelSizeLimits, usePanelSizes } from "./usePanelSizes";

export function useLayout(defaults: AppSettings["workspace"]) {
  const [compactViewport, setCompactViewport] = useState(() => matchMedia("(max-width: 720px)").matches);
  const [sidebarOpen, setSidebarOpenState] = useState(() => defaults.sidebarOnLaunch && !matchMedia("(max-width: 720px)").matches);
  const [inspectorOpen, setInspectorOpenState] = useState(() => defaults.inspectorOnLaunch && !matchMedia("(max-width: 720px)").matches);
  const [focusMode, setFocusModeState] = useState(false);
  const [sidebarPanel, setSidebarPanelState] = useState<SidebarPanel>("tasks");
  const [inspectorPanel, setInspectorPanelState] = useState<ContextPanel>("diff");
  const panelSizes = usePanelSizes();
  const beforeFocus = useRef({ sidebarOpen: true, inspectorOpen: false });
  const lastOverlayTrigger = useRef<HTMLElement | null>(null);

  const rememberTrigger = () => {
    if (document.activeElement instanceof HTMLElement) lastOverlayTrigger.current = document.activeElement;
  };

  const setSidebarOpen = useCallback((open: boolean) => {
    if (open) {
      rememberTrigger();
      if (compactViewport) setInspectorOpenState(false);
    }
    setSidebarOpenState(open);
  }, [compactViewport]);

  const setInspectorOpen = useCallback((open: boolean) => {
    if (open) {
      rememberTrigger();
      if (compactViewport) setSidebarOpenState(false);
    }
    setInspectorOpenState(open);
  }, [compactViewport]);

  const setFocusMode = useCallback((enabled: boolean) => {
    setFocusModeState((current) => {
      if (current === enabled) return current;
      if (enabled) beforeFocus.current = { sidebarOpen, inspectorOpen };
      else {
        setSidebarOpenState(beforeFocus.current.sidebarOpen);
        setInspectorOpenState(beforeFocus.current.inspectorOpen);
      }
      return enabled;
    });
  }, [inspectorOpen, sidebarOpen]);

  const showSidebarPanel = useCallback((panel: SidebarPanel) => {
    setSidebarPanelState(panel);
    if (focusMode) setFocusMode(false);
    setSidebarOpen(true);
  }, [focusMode, setFocusMode, setSidebarOpen]);

  const showInspectorPanel = useCallback((panel: ContextPanel, expand = false) => {
    setInspectorPanelState(panel);
    if (focusMode) setFocusMode(false);
    setInspectorOpen(true);
    if (expand && !compactViewport) panelSizes.setContextWidth(640);
  }, [compactViewport, focusMode, panelSizes, setFocusMode, setInspectorOpen]);

  const closeOverlay = useCallback(() => {
    if (inspectorOpen) setInspectorOpen(false);
    else setSidebarOpen(false);
    lastOverlayTrigger.current?.focus();
  }, [inspectorOpen, setInspectorOpen, setSidebarOpen]);

  useEffect(() => {
    const media = matchMedia("(max-width: 720px)");
    const onChange = () => {
      setCompactViewport(media.matches);
      if (media.matches && sidebarOpen && inspectorOpen) setInspectorOpenState(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [inspectorOpen, sidebarOpen]);

  useEffect(() => {
    document.body.classList.toggle("sidebar-hidden", !sidebarOpen);
    document.body.classList.toggle("inspector-hidden", !inspectorOpen);
    document.body.classList.toggle("focus-mode", focusMode);
    document.body.classList.toggle("panel-overlay-open", compactViewport && (sidebarOpen || inspectorOpen) && !focusMode);
  }, [compactViewport, focusMode, inspectorOpen, sidebarOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode(!focusMode);
      }
      if (event.key === "Escape" && compactViewport && (sidebarOpen || inspectorOpen)) closeOverlay();
      if (event.key !== "Tab" || !compactViewport || (!sidebarOpen && !inspectorOpen)) return;
      const panel = document.querySelector(inspectorOpen ? "#inspector" : "#sidebar");
      if (!(panel instanceof HTMLElement)) return;
      const controls = [...panel.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary")]
        .filter((control) => !control.hidden && control.offsetParent !== null);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeOverlay, compactViewport, focusMode, inspectorOpen, setFocusMode, sidebarOpen]);

  return {
    closeOverlay,
    compactViewport,
    focusMode,
    contextWidth: panelSizes.contextWidth,
    inspectorOpen,
    inspectorPanel,
    setFocusMode,
    setContextWidth: panelSizes.setContextWidth,
    setInspectorOpen,
    setSidebarOpen,
    setWorkspaceWidth: panelSizes.setWorkspaceWidth,
    showInspectorPanel,
    showSidebarPanel,
    sidebarOpen,
    sidebarPanel,
    workspaceWidth: panelSizes.workspaceWidth,
    toggleContextWidth: () => panelSizes.setContextWidth(panelSizes.contextWidth >= 600 ? panelSizeLimits.context.default : 640),
  };
}

export type LayoutController = ReturnType<typeof useLayout>;
