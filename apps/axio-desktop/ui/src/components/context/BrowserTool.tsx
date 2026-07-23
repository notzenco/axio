import {
  ArrowLeft20Regular,
  ArrowRight20Regular,
  Globe20Regular,
  Link20Regular,
  Open20Regular,
} from "@fluentui/react-icons";

export function BrowserTool({ active }: { active: boolean }) {
  return (
    <section className={`inspector-panel browser-panel${active ? " active" : ""}`} id="panel-browser" role="tabpanel">
      <div className="browser-toolbar" aria-label="Browser preview controls unavailable">
        <button type="button" aria-label="Back unavailable" disabled><ArrowLeft20Regular /></button>
        <button type="button" aria-label="Forward unavailable" disabled><ArrowRight20Regular /></button>
        <label><Link20Regular /><input aria-label="Browser address unavailable" value="" placeholder="No preview service connected" readOnly disabled /></label>
        <button type="button" aria-label="Open address unavailable" disabled><Open20Regular /></button>
      </div>
      <div className="browser-viewport browser-unavailable">
        <div className="browser-preview-card">
          <span className="browser-preview-icon"><Globe20Regular /></span>
          <strong>Browser preview is not connected</strong>
          <p>No local service detected</p>
          <small>Axio does not embed a webview yet. Use a terminal session to run your preview service and open its URL in your system browser.</small>
        </div>
      </div>
      <footer className="tool-status"><span><i></i> Not connected</span><span>Embedded browsing unavailable</span></footer>
    </section>
  );
}
