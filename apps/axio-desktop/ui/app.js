const fallbackSnapshot = {
  project: "axio",
  branch: "main",
  agents: [
    { id: "codex-01", name: "Codex", kind: "codex", status: "running", task: "Map the workspace boundary", worktree: "axio/unify-desktop" },
    { id: "claude-01", name: "Claude Code", kind: "claude_code", status: "waiting", task: "Review the interaction architecture", worktree: "axio/unify-desktop" },
  ],
  tasks: [
    { id: "desktop", title: "Unify the Axio desktop", status: "waiting", worktree: "axio/unify-desktop", agent_ids: ["codex-01", "claude-01"], unread: 1, changed_files: 3, review: "pending" },
    { id: "protocol", title: "Agent protocol refactor", status: "active", worktree: "axio/agent-protocol", agent_ids: ["codex-01"], unread: 0, changed_files: 0, review: "none" },
  ],
  selected_task: "desktop",
  activity: [
    { id: "activity-1", task_id: "desktop", agent_id: "codex-01", kind: "tool", summary: "Mapped the desktop boundary and shared Rust state", detail: "cargo test --workspace --locked", timestamp: "10:24" },
    { id: "activity-2", task_id: "desktop", agent_id: "claude-01", kind: "change", summary: "Implemented the unified task workspace", detail: "3 files changed in apps/axio-desktop/ui", timestamp: "10:29" },
    { id: "activity-3", task_id: "desktop", agent_id: "claude-01", kind: "approval", summary: "Review the proposed desktop changes", detail: "The task is paused at a local review gate", timestamp: "10:31" },
    { id: "activity-4", task_id: "protocol", agent_id: "codex-01", kind: "status", summary: "Protocol vocabulary is ready to extend", detail: "No external compatibility promise exists at 0.0.1", timestamp: "10:36" },
  ],
};

const invoke = window.__TAURI__?.core?.invoke;
const nativeWindow = window.__TAURI__?.window?.getCurrentWindow?.();
const body = document.body;
const agentList = document.querySelector("#agent-list");
const taskList = document.querySelector("#task-list");
const worktreeList = document.querySelector("#worktree-list");
const presence = document.querySelector("#presence");
const timeline = document.querySelector("#timeline");
const toast = document.querySelector("#toast");
const palette = document.querySelector("#command-palette");
const newTaskDialog = document.querySelector("#new-task-dialog");
const settingsDialog = document.querySelector("#settings-dialog");
let currentSnapshot = fallbackSnapshot;
let toastTimer;
let audienceIndex = 0;
let lastInspectorPanel = "diff";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function normalizedStatus(status) {
  return typeof status === "string" ? status.toLowerCase() : "idle";
}

function agentColor(agent) {
  if (!agent) return "violet";
  if (agent.kind === "codex") return "cyan";
  if (agent.kind === "claude_code") return "amber";
  return "violet";
}

function selectedTask() {
  return currentSnapshot.tasks.find((task) => task.id === currentSnapshot.selected_task) ?? currentSnapshot.tasks[0];
}

function nextTransition(status) {
  if (status === "running") return { label: "Pause", next: "waiting" };
  if (status === "waiting") return { label: "Resume", next: "running" };
  return { label: "Start", next: "starting" };
}

async function transitionAgent(agent, button) {
  const action = nextTransition(normalizedStatus(agent.status));
  button.disabled = true;
  try {
    if (invoke) currentSnapshot = await invoke("set_agent_status", { id: agent.id, next: action.next });
    else agent.status = action.next;
    renderWorkspace(currentSnapshot);
    showToast(`${agent.name} is now ${action.next}`);
  } catch (error) {
    showToast(String(error));
  } finally {
    button.disabled = false;
  }
}

function renderAgents(task) {
  agentList.replaceChildren();
  presence.replaceChildren();
  const activeStatuses = ["running", "waiting", "starting"];
  const activeCount = currentSnapshot.agents.filter((agent) => activeStatuses.includes(normalizedStatus(agent.status))).length;
  document.querySelector("#agent-total").textContent = `${activeCount} active`;
  document.querySelector("#status-agents").textContent = `${activeCount} agent${activeCount === 1 ? "" : "s"}`;

  for (const agent of currentSnapshot.agents) {
    const status = normalizedStatus(agent.status);
    const color = agentColor(agent);
    const row = element("button", `agent-row status-${status}`);
    row.type = "button";
    row.title = `${nextTransition(status).label} ${agent.name}`;
    row.append(element("i", `agent-dot ${color}`), element("span", "", agent.name), element("span", "", status));
    row.addEventListener("click", () => transitionAgent(agent, row));
    agentList.append(row);

    if (!task?.agent_ids.includes(agent.id)) continue;
    const chip = element("button", `presence-chip ${status}`);
    chip.type = "button";
    chip.title = `${agent.name}: ${status}. Click to ${nextTransition(status).label.toLowerCase()}.`;
    chip.append(element("i", color), element("span", "", agent.name));
    chip.addEventListener("click", () => transitionAgent(agent, chip));
    presence.append(chip);
  }
}

function renderTasks() {
  taskList.replaceChildren();
  worktreeList.replaceChildren();
  for (const task of currentSnapshot.tasks) {
    const isSelected = task.id === currentSnapshot.selected_task;
    const stateColor = task.status === "waiting" ? "amber" : task.status === "completed" ? "green" : "cyan";
    const row = element("button", `task-row${isSelected ? " active" : ""}`);
    row.type = "button";
    row.dataset.taskId = task.id;
    row.append(element("span", `task-state ${stateColor}`), element("span", "", task.title));
    if (task.unread > 0) row.append(element("b", "", String(task.unread)));
    row.addEventListener("click", () => selectTask(task.id));
    taskList.append(row);

    const worktree = element("button", `worktree-row${isSelected ? " active" : ""}`);
    worktree.type = "button";
    const branchName = task.worktree.split("/").slice(1).join("/") || task.worktree;
    const labels = element("span");
    labels.append(element("strong", "", branchName), element("small", "", task.worktree));
    worktree.append(element("span", `branch-dot ${isSelected ? "cyan" : ""}`), labels);
    worktree.addEventListener("click", () => selectTask(task.id));
    worktreeList.append(worktree);
  }

  const main = element("button", "worktree-row");
  main.type = "button";
  const labels = element("span");
  labels.append(element("strong", "", currentSnapshot.branch), element("small", "", "primary branch"));
  main.append(element("span", "branch-dot"), labels);
  main.addEventListener("click", () => showToast("Main is available as the primary workspace branch"));
  worktreeList.append(main);
  document.querySelector("#worktree-total").textContent = String(currentSnapshot.tasks.length + 1);
}

function renderToolDetail(activity) {
  const tool = element("div", "tool-call");
  tool.append(element("span", "fluent", ""), element("span", "", activity.detail ?? "Local command"), element("b", "", "✓"));
  return tool;
}

function renderChangeDetail(task, activity) {
  const summary = element("div", "change-summary");
  const heading = element("div", "change-heading");
  heading.append(element("span", "fluent", ""), element("strong", "", "Files changed"), element("b", "", String(task.changed_files)), element("span", "diff-total", "local worktree"));
  summary.append(heading);
  const files = ["ui/index.html", "ui/styles.css", "ui/app.js"].slice(0, Math.max(1, task.changed_files));
  for (const path of files) {
    const file = element("div", "file-change");
    file.append(element("code", "", path), element("span", "add", "+"), element("span", "remove", "−"), element("i", "diff-bar"));
    summary.append(file);
  }
  if (activity.detail) summary.title = activity.detail;
  return summary;
}

function renderApproval(task, activity) {
  const card = element("div", "approval-card");
  const copy = element("div");
  copy.append(element("strong", "", activity.summary), element("p", "", activity.detail ?? "Review is required to continue."));
  const reject = element("button", "secondary-button", "Return");
  reject.type = "button";
  const approve = element("button", "approval-button", "Approve");
  approve.type = "button";
  reject.addEventListener("click", () => decideReview(task.id, false));
  approve.addEventListener("click", () => decideReview(task.id, true));
  card.append(element("div", "approval-icon", "!"), copy, reject, approve);
  return card;
}

function renderTimeline(task) {
  timeline.replaceChildren();
  const events = currentSnapshot.activity.filter((activity) => activity.task_id === task.id);
  if (events.length === 0) {
    const empty = element("div", "timeline-empty");
    empty.append(element("span", "", "A"), element("strong", "", "This task is ready"), element("p", "", "Send the first direction to begin the local activity narrative."));
    timeline.append(empty);
    return;
  }

  for (const activity of events) {
    const agent = currentSnapshot.agents.find((candidate) => candidate.id === activity.agent_id);
    const color = agentColor(agent);
    const article = element("article", `event-card event-${activity.kind}`);
    const header = element("header");
    const initial = agent ? agent.name.slice(0, 1) : activity.kind === "message" ? "K" : "A";
    header.append(element("span", `agent-badge ${color}`, initial), element("strong", "", agent?.name ?? (activity.kind === "message" ? "You" : "Axio")), element("time", "", activity.timestamp), element("span", "event-kind", activity.kind));
    article.append(element("div", `timeline-node ${color}`), header, element("p", "", activity.summary));
    if (activity.kind === "tool") article.append(renderToolDetail(activity));
    else if (activity.kind === "change") article.append(renderChangeDetail(task, activity));
    else if (activity.kind === "approval" && task.review === "pending") article.append(renderApproval(task, activity));
    else if (activity.detail) article.append(element("div", "event-detail", activity.detail));
    timeline.append(article);
  }
}

function renderPaletteTasks() {
  const section = document.querySelector("[data-palette-tasks]");
  section.replaceChildren(element("span", "", "Tasks"));
  for (const task of currentSnapshot.tasks) {
    const button = element("button");
    button.value = task.id;
    const labels = element("span");
    labels.append(element("strong", "", task.title), element("small", "", `${task.agent_ids.length} agent${task.agent_ids.length === 1 ? "" : "s"}`));
    button.append(element("i", task.status === "waiting" ? "amber" : "cyan"), labels);
    if (task.id === currentSnapshot.selected_task) button.append(element("kbd", "", "current"));
    section.append(button);
  }
}

function renderWorkspace(snapshot) {
  currentSnapshot = snapshot;
  const task = selectedTask();
  if (!task) return;
  const worktreeName = task.worktree.split("/").slice(1).join("/") || task.worktree;
  document.querySelector("#project-name").textContent = snapshot.project;
  document.querySelector("#branch-name").textContent = snapshot.branch;
  document.querySelector("#task-title").textContent = task.title;
  document.querySelector("#plan-title").textContent = task.title;
  document.querySelector("#task-status").textContent = task.review === "pending" ? "Awaiting review" : task.status === "completed" ? "Complete" : "In progress";
  document.querySelector("#task-worktree").textContent = task.worktree;
  document.querySelector("#status-worktree").textContent = worktreeName;
  const reviewButton = document.querySelector("#review-task");
  reviewButton.hidden = task.review !== "pending";
  reviewButton.querySelector("span").textContent = String(task.changed_files ?? 0);
  document.querySelector("#approve-changes").disabled = task.review !== "pending";
  document.querySelector("#return-changes").disabled = task.review !== "pending";
  renderTasks();
  renderAgents(task);
  renderTimeline(task);
  renderPaletteTasks();
}

async function selectTask(id) {
  try {
    if (invoke) currentSnapshot = await invoke("select_task", { id });
    else {
      currentSnapshot.selected_task = id;
      const task = selectedTask();
      if (task) task.unread = 0;
    }
    audienceIndex = 0;
    renderWorkspace(currentSnapshot);
  } catch (error) {
    showToast(String(error));
  }
}

async function decideReview(taskId, approved) {
  try {
    if (invoke) currentSnapshot = await invoke("review_task", { taskId, approved });
    else {
      const task = currentSnapshot.tasks.find((candidate) => candidate.id === taskId);
      task.review = approved ? "approved" : "rejected";
      task.status = approved ? "completed" : "waiting";
    }
    renderWorkspace(currentSnapshot);
    showToast(approved ? "Changes approved" : "Changes returned for revision");
  } catch (error) {
    showToast(String(error));
  }
}

function setFocusMode(enabled) {
  body.classList.toggle("focus-mode", enabled);
  const control = document.querySelector("#focus-toggle");
  control.setAttribute("aria-pressed", String(enabled));
  control.querySelector("span:last-child").textContent = enabled ? "Exit" : "Focus";
}

function setSidebarOpen(open) {
  body.classList.toggle("sidebar-hidden", !open);
  const toggle = document.querySelector("#sidebar-toggle");
  toggle.setAttribute("aria-pressed", String(open));
  toggle.title = open ? "Close workspace sidebar" : "Open workspace sidebar";
}

function setInspectorOpen(open) {
  body.classList.toggle("inspector-hidden", !open);
  const toggle = document.querySelector("#inspector-toggle");
  toggle.setAttribute("aria-pressed", String(open));
  toggle.title = open ? "Close context sidebar" : "Open context sidebar";
}

function setSidebarPanel(panelName) {
  document.querySelectorAll("[data-sidebar-panel]").forEach((button) => {
    const active = button.dataset.sidebarPanel === panelName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".sidebar-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `sidebar-${panelName}`));
  setSidebarOpen(true);
  body.classList.remove("focus-mode");
}

function activateInspectorPanel(panelName) {
  lastInspectorPanel = panelName;
  setInspectorOpen(true);
  body.classList.remove("focus-mode");
  const titles = { diff: "Review", terminal: "Command output", plan: "Task plan" };
  document.querySelector("#inspector-title").textContent = titles[panelName];
  document.querySelectorAll(".inspector-tabs [data-panel]").forEach((button) => {
    const active = button.dataset.panel === panelName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".inspector-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${panelName}`));
}

function openSettings() {
  if (!settingsDialog.open) settingsDialog.showModal();
}

function openPalette() {
  if (!palette.open) palette.showModal();
  const search = document.querySelector("#palette-search");
  search.value = "";
  filterPalette("");
  requestAnimationFrame(() => search.focus());
}

function filterPalette(query) {
  const needle = query.trim().toLowerCase();
  document.querySelectorAll(".palette-section button").forEach((button) => {
    button.hidden = needle !== "" && !button.textContent.toLowerCase().includes(needle);
  });
}

function cycleAudience() {
  const task = selectedTask();
  const names = ["All agents", ...currentSnapshot.agents.filter((agent) => task?.agent_ids.includes(agent.id)).map((agent) => agent.name)];
  audienceIndex = (audienceIndex + 1) % names.length;
  document.querySelector("#audience-label").textContent = names[audienceIndex];
  showToast(`Directions will go to ${names[audienceIndex]}`);
}

function loadAppearance() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("axio-appearance") ?? "{}"); } catch { saved = {}; }
  const reduceMotion = Boolean(saved.reduceMotion);
  const compact = Boolean(saved.compact);
  const glass = Number(saved.glass ?? 72);
  document.querySelector("#reduce-motion").checked = reduceMotion;
  document.querySelector("#compact-density").checked = compact;
  document.querySelector("#glass-intensity").value = String(glass);
  document.querySelector("#glass-value").textContent = `${glass}%`;
  body.classList.toggle("reduce-motion", reduceMotion);
  body.classList.toggle("compact", compact);
  document.documentElement.style.setProperty("--glass-alpha", String(glass / 100));
}

function saveAppearance() {
  const glass = Number(document.querySelector("#glass-intensity").value);
  const appearance = { reduceMotion: document.querySelector("#reduce-motion").checked, compact: document.querySelector("#compact-density").checked, glass };
  body.classList.toggle("reduce-motion", appearance.reduceMotion);
  body.classList.toggle("compact", appearance.compact);
  document.documentElement.style.setProperty("--glass-alpha", String(glass / 100));
  document.querySelector("#glass-value").textContent = `${glass}%`;
  try { localStorage.setItem("axio-appearance", JSON.stringify(appearance)); } catch { /* The preview still works without persistence. */ }
}

body.classList.add("inspector-hidden");
body.classList.toggle("sidebar-hidden", window.matchMedia("(max-width: 720px)").matches);
loadAppearance();
setSidebarOpen(!body.classList.contains("sidebar-hidden"));
setInspectorOpen(false);

document.querySelector("#sidebar-toggle").addEventListener("click", () => setSidebarOpen(body.classList.contains("sidebar-hidden")));
document.querySelector("#focus-toggle").addEventListener("click", () => setFocusMode(!body.classList.contains("focus-mode")));
document.querySelector("#open-focus").addEventListener("click", () => setFocusMode(true));
document.querySelector("#inspector-toggle").addEventListener("click", () => {
  if (body.classList.contains("inspector-hidden")) activateInspectorPanel(lastInspectorPanel);
  else setInspectorOpen(false);
});
document.querySelector("#inspector-close").addEventListener("click", () => setInspectorOpen(false));
document.querySelector("#review-task").addEventListener("click", () => activateInspectorPanel("diff"));
document.querySelector("#approve-changes").addEventListener("click", () => decideReview(selectedTask().id, true));
document.querySelector("#return-changes").addEventListener("click", () => decideReview(selectedTask().id, false));
document.querySelector("#settings-button").addEventListener("click", openSettings);
document.querySelector("#terminal-context").addEventListener("click", () => activateInspectorPanel("terminal"));
document.querySelector("#audience-button").addEventListener("click", cycleAudience);
document.querySelectorAll("[data-sidebar-panel]").forEach((button) => button.addEventListener("click", () => setSidebarPanel(button.dataset.sidebarPanel)));
document.querySelectorAll("[data-status-action]").forEach((button) => button.addEventListener("click", () => {
  const action = button.dataset.statusAction;
  if (action === "agents") setSidebarPanel("agents");
  else if (action === "terminal") activateInspectorPanel("terminal");
  else setSidebarPanel("tasks");
}));

document.querySelectorAll("[data-window-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!invoke) {
      showToast("Native window controls are active in the Tauri build");
      return;
    }
    try { await invoke("window_action", { action: button.dataset.windowAction }); }
    catch (error) { showToast(String(error)); }
  });
});

function canStartWindowDrag(event) {
  if (!invoke || event.button !== 0 || !(event.target instanceof Element)) return false;
  const interactive = event.target.closest("button, input, textarea, select, a, dialog, summary, [role='tab'], [contenteditable='true']");
  if (interactive) return false;
  return event.altKey || Boolean(event.target.closest("[data-tauri-drag-region]"));
}

document.addEventListener("pointerdown", async (event) => {
  if (!canStartWindowDrag(event)) return;
  event.preventDefault();
  try {
    if (nativeWindow?.startDragging) await nativeWindow.startDragging();
    else await invoke("window_action", { action: "drag" });
  }
  catch (error) { showToast(String(error)); }
});

document.querySelectorAll("[data-open-palette]").forEach((button) => button.addEventListener("click", openPalette));
document.querySelector("#palette-search").addEventListener("input", (event) => filterPalette(event.target.value));
palette.addEventListener("close", () => {
  if (!palette.returnValue) return;
  if (palette.returnValue === "focus") setFocusMode(!body.classList.contains("focus-mode"));
  else if (palette.returnValue === "review") activateInspectorPanel("diff");
  else if (palette.returnValue === "settings") openSettings();
  else selectTask(palette.returnValue);
});

document.querySelector("#new-task").addEventListener("click", () => newTaskDialog.showModal());
newTaskDialog.addEventListener("close", async () => {
  if (newTaskDialog.returnValue !== "default") return;
  const input = document.querySelector("#new-task-prompt");
  const title = input.value.trim();
  if (!title) { showToast("Add an outcome before creating the task"); return; }
  try {
    if (invoke) currentSnapshot = await invoke("create_task", { title });
    else {
      const ordinal = currentSnapshot.tasks.length + 1;
      const id = `task-${ordinal}`;
      currentSnapshot.tasks.push({ id, title, status: "active", worktree: `axio/task-${ordinal}`, agent_ids: currentSnapshot.agents.map((agent) => agent.id), unread: 0, changed_files: 0, review: "none" });
      currentSnapshot.selected_task = id;
    }
    input.value = "";
    renderWorkspace(currentSnapshot);
    showToast("Task created with an isolated worktree");
  } catch (error) { showToast(String(error)); }
});

document.querySelectorAll(".inspector-tabs [data-panel]").forEach((tab) => tab.addEventListener("click", () => activateInspectorPanel(tab.dataset.panel)));
document.querySelectorAll("#settings-dialog input").forEach((input) => input.addEventListener("input", saveAppearance));

document.querySelector("#composer").addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = document.querySelector("#prompt");
  const message = prompt.value.trim();
  const task = selectedTask();
  if (!message || !task) return;
  try {
    if (invoke) currentSnapshot = await invoke("send_direction", { taskId: task.id, message });
    else currentSnapshot.activity.push({ id: `activity-${currentSnapshot.activity.length + 1}`, task_id: task.id, agent_id: null, kind: "message", summary: message, detail: `Direction queued for ${document.querySelector("#audience-label").textContent}`, timestamp: "now" });
    prompt.value = "";
    renderWorkspace(currentSnapshot);
    timeline.lastElementChild?.scrollIntoView({ behavior: body.classList.contains("reduce-motion") ? "auto" : "smooth", block: "nearest" });
    showToast("Direction added to the task");
  } catch (error) { showToast(String(error)); }
});

document.querySelector("#prompt").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    document.querySelector("#composer").requestSubmit();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openPalette(); }
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") { event.preventDefault(); setFocusMode(!body.classList.contains("focus-mode")); }
});

if (invoke) {
  invoke("workspace_snapshot").then(renderWorkspace).catch((error) => {
    renderWorkspace(fallbackSnapshot);
    showToast(`Using local preview data: ${error}`);
  });
} else renderWorkspace(fallbackSnapshot);
