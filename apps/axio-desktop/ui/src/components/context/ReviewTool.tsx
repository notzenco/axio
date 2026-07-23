import { Code20Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { diffFiles, type DiffFileKey } from "../../data/diff-files";
import type { WorkspaceTask } from "../../types";

export function ReviewTool({ active, onDecideReview, task }: { active: boolean; onDecideReview: (approved: boolean) => void; task: WorkspaceTask }) {
  const [activeFile, setActiveFile] = useState<DiffFileKey>("app");
  const file = diffFiles[activeFile];
  return (
    <section className={`inspector-panel${active ? " active" : ""}`} id="panel-diff" role="tabpanel">
      <div className="diff-file-list" role="tablist" aria-label="Changed files">
        {(Object.keys(diffFiles) as DiffFileKey[]).map((key) => <button key={key} className={activeFile === key ? "active" : ""} type="button" role="tab" aria-selected={activeFile === key} onClick={() => setActiveFile(key)}><span>{diffFiles[key].path}</span><small>{diffFiles[key].added} {diffFiles[key].removed}</small></button>)}
      </div>
      <div className="file-toolbar"><Code20Regular /><span>{file.path}</span><span className="file-status">Modified</span><span className="add">{file.added}</span><span className="remove">{file.removed}</span></div>
      <pre className="diff-view" aria-label={`Local diff for ${file.path}`}><code>{file.lines.map(([kind, number, value]) => <span className={`line ${kind}`} key={`${number}-${value}`}><b>{number}</b>{value}</span>)}</code></pre>
      <div className="review-footer"><span>{task.changed_files} files · local worktree</span><div><button className="secondary-button" type="button" disabled={task.review !== "pending"} onClick={() => onDecideReview(false)}>Return with feedback</button><button className="stage-button" type="button" disabled={task.review !== "pending"} onClick={() => onDecideReview(true)}>Approve review</button></div></div>
    </section>
  );
}
