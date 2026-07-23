import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowClockwise20Regular, Code20Regular, Document20Regular, Folder20Regular, Search20Regular } from "@fluentui/react-icons";
import { repositoryTree } from "../../data/repository-tree";
import type { RepositorySnapshot } from "../../types";

const previewFiles = [
  "apps/axio-desktop/ui/src/App.tsx",
  "apps/axio-desktop/ui/styles.css",
  "crates/axio-core/src/lib.rs",
  "Cargo.toml",
];

export function FileExplorerTool({ active, onRefresh, repository }: { active: boolean; onRefresh: () => void; repository?: RepositorySnapshot | null }) {
  const paths = repository?.files ?? previewFiles;
  const [selected, setSelected] = useState(paths[0] ?? "");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => repositoryTree(paths, query), [paths, query]);

  useEffect(() => {
    if (!selected || !paths.includes(selected)) setSelected(paths[0] ?? "");
  }, [paths, selected]);

  return (
    <section className={`inspector-panel files-panel${active ? " active" : ""}`} id="panel-files" role="tabpanel">
      <label className="file-search"><Search20Regular /><input type="search" placeholder="Filter files" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="file-tree" role="tree" aria-label="Workspace files">
        {visible.map((entry) => <button key={entry.path} type="button" role="treeitem" aria-selected={!entry.folder && selected === entry.path} className={selected === entry.path ? "active" : ""} style={{ "--tree-depth": entry.depth } as CSSProperties} onClick={() => !entry.folder && setSelected(entry.path)}>{entry.folder ? <Folder20Regular /> : entry.name.endsWith(".tsx") || entry.name.endsWith(".rs") ? <Code20Regular /> : <Document20Regular />}<span>{entry.name}</span></button>)}
      </div>
      <div className="file-preview">
        <span className="eyebrow">Selected file</span><strong>{selected}</strong>
        <p>{repository ? "Discovered from the active Git repository. Content preview is the next filesystem boundary." : "Preview data. Launch the native desktop build to inspect a real repository."}</p>
      </div>
      <footer className="tool-status">
        <span><i className={repository ? "live" : ""}></i>{repository ? `${repository.files.length}${repository.files_truncated ? "+" : ""} files` : "Preview data"}</span>
        <button type="button" onClick={onRefresh}><ArrowClockwise20Regular /> Refresh</button>
      </footer>
    </section>
  );
}
