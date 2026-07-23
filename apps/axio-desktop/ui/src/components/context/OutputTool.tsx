import { useState } from "react";

export function OutputTool({ active }: { active: boolean }) {
  const [wrapOutput, setWrapOutput] = useState(false);
  return (
    <section className={`inspector-panel terminal-panel${active ? " active" : ""}${wrapOutput ? " wrap-output" : ""}`} id="panel-terminal" role="tabpanel">
      <div className="terminal-toolbar"><span><i></i> Completed · exit 0</span><div><span>PowerShell</span><button type="button" aria-pressed={wrapOutput} onClick={() => setWrapOutput(!wrapOutput)}>Wrap</button></div></div>
      <div className="command-record"><span>Latest command</span><code>cargo test --workspace</code></div>
      <pre><code><span className="terminal-path">PS W:\dev\personal\axio-workspace&gt;</span> cargo test --workspace{"\n\n"}running 5 tests{"\n"}test workspace::review_gate ... <b>ok</b>{"\n"}test workspace::task_selection ... <b>ok</b>{"\n"}test result: <b>ok</b>. 5 passed; 0 failed{"\n\n"}<span className="terminal-path">PS W:\dev\personal\axio-workspace&gt;</span> <i></i></code></pre>
    </section>
  );
}
