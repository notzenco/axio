import { useState, type FormEvent } from "react";
import {
  ArrowClockwise20Regular,
  ArrowLeft20Regular,
  ArrowRight20Regular,
  Globe20Regular,
  Link20Regular,
  Open20Regular,
} from "@fluentui/react-icons";

export function BrowserTool({ active }: { active: boolean }) {
  const [address, setAddress] = useState("http://localhost:4173");
  const [loadedAddress, setLoadedAddress] = useState("http://localhost:4173");
  const [revision, setRevision] = useState(0);
  const navigate = (event: FormEvent) => {
    event.preventDefault();
    const next = address.trim();
    if (next) setLoadedAddress(next);
  };

  return (
    <section className={`inspector-panel browser-panel${active ? " active" : ""}`} id="panel-browser" role="tabpanel">
      <form className="browser-toolbar" onSubmit={navigate}>
        <button type="button" aria-label="Back" disabled><ArrowLeft20Regular /></button>
        <button type="button" aria-label="Forward" disabled><ArrowRight20Regular /></button>
        <button type="button" aria-label="Reload preview" onClick={() => setRevision((current) => current + 1)}><ArrowClockwise20Regular /></button>
        <label><Link20Regular /><input aria-label="Browser address" value={address} onChange={(event) => setAddress(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /></label>
        <button type="submit" aria-label="Open address"><Open20Regular /></button>
      </form>
      <div className="browser-viewport" key={revision}>
        <div className="browser-preview-card">
          <span className="browser-preview-icon"><Globe20Regular /></span>
          <strong>Task browser</strong>
          <p>{loadedAddress}</p>
          <small>A live task webview will attach here when the local preview service is connected.</small>
        </div>
      </div>
      <footer className="tool-status"><span><i></i> Local preview target</span><span>Webview boundary ready</span></footer>
    </section>
  );
}
