# Shoot & Scale — Content Engine

Short-form content agency system. Turns client onboarding material into a running pipeline of
niche/audience definition → performance analysis of the client's own channel → hook-graded scripts
packaged into a branded, client-reviewable `.docx`.

**Current state: a local Claude Code / Gemini CLI plugin, not a hosted app.** Everything here runs as
slash-command skills invoked by a human at a terminal, operating on flat markdown files in this
repo. `example of the app/preview.html` is a static mockup of where this is headed — a hosted,
multi-user web app with admin-provisioned logins — but no backend, auth, database, or web UI exists
yet. The actual hosted-app build (once started) lives under `web/`, kept separate from the CLI
content-engine files below. See the "Going live" note at the bottom.

## The pipeline

```
/run  →  snapshot → bullseye → analyze → (create-format) → produce
```

- **`/run`** — guided conductor. Walks a checklist, calls the other skills in order, stops only at
  real approval gates.
- **`/snapshot`** — client identity doc: voice, niche, branding, hard no-gos. Built from onboarding
  material. Fact, not strategy.
- **`/bullseye`** — audience "bullseye" (ICP center + 4 broader rings) auto-derived from the
  Snapshot, plus the content-mix ratio (how many scripts per batch aim at each ring). Also the topic
  source — topics come only from the inner rings + proven winners, and never gate approval.
- **`/analyze`** — deep-reads the client's own top-performing videos (via a JSON export from the
  Sandcastles web app — **not** the MCP read path, which is unreliable and can burn credits) into
  the living `Content-Analysis.md`: what's working vs. flopping, by format and by topic. Surfaces
  reusable format candidates for approval.
- **`/create-format`** — turns one video URL or an original idea into a reusable, niche-agnostic
  "Format Bank" brick (structure only, never topic-bound). Validated across 3 demo niches before
  saving. Standalone — usable with or without a specific client in mind.
- **`/produce`** — pitches a format split (the one creative approval gate) → writes hook-graded
  scripts → builds the branded Script Doc (`build_script_doc.py`) → learns from the client's edits
  and proposes doc/brick/plugin updates.

Full behavioral spec for each skill lives in its `SKILL.md` — treat those as the source of truth,
not this summary.

## Repo layout

- `skills/shoot-and-scale/skills/{run,snapshot,bullseye,analyze,create-format,produce}/` — the six
  skills (`SKILL.md` + any `references/`, `scripts/`, `assets/`).
- `skills/shoot-and-scale/.claude-plugin/plugin.json` — plugin manifest (v4.1.0).
- `clients/<Client Name>/` — one folder per client: `Snapshot.md`, `Bullseye.md`,
  `Content-Analysis.md`, `scripts/` (generated `.docx` batches). These three docs are the entire
  memory of the system for that client.
- `format-bank/` — global, shared across all clients. `INDEX.md` + numbered format bricks
  (`format-NN-slug.md`). Formats are bank-only: never invented on the fly, always user-approved
  before being written into a script.
- `prompts/` — the two prompts `produce` depends on: `script-writer-prompt.md` (hook engine + output
  format) and `kallaway-hooks-workshop.md` (hook grading rubric).
- `example of the app/preview.html` — static HTML mockup of the target hosted app (4 screens: Sign
  in, Chat, Guide, Admin). Design reference only — not wired to anything.
- `web/` — the hosted-app build. All real credentials (Anthropic, Supabase, Google Drive service
  account, Sandcastles) live in `web/.env`, gitignored, never committed or shared — the old
  `secrets/` folder was retired once everything was migrated in.
- `_archive/` — retired pre-v4 material. Don't build against it.
- `Content-Engine-v2-Architecture.md`, `Content-Engine-v3-Blueprint.md`,
  `Content-System-SOP.md` / `.docx`, `How-This-System-Works-SOP.md` — design history and SOP docs.
  `README.md` inside the plugin folder is the current (v4) summary; the root-level architecture docs
  are older iterations, useful for context but not authoritative over the `SKILL.md` files.

## Brand assets

`brand assets/` — official Shoot & Scale Brand Pack v1.0 (reference only; nothing here is wired into
any skill or generator).

- `Brand Pack.pdf` — the full spec: logo lockups, color, type, UI rules.
- `logo-black-bg-orange.jpg.jpeg` — reversed lockup (white wordmark on tangerine).
- `logo-orange-bg-white.jpg.jpeg` — accent lockup (tangerine wordmark on light).
- `logo-pfp-orange-white.png` — profile/avatar-format mark.

**Logo** — three lockups only: primary (ink on light), reversed (white on tangerine), accent
(tangerine on light). Clear space around the wordmark = height of the ampersand. Never stretch,
recolor outside these three, add effects, or place the ink logo on a busy dark photo (use reversed
instead).

**Color**
| Name | Hex | Use |
|---|---|---|
| Tangerine | `#FF4D12` | Primary / CTAs — used sparingly, never a full-page wash |
| Ink | `#14110D` | Text / dark — carries the type |
| Stone | `#6B655C` | Body copy |
| Ember | `#FDE2D8` | Soft accent, panels/section breaks |
| Mist | `#F6F4F0` | Panels |
| Paper | `#FFFFFF` | Background — white is the canvas |

**Type** — Archivo Black (weights 800–900) for display/headlines only; Work Sans (weights 300–600)
for body and interface.

**UI** — primary actions tangerine, secondary actions ink. Pills (rounded) are for tags/categories
only, never primary actions. Corner radius: 12px on buttons and cards, 999px on pills.

Tagline: *"Shoot once. Scale everywhere."*

This is already the exact palette/type/radius system used in `example of the app/preview.html`
(`--tangerine`, `--ink`, `--stone`, `--ember`, `--mist`, `--paper`, Archivo Black wordmark, Work
Sans body, 12px/999px radii) — so the mockup is already on-brand; any future build of the real app
should keep pulling from this pack, not the mockup's hardcoded values, as the source of truth.

## Hard rules baked into every skill

- **Topics never gate.** Chosen by the engine from the Bullseye's inner rings + the client's proven
  winners; the user never approves topics.
- **Formats are bank-only.** Never invented, always an indexed, user-approved Format Bank brick.
- **The Snapshot wins every tie** — voice, ICP, and no-gos in the Snapshot override anything else.
- **Competitor analysis is out of scope** (manual only, outside this workflow).
- **Credits are never spent silently.** `analyze_video` charges Sandcastles credits; the only path
  that spends them is the user's own web-app bulk-analyze, always stated up front.
- Exactly **3 approval gates** across the whole pipeline: credits (before analysis), format
  candidates (bank a new format?), format split (before scripts are written). Everything else runs
  without stopping.

## External dependencies (current, local setup)

- **Sandcastles** (MCP) — video analytics. `/analyze` and `/create-format` use it; always
  `switch_workspace` into the client's own workspace by pinned UUID before any read.
- **`python-docx`** (`pip install python-docx --break-system-packages`) — powers
  `skills/.../produce/scripts/build_script_doc.py`, the Script Doc generator, for anyone running the
  skill by hand at a terminal. Needs `assets/logo.png` and `assets/comment_help.png` alongside it.
  The `web/` app does **not** use this script or Python at all — it has its own from-scratch port
  (`web/lib/scriptDocGenerator.ts`, using the `docx` npm package) kept in sync by hand with any
  future changes to `build_script_doc.py`, so the hosted app has no Python dependency to deploy.
- **Google Drive** — manual today for the CLI path; the `web/` app uploads automatically via a
  service account.

## Going live

The `web/` app (see above) is the real hosted build — admin-provisioned accounts, a chat UI that runs
the engine per client, credentials in `web/.env`. Hosting is on Vercel.
