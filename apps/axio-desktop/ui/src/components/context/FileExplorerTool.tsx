import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowClockwise20Regular, Code20Regular, Document20Regular, Folder20Regular, Search20Regular } from "@fluentui/react-icons";
import { repositoryTree } from "../../data/repository-tree";
import { readRepositoryFile } from "../../services/tauri";
import type { RepositoryFileContent, RepositorySnapshot } from "../../types";

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
  const [preview, setPreview] = useState<RepositoryFileContent | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [loading, setLoading] = useState(false);
  const visible = useMemo(() => repositoryTree(paths, query), [paths, query]);

  useEffect(() => {
    if (!selected || !paths.includes(selected)) {
      setSelected(paths[0] ?? "");
      setPreview(null);
    }
  }, [paths, selected]);

  const selectFile = async (path: string) => {
    setSelected(path);
    setPreview(null);
    setPreviewError("");
    setLoading(true);
    try {
      const content = await readRepositoryFile(path);
      if (content) setPreview(content);
      else setPreviewError("File contents are available in the native desktop build.");
    } catch (error) {
      setPreviewError(String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`inspector-panel files-panel${active ? " active" : ""}`} id="panel-files" role="tabpanel">
      <label className="file-search"><Search20Regular /><input type="search" placeholder="Filter files" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="file-tree" role="tree" aria-label="Workspace files">
        {visible.map((entry) => <button key={entry.path} type="button" role="treeitem" aria-selected={!entry.folder && selected === entry.path} className={selected === entry.path ? "active" : ""} style={{ "--tree-depth": entry.depth } as CSSProperties} onClick={() => { if (!entry.folder) void selectFile(entry.path); }}>{entry.folder ? <Folder20Regular /> : entry.name.endsWith(".tsx") || entry.name.endsWith(".rs") ? <Code20Regular /> : <Document20Regular />}<span>{entry.name}</span></button>)}
      </div>
      <div className="file-preview">
        <span className="eyebrow">Selected file</span><strong>{selected}</strong>
        {loading && <p>Reading from the active repository…</p>}
        {!loading && previewError && <p className="file-preview-error">{previewError}</p>}
        {!loading && preview?.binary && <p>Binary file · {preview.size_bytes.toLocaleString()} bytes</p>}
        {!loading && preview?.content != null && (
          <>
            <p>{preview.size_bytes.toLocaleString()} bytes{preview.truncated ? " · preview limited to 256 KiB" : ""}</p>
            <pre className="repository-file-content"><code>{preview.content}</code></pre>
          </>
        )}
        {!loading && !preview && !previewError && <p>{repository ? "Select a file to load a safe, read-only preview." : "Repository files are unavailable outside an open native workspace."}</p>}
      </div>
      <footer className="tool-status">
        <span><i className={repository ? "live" : ""}></i>{repository ? `${repository.files.length}${repository.files_truncated ? "+" : ""} files` : "Repository unavailable"}</span>
        <button type="button" onClick={onRefresh}><ArrowClockwise20Regular /> Refresh</button>
      </footer>
    </section>
  );
}
