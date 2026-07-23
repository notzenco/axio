import type { KeyboardEvent, PointerEvent } from "react";

interface PanelResizeHandleProps {
  label: string;
  max: number;
  min: number;
  onChange: (width: number) => void;
  onReset: () => void;
  side: "left" | "right";
  value: number;
}

export function PanelResizeHandle({ label, max, min, onChange, onReset, side, value }: PanelResizeHandleProps) {
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = value;
    document.body.classList.add("resizing-panel");
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      onChange(startWidth + (side === "left" ? delta : -delta));
    };
    const onUp = () => {
      document.body.classList.remove("resizing-panel");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (!direction) return;
    event.preventDefault();
    onChange(value + direction * (side === "left" ? 12 : -12));
  };

  return (
    <div
      className={`panel-resize-handle ${side}`}
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={value}
      tabIndex={0}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
    ><span></span></div>
  );
}
