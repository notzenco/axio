import {
  Add20Regular,
  CodeText20Regular,
  Folder20Regular,
  FullScreenMaximize20Regular,
  Search20Regular,
  Settings20Regular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useLightDismiss } from "../hooks/useLightDismiss";
import type { WorkspaceTask } from "../types";

interface CommandPaletteProps {
  onClose: () => void;
  onCommand: (command: string) => void;
  open: boolean;
  tasks: WorkspaceTask[];
}

const commands: { id: string; icon: ComponentType; name: string; detail: string }[] = [
  { id: "new", icon: Add20Regular, name: "New task", detail: "Define an outcome and isolated worktree" },
  { id: "focus", icon: FullScreenMaximize20Regular, name: "Toggle focus mode", detail: "Hide workspace navigation and context tools" },
  { id: "review", icon: CodeText20Regular, name: "Open review", detail: "Inspect the current local changes" },
  { id: "settings", icon: Settings20Regular, name: "Settings", detail: "Customise appearance, workspace, composer, and accessibility" },
];

export function CommandPalette({ onClose, onCommand, open, tasks }: CommandPaletteProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
  const hasWorkspace = tasks.length > 0;
  const visibleTasks = tasks.filter((task) => task.title.toLowerCase().includes(normalized));
  const availableCommands = commands
    .filter((command) => hasWorkspace || command.id !== "review")
    .map((command) => !hasWorkspace && command.id === "new"
      ? { ...command, icon: Folder20Regular, name: "Open workspace", detail: "Choose a local Git repository" }
      : command);
  const visibleCommands = availableCommands.filter((command) => `${command.name} ${command.detail}`.toLowerCase().includes(normalized));
  const choose = (value: string) => {
    onClose();
    onCommand(value);
  };
  return (
    <dialog id="command-palette" className="palette" ref={ref}>
      <form method="dialog" onSubmit={(event) => event.preventDefault()}>
        <label><Search20Regular /><input ref={inputRef} type="search" placeholder="Switch task or run a command…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>Esc</kbd></label>
        {visibleTasks.length > 0 && <div className="palette-section"><span>Tasks</span>{visibleTasks.map((task) => <button key={task.id} type="button" onClick={() => choose(task.id)}><i className="command-icon"><Folder20Regular /></i><span><strong>{task.title}</strong><small>{task.worktree}</small></span></button>)}</div>}
        {visibleCommands.length > 0 && <div className="palette-section"><span>Commands</span>{visibleCommands.map((command) => {
          const Icon = command.icon;
          return <button key={command.id} type="button" onClick={() => choose(command.id)}><i className="command-icon"><Icon /></i><span><strong>{command.name}</strong><small>{command.detail}</small></span></button>;
        })}</div>}
        {visibleTasks.length + visibleCommands.length === 0 && <p className="palette-empty" role="status"><strong>No matches</strong><span>Try a task name or command.</span></p>}
      </form>
    </dialog>
  );
}
