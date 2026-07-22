# Reference repositories

Axio uses public source repositories as design and engineering references.
They are optional: none is a build dependency, submodule, or source of truth
for Axio behavior. Read and compare them; do not copy code without checking its
license and preserving required attribution.

This catalog consolidates the maintained shared library and the useful entries
from the previous Axio handoff. It was verified against the configured upstream
remotes on 2026-07-22.

## Portable layout

Choose any directory outside the Axio checkout. This example creates a simple
host/owner/repository layout on Windows:

```powershell
$referenceRoot = Join-Path $env:USERPROFILE 'dev\references\github.com'
New-Item -ItemType Directory -Force -Path $referenceRoot | Out-Null
```

Each command below is safe to run for a fresh library. To update an existing
clone, use `git -C <path> pull --ff-only` on its checked-out default branch.
The repositories are research snapshots, so keep their worktrees clean.

## Catalog and clone commands

### Agent runtimes and protocols

- **[OpenAI Codex](https://github.com/openai/codex)** — Rust agent runtime,
  task/session model, tools, approvals, and automation surfaces.

  `git clone https://github.com/openai/codex.git "$referenceRoot\openai\codex"`

- **[OpenCode](https://github.com/anomalyco/opencode)** — provider abstraction,
  client/server boundaries, sessions, plugins, and multi-surface UX.

  `git clone https://github.com/anomalyco/opencode.git "$referenceRoot\anomalyco\opencode"`

- **[Pi](https://github.com/earendil-works/pi)** — composable coding-agent,
  orchestration, and terminal UI packages.

  `git clone https://github.com/earendil-works/pi.git "$referenceRoot\earendil-works\pi"`

- **[oh-my-pi](https://github.com/can1357/oh-my-pi)** — Pi-based terminal agent
  extensions and workflow customization.

  `git clone https://github.com/can1357/oh-my-pi.git "$referenceRoot\can1357\oh-my-pi"`

- **[Hermes Agent](https://github.com/nousresearch/hermes-agent)** — tool use,
  memory, skills, and autonomous agent-loop patterns.

  `git clone https://github.com/nousresearch/hermes-agent.git "$referenceRoot\nousresearch\hermes-agent"`

- **[OpenClaw](https://github.com/openclaw/openclaw)** — local gateway, skills,
  channel integrations, and long-running agent operations.

  `git clone https://github.com/openclaw/openclaw.git "$referenceRoot\openclaw\openclaw"`

### Desktop agent workspaces

- **[Orca](https://github.com/stablyai/orca)** — multi-agent orchestration,
  worktrees, desktop process supervision, and terminal lifecycle behavior.

  `git clone https://github.com/stablyai/orca.git "$referenceRoot\stablyai\orca"`

- **[cmux](https://github.com/manaflow-ai/cmux)** — concurrent agent workspaces,
  panes, terminals, and task visibility.

  `git clone https://github.com/manaflow-ai/cmux.git "$referenceRoot\manaflow-ai\cmux"`

- **[T3 Code](https://github.com/pingdotgg/t3code)** — Codex-oriented desktop
  workspace, remote execution boundaries, and frontend composition.

  `git clone https://github.com/pingdotgg/t3code.git "$referenceRoot\pingdotgg\t3code"`

- **[Terax AI](https://github.com/crynta/terax-ai)** — Tauri agent desktop,
  terminal management, settings, and native-window integration.

  `git clone https://github.com/crynta/terax-ai.git "$referenceRoot\crynta\terax-ai"`

- **[Odysseus](https://github.com/pewdiepie-archdaemon/odysseus)** — agent IDE
  layout, testing discipline, and security boundaries.

  `git clone https://github.com/pewdiepie-archdaemon/odysseus.git "$referenceRoot\pewdiepie-archdaemon\odysseus"`

- **[DeepSeek GUI](https://github.com/XingYu-Zhong/DeepSeek-GUI)** — cross-platform
  Tauri shell, local settings, migrations, and native AI desktop patterns.

  `git clone https://github.com/XingYu-Zhong/DeepSeek-GUI.git "$referenceRoot\XingYu-Zhong\DeepSeek-GUI"`

- **[Kilo Code](https://github.com/Kilo-Org/kilocode)** — multi-provider coding
  workflows and IDE integration patterns.

  `git clone https://github.com/Kilo-Org/kilocode.git "$referenceRoot\Kilo-Org\kilocode"`

### Terminal and presentation systems

- **[Warp](https://github.com/warpdotdev/warp)** — terminal rendering, command
  blocks, panes, input, and agent-aware terminal UX.

  `git clone https://github.com/warpdotdev/warp.git "$referenceRoot\warpdotdev\warp"`

- **[Win-CodexBar](https://github.com/Finesssee/Win-CodexBar)** — compact Windows
  status surfaces, native packaging, and provider usage presentation.

  `git clone https://github.com/Finesssee/Win-CodexBar.git "$referenceRoot\Finesssee\Win-CodexBar"`

- **[Grok Build](https://github.com/xai-org/grok-build)** — polished build-tool
  presentation, interaction density, and visual design reference.

  `git clone https://github.com/xai-org/grok-build.git "$referenceRoot\xai-org\grok-build"`

## Clone everything

The following PowerShell snippet reproduces the full catalog without depending
on the old machine's `F:` drive, object pools, or junctions:

```powershell
$referenceRoot = Join-Path $env:USERPROFILE 'dev\references\github.com'
$repositories = @(
    'anomalyco/opencode'
    'can1357/oh-my-pi'
    'crynta/terax-ai'
    'earendil-works/pi'
    'Finesssee/Win-CodexBar'
    'Kilo-Org/kilocode'
    'manaflow-ai/cmux'
    'nousresearch/hermes-agent'
    'openai/codex'
    'openclaw/openclaw'
    'pewdiepie-archdaemon/odysseus'
    'pingdotgg/t3code'
    'stablyai/orca'
    'warpdotdev/warp'
    'xai-org/grok-build'
    'XingYu-Zhong/DeepSeek-GUI'
)

foreach ($repository in $repositories) {
    $destination = Join-Path $referenceRoot $repository
    if (Test-Path -LiteralPath $destination) {
        git -C $destination pull --ff-only
    } else {
        New-Item -ItemType Directory -Force -Path (Split-Path $destination) |
            Out-Null
        git clone "https://github.com/$repository.git" $destination
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Reference update failed: $repository"
    }
}
```

Run `git status --short --branch` in a reference before updating it. If it has
local work, preserve or move that work deliberately rather than forcing a pull.

## Existing shared Windows library

On the original workstation, the canonical shared library remains at
`F:\dev-hub\references\repos\github.com\<owner>\<repository>`. It uses linked
worktrees and shared bare pools, so update that library only through:

```powershell
& 'F:\dev-hub\references\Update-ReferenceRepos.ps1'
```

That machine-specific optimized layout is not required on another computer;
the ordinary clones above are the portable option.
