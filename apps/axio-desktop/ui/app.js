const fallbackSnapshot = {
  project: "axio",
  branch: "main",
  agents: [
    {
      id: "codex-01",
      name: "Codex",
      kind: "codex",
      status: "running",
      task: "Map the workspace boundary",
      worktree: "agent/workspace-foundation",
    },
    {
      id: "claude-01",
      name: "Claude Code",
      kind: "claude_code",
      status: "waiting",
      task: "Review the initial architecture",
      worktree: "agent/architecture-review",
    },
  ],
};

const invoke = window.__TAURI__?.core?.invoke;
const agentGrid = document.querySelector("#agent-grid");
const runningCount = document.querySelector("#running-count");

function statusAction(status) {
  if (status === "running") return { label: "Pause", next: "waiting" };
  if (status === "waiting") return { label: "Resume", next: "running" };
  return { label: "Start", next: "starting" };
}

function render(snapshot) {
  document.querySelector("#project-name").textContent = snapshot.project;
  document.querySelector("#branch-name").textContent = snapshot.branch;
  runningCount.textContent = snapshot.agents.filter((agent) => agent.status === "running").length;
  agentGrid.replaceChildren();

  for (const agent of snapshot.agents) {
    const action = statusAction(agent.status);
    const article = document.createElement("article");
    article.className = `agent-card status-${agent.status}`;

    const header = document.createElement("div");
    header.className = "agent-card-header";
    const identity = document.createElement("div");
    identity.className = "agent-identity";
    const avatar = document.createElement("span");
    avatar.className = "agent-avatar";
    avatar.textContent = agent.name.slice(0, 1);
    const labels = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = agent.name;
    const worktree = document.createElement("small");
    worktree.textContent = agent.worktree ?? "current worktree";
    labels.append(name, worktree);
    identity.append(avatar, labels);
    const status = document.createElement("span");
    status.className = "status-label";
    status.textContent = agent.status;
    header.append(identity, status);

    const task = document.createElement("p");
    task.className = "agent-task";
    task.textContent = agent.task;

    const log = document.createElement("div");
    log.className = "agent-log";
    const prompt = document.createElement("span");
    prompt.textContent = agent.status === "waiting" ? "Waiting for your direction" : "Inspecting workspace structure";
    const detail = document.createElement("span");
    detail.textContent = agent.status === "waiting" ? "Review gate is open" : "Rust core · Tauri shell";
    log.append(prompt, detail);

    const footer = document.createElement("div");
    footer.className = "agent-card-footer";
    const kind = document.createElement("span");
    kind.textContent = agent.kind.replaceAll("_", " ");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", async () => {
      if (!invoke) return;
      button.disabled = true;
      try {
        render(await invoke("set_agent_status", { id: agent.id, next: action.next }));
      } finally {
        button.disabled = false;
      }
    });
    footer.append(kind, button);
    article.append(header, task, log, footer);
    agentGrid.append(article);
  }
}

document.querySelector("#composer").addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = document.querySelector("#prompt");
  if (!prompt.value.trim()) return;
  const item = document.createElement("li");
  item.innerHTML = '<span class="activity-icon">→</span><div><strong>Direction queued</strong><small>Workspace message</small></div>';
  document.querySelector("#activity-list").prepend(item);
  prompt.value = "";
});

if (invoke) {
  invoke("workspace_snapshot").then(render).catch(() => render(fallbackSnapshot));
} else {
  render(fallbackSnapshot);
}
