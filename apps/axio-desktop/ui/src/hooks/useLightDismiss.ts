import { useEffect, type RefObject } from "react";

export function useLightDismiss(
  ref: RefObject<HTMLDialogElement | null>,
  requestClose: () => void,
) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left
        || event.clientX > bounds.right
        || event.clientY < bounds.top
        || event.clientY > bounds.bottom;
      if (outside) requestClose();
    };
    const onCancel = (event: Event) => {
      event.preventDefault();
      requestClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      requestClose();
    };
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, requestClose]);
}
