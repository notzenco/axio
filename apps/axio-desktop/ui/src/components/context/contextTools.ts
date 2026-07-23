import {
  ClipboardTaskListLtr20Regular,
  CodeText20Regular,
  Folder20Regular,
  Globe20Regular,
  WindowConsole20Regular,
} from "@fluentui/react-icons";
import type { ContextPanel } from "../../types";

export const contextTools = [
  { id: "browser", icon: Globe20Regular, label: "Browser", title: "Task browser" },
  { id: "files", icon: Folder20Regular, label: "Files", title: "File explorer" },
  { id: "diff", icon: CodeText20Regular, label: "Review", title: "Review gate" },
  { id: "output", icon: WindowConsole20Regular, label: "Output", title: "Session output" },
  { id: "plan", icon: ClipboardTaskListLtr20Regular, label: "State", title: "Task state" },
] satisfies { id: ContextPanel; icon: typeof Globe20Regular; label: string; title: string }[];

export const workspaceTools = contextTools.filter((tool) => tool.id !== "diff");
