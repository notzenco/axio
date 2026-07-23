export const diffFiles = {
  app: { path: "ui/src/App.tsx", added: "+126", removed: "−42", lines: [
    ["context", "1", " const [snapshot, setSnapshot] = useState(initial);"],
    ["remove", "2", " − addTimelineDirection(message);"],
    ["add", "2", " + const next = await sendDirection("],
    ["add", "3", " +   task.id,"],
    ["add", "4", " +   message,"],
    ["add", "5", " + );"],
  ] },
  styles: { path: "ui/styles/task.css", added: "+84", removed: "−18", lines: [
    ["context", "41", " .workspace-shell { display: grid; }"],
    ["remove", "42", " − grid-template-columns: 236px 1fr 390px;"],
    ["add", "42", " + grid-template-columns: 236px minmax(420px, 1fr) 390px;"],
  ] },
  index: { path: "ui/index.html", added: "+3", removed: "−1", lines: [
    ["context", "9", " <body>"],
    ["add", "10", " + <div id=\"root\"></div>"],
    ["add", "11", " + <script type=\"module\" src=\"/src/main.tsx\"></script>"],
  ] },
} as const;

export type DiffFileKey = keyof typeof diffFiles;
