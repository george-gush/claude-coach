# Adaptive Endurance Coach

A world-class endurance coaching **skill** for agentic AI tools (Claude Code, and likely other MCP-capable agents) — swimming, cycling, running, and triathlon. It manages long-term athlete development the way a real coach + sports nutritionist would: periodized training plans, readiness-guided daily adjustments, evidence-tiered methods, written race plans with individualized tapers, and a nutrition engine that writes daily calorie/macro targets straight onto your training calendar.

TrainingPeaks is the source of truth; Strava is optional/supplementary.

## What it does

- **Periodized training plans** built backward from your A-race, using evidence-tiered methods (proven vs. promising vs. unsupported — labeled honestly, not sold as all equally solid).
- **Daily readiness logic** — HRV/sleep/soreness trend rules that decide whether today's session proceeds, gets softened, or becomes a rest day.
- **Injury-aware programming** — rehab loading, pain-monitor rules, and a strength program that adapts around what's actually healing.
- **Race execution planning** — written race plans with pacing, fueling, and a taper individualized to your own history, not a generic template.
- **Nutrition as a core function, on by default** — daily calorie and macro targets computed from your actual training load and written to your TrainingPeaks calendar automatically.
- **Persistent athlete memory** — the skill maintains a structured history (`~/.training/`) across sessions: profile, race calendar, injuries, nutrition history, decision log, and versioned plans, so every coaching call is grounded in your own data, not a fresh guess each time.

## What this repo does NOT include

**The TrainingPeaks MCP server is a separate open-source project and is not vendored here.** All credit for the original goes to its author — see [JamsusMaximus/trainingpeaks-mcp](https://github.com/JamsusMaximus/trainingpeaks-mcp). Setup here clones [my fork](https://github.com/freezin-tm/trainingpeaks-mcp) instead of the upstream repo, so what you're pulling in is a version I've reviewed rather than whatever's currently on someone else's default branch. Clone it yourself per the setup steps below.

There's also no bundled Strava MCP server. Strava support is optional and supplementary; see `AGENT.md` for notes on it.

## Setup

The fastest path: point an agentic coding assistant (Claude Code or similar) at **[`AGENT.md`](./AGENT.md)** and ask it to read the file and set everything up. It will:

1. Clone and install the TrainingPeaks MCP server
2. Walk you through authenticating with TrainingPeaks (cookie-based — no API approval needed, no credentials ever typed into chat)
3. Register the MCP server with your agent
4. Install this skill into your agent's skills directory
5. Hand off to the skill's own onboarding flow

`AGENT.md` has full step-by-step instructions (with explicit commands for macOS, Linux, and Windows) if you'd rather do it by hand.

### Prerequisites

- An agentic AI coding tool with MCP support (Claude Code, etc.) — a $20/mo tier subscription is generally sufficient.
- A [TrainingPeaks](https://www.trainingpeaks.com/) account. The free tier works, but only lets you schedule 1–2 days out — a paid membership is needed if you want the coach planning a full week or more at a time.
- Python 3.10+ and [`uv`](https://docs.astral.sh/uv/) (installed automatically if missing — see `AGENT.md`).

## A note on data privacy

Setting this up means giving an AI assistant a lot of personal health and fitness information — training history, injury history, age, weight, goals, and optionally things like sweat-test results or bloodwork. That data goes to whichever AI provider you're using (e.g. Anthropic, if using Claude), subject to their data policies at the time. You're never obligated to provide everything the skill asks for; you can decline or substitute adjacent-but-inexact information (e.g., stating an approximate age) for anything you're not comfortable sharing. Go in with that tradeoff in mind.

## Repo structure

```
adaptive-endurance-coach/
  README.md
  AGENT.md                          <- give this to your agent for automated setup
  skills/adaptive-endurance-coach/
    SKILL.md                        <- core skill definition, loaded every session
    references/                     <- loaded on demand, by topic
      onboarding.md                 <- first-run setup, intake, tone selection
      load-and-recovery.md          <- readiness rules, HRV/illness/injury logic
      training-methods.md           <- evidence-tiered periodization, key sessions
      race-execution.md             <- race plans, taper design, pacing
      nutrition.md                  <- daily targets, fueling, supplements, safety floors
```

## Feedback

This is a work in progress — if you try it, feedback on what's missing or what could be sharper is welcome via issues/PRs.

## Disclaimer

Not a replacement for a human coach. If you can afford one, a good coach brings dynamic adjustment, deep sport-specific experience, and accountability that this can't fully replicate. This exists as an option for when that isn't accessible — not as a claim that it's better.
