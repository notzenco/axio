import { useState, type CSSProperties } from "react";
import { Code20Regular, Document20Regular, Folder20Regular, Search20Regular } from "@fluentui/react-icons";

const files = [
  { depth: 0, folder: true, name: "apps", path: "apps" },
  { depth: 1, folder: true, name: "axio-desktop", path: "apps/axio-desktop" },
  { depth: 2, folder: true, name: "ui", path: "apps/axio-desktop/ui" },
  { depth: 3, folder: false, name: "App.tsx", path: "apps/axio-desktop/ui/src/App.tsx" },
  { depth: 3, folder: false, name: "styles.css", path: "apps/axio-desktop/ui/styles.css" },
  { depth: 0, folder: true, name: "crates", path: "crates" },
  { depth: 1, folder: true, name: "axio-core", path: "crates/axio-core" },
  { depth: 2, folder: false, name: "lib.rs", path: "crates/axio-core/src/lib.rs" },
  { depth: 0, folder: false, name: "Cargo.toml", path: "Cargo.toml" },
] as const;

export function FileExplorerTool({ active }: { active: boolean }) {
  const [selected, setSelected] = useState("apps/axio-desktop/ui/src/App.tsx");
  const [query, setQuery] = useState("");
  const visible = files.filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className={`inspector-panel files-panel${active ? " active" : ""}`} id="panel-files" role="tabpanel">
      <label className="file-search"><Search20Regular /><input type="search" placeholder="Filter files" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="file-tree" role="tree" aria-label="Workspace files">
        {visible.map((entry) => <button key={entry.path} type="button" role="treeitem" aria-selected={!entry.folder && selected === entry.path} className={selected === entry.path ? "active" : ""} style={{ "--tree-depth": entry.depth } as CSSProperties} onClick={() => !entry.folder && setSelected(entry.path)}>{entry.folder ? <Folder20Regular /> : entry.name.endsWith(".tsx") || entry.name.endsWith(".rs") ? <Code20Regular /> : <Document20Regular />}<span>{entry.name}</span></button>)}
      </div>
      <div className="file-preview">
        <span className="eyebrow">Selected file</span><strong>{selected}</strong>
        <p>File contents will stream from the active worktree through the native workspace service.</p>
      </div>
      <footer className="tool-status"><span>Active worktree</span><span>Read-only preview</span></footer>
    </section>
  );
}
