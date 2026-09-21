# Setup Instructions — Adaptive Endurance Coach

You are an agentic coding assistant (Claude Code or similar) helping a user set up a personal AI endurance coaching system. This document contains everything you need. **This setup supports macOS, Linux, and Windows** — detect the user's OS first (ask them, or infer from context/environment) and follow the matching command block at each step. Don't silently assume macOS. Check in with the user at the marked decision points — don't silently skip steps.

## What this repo contains

```
adaptive-endurance-coach/
  AGENT.md                          <- this file
  README.md                         <- human-facing overview
  athlete/                          <- athlete memory, copy to ~/.training/
  skills/adaptive-endurance-coach/  <- the coaching skill (copy this to the user's Claude skills dir)
    SKILL.md
    references/
      onboarding.md
      load-and-recovery.md
      training-methods.md
      race-execution.md
      nutrition.md
```

This is a coaching **skill** for swimming, cycling, running, and triathlon. It manages long-term training via TrainingPeaks (required, source of truth) and optionally Strava (supplementary). It includes a full nutrition engine that writes daily calorie/macro targets to the TrainingPeaks calendar automatically.

**This repo does NOT include the TrainingPeaks MCP server** — that's a separate open-source project, cloned fresh in Step 2 below rather than vendored here. Step 2 clones a maintained fork rather than the upstream original, so it stays consistent with what's been reviewed for this setup. Give credit where it's due; don't claim that code as part of this project.

**Note on Strava:** there is no bundled Strava MCP server either. On the machine this skill was originally built on, Strava was available as a hosted/remote connector, not a local git repo. The skill works fully on TrainingPeaks alone — Strava is optional supplementary data. If the user wants Strava integration, search for a current "Strava MCP server" and set it up separately, or connect it as a remote connector if their Claude client supports one. Do not fabricate a Strava setup process — verify against whatever you find before instructing the user.

---

## Step 1 — Confirm prerequisites

Ask or check for:
- **Claude Code (or another MCP-capable agentic client)** installed and working — available for macOS, Linux, and Windows.
- **Python 3.10+** and **`uv`** (https://docs.astral.sh/uv/) — the TrainingPeaks MCP server is a Python package installed via `uv`, which is cross-platform.
  - **macOS / Linux:** `curl -LsSf https://astral.sh/uv/install.sh | sh`
  - **Windows (PowerShell):** `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
  - After installing, open a **new** terminal/PowerShell window so the updated PATH takes effect.
- **A TrainingPeaks account** (free tier is fine — this uses cookie auth, not the gated official API, so no developer approval is needed).
- **Browser logged into TrainingPeaks** (app.trainingpeaks.com) for the easiest auth path.

## Step 2 — Clone and install the TrainingPeaks MCP server

This is a separate open-source project — **clone it fresh**, don't skip this step assuming it's already present. Clone from this fork (a tracked fork of the original [JamsusMaximus/trainingpeaks-mcp](https://github.com/JamsusMaximus/trainingpeaks-mcp), kept here so the setup source is known and reviewed):

```bash
git clone https://github.com/freezin-tm/trainingpeaks-mcp.git
cd trainingpeaks-mcp
uv tool install --editable .
```

Clone it wherever makes sense for the user (e.g. alongside this repo, or in a standard tools directory) — the exact location doesn't matter since the MCP config in Step 4 will point at wherever `tp-mcp` actually lands.

Confirm the install worked and find where the `tp-mcp` executable landed (don't assume the path — verify it):

- **macOS / Linux:** `which tp-mcp` (typically `~/.local/bin/tp-mcp`)
- **Windows (PowerShell):** `Get-Command tp-mcp` (typically `%USERPROFILE%\.local\bin\tp-mcp.exe`)

Then confirm it runs: `tp-mcp --help`

**If `tp-mcp` isn't found** (PATH not updated yet): close and reopen the terminal, or run `uv tool update-shell` and retry. If it's still not found, fall back to the manual venv method, which has fully deterministic paths per OS:

```bash
cd trainingpeaks-mcp
python3 -m venv .venv        # Windows: python -m venv .venv
```
- **macOS / Linux:** activate with `source .venv/bin/activate`, then `pip install -e .`. The executable is at `.venv/bin/tp-mcp`.
- **Windows (PowerShell):** activate with `.venv\Scripts\Activate.ps1` (or `.venv\Scripts\activate.bat` in cmd.exe), then `pip install -e .`. The executable is at `.venv\Scripts\tp-mcp.exe`.

Use whichever path you actually confirmed in Step 4 below — don't guess.

## Step 3 — Authenticate with TrainingPeaks

Two options — offer both, let the user pick. Both work identically on macOS, Linux, and Windows since this is the Python CLI talking to TrainingPeaks over HTTPS, not an OS-specific integration.

**Option A (easiest): auto-extract from browser.** Requires the user to be logged into TrainingPeaks in Chrome, Firefox, Safari (macOS only), or Edge.
```bash
pip install tp-mcp[browser]   # one-time, adds browser cookie support
tp-mcp auth --from-browser chrome   # or firefox / edge / safari (mac) / auto
```
- **macOS:** may prompt for Keychain access / Full Disk Access — expected, the cookie is encrypted at rest.
- **Windows:** may trigger a Windows security prompt related to credential/DPAPI access — also expected, same reason.
- **Linux:** depends on the browser's cookie storage (often plaintext SQLite or a keyring); no special prompt typical.

**Option B: manual cookie paste (works identically on every OS).**
1. User logs into https://app.trainingpeaks.com in their browser.
2. Open DevTools (F12) → Application tab → Cookies → find `Production_tpAuth`, copy its value.
3. Run `tp-mcp auth` and paste the value when prompted.

Verify either path worked:
```bash
tp-mcp auth-status
```
Do not proceed to Step 6 (onboarding) until this reports authenticated.

## Step 4 — Register the MCP server with the agentic client

Get the exact config snippet: `tp-mcp config`

**For Claude Code** (same command on every OS — use the `tp-mcp` path you confirmed in Step 2):
```bash
claude mcp add trainingpeaks -- tp-mcp serve
```
If you had to use the venv fallback, use its full path instead, e.g.:
- macOS/Linux: `claude mcp add trainingpeaks -- /full/path/to/trainingpeaks-mcp/.venv/bin/tp-mcp serve`
- Windows: `claude mcp add trainingpeaks -- C:\full\path\to\trainingpeaks-mcp\.venv\Scripts\tp-mcp.exe serve`

**For Claude Desktop or other MCP clients:** edit the client's MCP config file and add the server entry under `"mcpServers"`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json` (client-dependent — verify for the specific client in use)

```json
{
  "mcpServers": {
    "trainingpeaks": {
      "command": "/Users/you/.local/bin/tp-mcp",
      "args": ["serve"]
    }
  }
}
```
On Windows, `"command"` would instead be something like `"C:\\Users\\you\\.local\\bin\\tp-mcp.exe"` (note escaped backslashes in JSON, or use forward slashes — both work in JSON strings).

Restart the client after editing config files.

## Step 5 — Install the skill

Copy the skill folder to wherever the agentic client loads skills from — for Claude Code, that's `.claude/skills/` in the user's home directory on every OS.

**macOS / Linux:**
```bash
mkdir -p ~/.claude/skills
cp -R skills/adaptive-endurance-coach ~/.claude/skills/adaptive-endurance-coach
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse -Force "skills\adaptive-endurance-coach" "$env:USERPROFILE\.claude\skills\adaptive-endurance-coach"
```
(Use `$env:USERPROFILE` explicitly rather than `~` — more reliable across PowerShell versions and avoids any ambiguity in quoted paths.)

Verify: the client should now list "Adaptive Endurance Coach" as an available skill (its `SKILL.md` frontmatter `description` is what triggers it — the client auto-invokes it on training/nutrition/coaching-related requests, or the user can invoke it explicitly).

## Step 6 — First run / onboarding

Tell the user: **just start talking to the skill about their training** (e.g. "I want to start training for a triathlon" or explicitly invoke the `adaptive-endurance-coach` skill). On first interaction with no existing athlete profile, the skill automatically walks the user through:
1. Choosing data sources (TrainingPeaks only, or + Strava)
2. Verifying the TrainingPeaks connection (`tp_auth_status`)
3. Full intake — goals, race calendar, discipline history, injury history, physical stats
4. Threshold/zone establishment
5. Coaching tone selection

This is all handled by the skill itself (see `skills/adaptive-endurance-coach/references/onboarding.md`) — you as the setup agent don't need to run onboarding yourself, just get the plumbing (MCP server + skill files) working and hand off.

**Cross-platform note on athlete memory:** the skill maintains persistent athlete memory in a `.training` folder under the user's home directory — `~/.training/` on macOS/Linux, `%USERPROFILE%\.training\` on Windows (e.g. `C:\Users\<name>\.training\`). This is created automatically by the skill on first run; you don't need to create it yourself. The skill's own SKILL.md contains the explicit per-OS resolution rule, so once the skill is installed (Step 5) it will handle this correctly on its own regardless of platform.

This repo now carries the owner's own athlete data in `athlete/` (see `athlete/README.md`) — copy it to `~/.training/` before a coaching session. Anyone else cloning this repo should delete that folder and start from a clean slate.

## Step 7 — Sanity check

Before declaring done, confirm all of the following are true:
- [ ] `tp-mcp auth-status` reports authenticated
- [ ] The MCP server is registered with the client and the client can see TrainingPeaks tools (e.g. ask it to run `tp_get_athlete_settings` and confirm it returns real data, not an error)
- [ ] The skill's `SKILL.md` exists in the client's skills directory for this OS (`~/.claude/skills/adaptive-endurance-coach/SKILL.md` on macOS/Linux, `%USERPROFILE%\.claude\skills\adaptive-endurance-coach\SKILL.md` on Windows) and the client lists the skill as available
- [ ] The user has NOT been asked to paste any credentials into chat — auth happens via the `tp-mcp auth` CLI flow only, credentials should never appear in the conversation

If any step fails, debug it before telling the user they're ready — a broken MCP connection will make the skill fabricate or refuse to act on training data, which defeats the whole point.

## Troubleshooting notes

- **`tp-mcp` command not found after install:** `uv tool install` puts binaries in `~/.local/bin` (macOS/Linux) or `%USERPROFILE%\.local\bin` (Windows) — make sure that directory is on PATH. Close/reopen the terminal, or run `uv tool update-shell`. On Windows, if PATH still isn't picked up, you can add it manually in PowerShell: `[Environment]::SetEnvironmentVariable("Path", "$env:USERPROFILE\.local\bin;$([Environment]::GetEnvironmentVariable('Path','User'))", "User")` then open a new terminal.
- **Auth fails via browser extraction:** fall back to Option B (manual cookie paste) — it always works regardless of OS/browser quirks.
- **Cookie expires over time:** re-run `tp-mcp auth --from-browser <browser>` or `tp-mcp auth` (manual) — this is normal, TrainingPeaks sessions aren't permanent.
- **Windows execution policy blocks the uv installer:** the `-ExecutionPolicy ByPass` flag in the Step 1 command handles this for that one script; if PowerShell still refuses to run scripts elsewhere, that's a separate system policy the user may need to adjust themselves (don't change system-wide execution policy without the user's explicit understanding of what it does).
- **Path separators in conversation:** when telling the agent/skill about file locations, forward slashes (`/`) are safe to use even on Windows in almost all contexts here (Python, git, uv, and JSON config all accept them) — you don't need to convert everything to backslashes.
- **Strava:** see the note at the top of this file — not bundled, optional, verify current setup steps independently rather than guessing.
