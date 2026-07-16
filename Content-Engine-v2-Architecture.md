# Shoot & Scale Content Engine — v2 Architecture & Build Plan

*The evolution from "six pick-and-choose skills you run in order" to "one conductor that runs the whole pipeline for a named client, stopping only where a human decision is genuinely required."*

**Target: plugin v2.0.0 · Builds on the existing v1.1.0 system — nothing is thrown away.**

---

## 1. The vision, in one line

> You type **"do 20 pieces for Esteban"** and the engine figures out where Esteban is in the pipeline, runs every stage that's missing, pauses only at the three real gates, and hands back finished, data-backed, hook-graded scripts in the branded doc — pitching you *why* each concept earns its slot.

The person running it can be brand new to content. The engine carries the expertise; the human supplies approvals and the one thing a computer can't do (bulk-analyze inside Sandcastles).

---

## 2. What already exists vs. what's new

We are **not** rebuilding. Here's the honest inventory.

**Already built and staying (v1.1.0):**
- `create-client-snapshot`, `add-competitors`, `create-strategy`, `create-format`, `write-script`, `script-doc-builder`
- The distilled **hook engine** inside `prompts/script-writer-prompt.md` (from the Kallaway hooks workshop) — write-script already writes to it
- The **content-pitch pattern** (proven manually on Mariela) — the one-page "here's the slate and why"
- 26-brick **Format Bank** (one flat bank, all bricks usable) + INDEX
- The per-client doc model (snapshot / competitors / strategy / format-results)

**New in v2:**
- **`run-client`** — the conductor (the whole point of v2)
- **`content-pitch`** — formalizes the Mariela pattern into a real skill (the "why good / why bad" pitch)
- **`audience-bullseye`** — the ring model + content-mix ratio, auto-derived from the snapshot
- **`channel-diagnostic`** — deep per-channel 4-reel analysis (adapted from Kallaway), with "analyze in Sandcastles first"
- **`creator-breakdown`** — optional deep teardown of a rising competitor (adapted from Kallaway)
- **`outlier-pulse`** — daily scheduled niche radar per client (adapted from Kallaway)

**Upgraded in v2 (surgical edits to existing skills):**
- Every analysis skill gets a **"analyze in Sandcastles first" Step 0**
- `create-strategy` + `add-competitors` get a **boosted-video screen** (drop sub-2%-engagement "winners" — likely paid) and a **per-channel** outward pass
- `create-strategy` gains **content pillars** and consumes the **bullseye ratio**
- `write-script` gains an explicit **hook grade + revise pass** (A–F, iterate to B+) and **mad-lib hook extraction**
- `create-format` gains the **anti-pattern screen** (incl. the em-dash "AI tell" ban)

---

## 3. The conductor: `run-client`

**Front door.** `/run-client Esteban 20` (or just "make 20 videos for Esteban", or "let's get Esteban ready to shoot").

**How it works — state detection, not a rigid script.** On invocation it reads the client's folder and figures out what already exists, then runs only what's missing:

```
Client named
   │
   ▼
Snapshot exists?  ── no ─▶ run create-client-snapshot   (needs onboarding materials)
   │ yes
   ▼
Bullseye exists?  ── no ─▶ run audience-bullseye         (auto-derived; 1 approval)
   │ yes
   ▼
Competitors + watchlist?  ── no ─▶ run add-competitors   (1 approval on the shortlist)
   │ yes
   ▼
Strategy current?  ── stale/none ─▶ run create-strategy  (Sandcastles-first gate + credit gate)
   │ current
   ▼
Content pitch for this batch?  ── no ─▶ run content-pitch (the ONE plan-approval gate)
   │ approved
   ▼
write-script  ── the batch, each hook graded to B+ ─────▶
   │
   ▼
script-doc-builder ─▶ branded .docx ─▶ DONE
```

At each step the conductor says, in plain language, what it's about to do and what (if anything) it needs — then does it. It never silently skips a gate, and never silently spends credits.

**The state file.** The conductor keeps a tiny `<client>-run-state.md` (last run date, what's current, what's stale, batch numbers used) so re-runs are instant and it never redoes finished work.

---

## 4. The only three human gates

Everything else is automated. These three stay because a human genuinely owns the decision:

1. **The Sandcastles bulk-analyze step (manual, by design).** Deep analysis is faster and cheaper done in the Sandcastles web app than pushed through the MCP. So when the engine needs videos analyzed, it stops and says: *"Go to Sandcastles → filter @esteban to the last 60 days → sort by outlier → bulk-analyze the top 15. Tell me when it's done."* Then it reads the results for free and continues. This is the "if there's something manual, just ask me to analyze it" step you described.
2. **Credit approval.** Any spend states the exact count and waits. (Unchanged from v1 — it's the agency's money.)
3. **The content plan (pitch) approval.** The engine pitches the batch — each concept with *why it earns the slot* and *what would kill it* — and you approve/kill before a single script is written. This is the one creative checkpoint that's worth a human.

That's it. No per-topic hand-holding, no per-script babysitting.

---

## 5. New skills — one-line specs

- **`audience-bullseye`** — reads the snapshot, auto-derives the 5-ring bullseye (exact ICP → broadest credible ring) and a content-mix ratio (default **3 / 2 / 2** per 7 videos — core / adjacent / reach; never the broadest ring), plus an inspiration-sourcing rule (topics from the inner rings, craft/formats from anywhere). Saves `<client>-bullseye.md`. One approval, then it feeds strategy + pitch. *(Agency-streamlined version of Kallaway's interactive builder — no 15-question interview; it drafts, you correct.)*

- **`content-pitch`** — the vision on one page (formalizes Mariela's doc). Reads snapshot + strategy + bullseye + the niche scan + Format Bank, assembles the batch as concepts mapped to bullseye rings and to a format (proven brick or niche remix), and **pitches each: the angle, why it should work for this client, and the risk that would kill it.** Approve/kill, then survivors flow to write-script. Saves `<client>-content-pitch.md`.

- **`channel-diagnostic`** — deep per-channel teardown → four reels (Top Topics, Top Hooks + mad-lib templates, Hidden Insights, Top Formats) → interactive HTML report. Per-channel isolation, boosted screen, Sandcastles-first. Runs on the client's own channel and on top competitors.

- **`creator-breakdown`** *(optional/advanced)* — the "how did they blow up and how do they monetize" teardown with the outlier timeline, spike-vs-step, and funnel read. For studying a rising competitor deeply.

- **`outlier-pulse`** — the daily 7 AM scheduled radar: ranked niche outliers (1x+, last 7 days, no credits) dropped into the client's folder/Notion/Slack. Keeps the strategy from going stale between monthly runs.

---

## 6. Delivery & versioning

The engine ships as **plugin v2.0.0**, following your existing process: one `.plugin` file in `plugin/`, `PLUGIN-VERSION.md` bumped, SOP updated, team reinstalls once. All existing client data, the Format Bank, and prompts stay exactly where they are in the shared drive. The conductor and new skills read the same folder model you already use.

---

## 7. Build order

1. `audience-bullseye` + `content-pitch` (the two new stages the pipeline needs)
2. `run-client` conductor (ties everything together)
3. Surgical upgrades to the four existing skills
4. `channel-diagnostic` + `outlier-pulse` (+ `creator-breakdown` if wanted)
5. Repackage v2.0.0, update SOP + README, refresh the cheat sheet
6. Live test: a full `run-client` pass on one real client end-to-end

---

## 8. v3 refinements — from the first live run (July 10, 2026)

The first end-to-end run (Esteban) surfaced the gaps below. Full detail + per-skill change spec in **`Session-Summary-and-v3-Improvements-2026-07-10.md`**. Headlines:

1. **Assume nothing.** Re-validate every stage each run; a file existing ≠ current. Never assume a prior batch shipped. Add an onboarding-confirmation beat.
2. **Credits — only metadata is free.** The web-app bulk-analyze *also* costs credits (correction to v2 language). Free = titles/views/outlier/engagement via search+recap; deep topic/hook/format extraction = 1 credit/video either way. Approve every spend.
3. **Competitors = topics only.** Never analyze competitor videos. Pull their top ~50–100 by outlier (free metadata), harvest topic inspiration into an internal topic bank. We don't judge topics.
4. **His channel = deep-analyze the top 50–60**, and read the **floor** too (boosted-ad screen, no repost-farming, cut off-ICP promos, engagement is the real weakness).
5. **Formats are bank-only; topics are inspiration.** Never invent "his formats." Harvest from creators only (a) topics and (b) format *candidates* to vet.
6. **Format-candidate vetting is human-owned** — hand over the link, user approves, then `create-format`. (This run: only "Handle Each Type" → #27.)
7. **A format must be self-contained & evergreen** — no external-clip dependency. **Reaction #14 removed** for failing this.
8. **⭐ Principle, not law: winning TOPICS drive the content.** Content = new scripts built from winning topics — what competitors talk about + what the client posts that performs best. Formats are a separate track (bank + `create-format`); test new/untested formats (incl. skits) *because* they're untested. The Esteban "subtract his ~2× ranking/sorting" was the principle applied to *his* data, **not** a universal rule — apply the same principle to each new client's own `format-results.md`. Look at the principle, not the law.
9. **Pitch WITH the script, rationale OUT of Editor Notes.** New top-of-block field: `inspiration` (topic/format link) + funnel/ring position + optional one-line why. Editor Notes reverts to shot/edit direction only. `script-doc-builder` gains the new field.
10. **Collapse the middle** — merge `channel-diagnostic` + `create-strategy` + `content-pitch` into one deep-analysis-to-pitch flow. Pipeline: onboard → build target → deep analysis (client's 50–60 + competitor topics) → **pitch format candidates → create-format** → strategy + pitched written scripts in one output.
11. **Guided tutorial mode.** The conductor hand-holds a brand-new user: one small action at a time, plain language, "here's what we did / here's the next thing you do / I'll handle the rest."

**Target: plugin v3.0.0** — rebuild from the change spec, bump `PLUGIN-VERSION.md`, reinstall.
