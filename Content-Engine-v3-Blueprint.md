# Shoot & Scale — Content Engine v3 Blueprint
**The rebuild spec. Approve this, then I build it. Nothing gets deleted or rewritten until you sign off.**
Date: July 10, 2026

---

## The one-sentence system
Onboard a client, target their niche, deep-read their own videos to learn what works, then produce scripts using **only** proven Format-Bank formats — doubling down on what works for them and deliberately testing fresh formats — with **you approving the formats** and nothing else in the way.

Guiding word: **linear.** One step feeds the next. No parallel skills doing overlapping jobs.

---

## Principles (the rules the plugin must never break)

1. **Topics never gate.** Topics come from the Bullseye + the client's niche + their own winning topics (held as an idea bank). We never stop to "approve a topic." Proven demand is the only filter.
2. **Formats are bank-only.** Every format used is an indexed, approved Format-Bank brick. **Never invent a format. Never pitch a format without approval.** No "formats that do well for his page" pulled from thin air — only real bricks.
3. **Competitor analysis is out of the workflow.** Done manually when you want it. No add-competitors, no creator-breakdown, no competitor topic scraping inside the engine.
4. **Format philosophy = double down + experiment.** If a format keeps working for them, make more of it. If a format keeps flopping on their page, stop using it. If there's a format we've never tried that could fit, try it — untested is the point; that's how we find their next winner. Always align the format to the niche, the person, and their analysis.
5. **The client's own data drives everything.** We deep-analyze *their* videos, not the competition's.
6. **Guided and linear.** Every run walks you through, one small action at a time, and prompts the next step. You supply approvals; the engine carries the expertise.
7. **The engine learns.** After you edit scripts, it reflects on *why* and proposes improvements to the format bricks, the docs, or the plugin — and asks before changing anything.

---

## The three living client docs (the only inputs to production)

Per client, three documents. Nothing else feeds Produce.

| Doc | What it holds | Updated when |
|---|---|---|
| **Snapshot** | Who they are, voice, branding, goals, no-gos. | Onboarding + whenever they send new material. |
| **Bullseye** | Niche, allowed topics, the batch split ratio. | At setup; re-checked each run. |
| **Content Analysis** | Living deep-read of their own videos, bucketed: **formats that work / flop**, **topics that work / flop**, plus format candidates spotted (with links) and their approve/reject status. | Every `/analyze` run — folds in new videos and last batch's results. |

The **Content Analysis** doc replaces today's strategy + diagnostic + format-results — three docs become one living one.

---

## The five skills

1. **/snapshot** — onboard the client → writes the Snapshot. (Keep current logic, trimmed.)
2. **/bullseye** — niche + topics + split ratio → writes the Bullseye. (Keep current logic.)
3. **/analyze** — deep-read the client's own **top ~50–60** videos (you bulk-analyze in the Sandcastles web app; I read the results — credit count always stated first, never spent without your OK). Buckets what works vs. flops (formats **and** topics), **updates the living Content Analysis doc**, and surfaces repeatable format candidates from their winners **with links** for you to approve. Approved candidates hand off to `/create-format`.
4. **/create-format** — **UNTOUCHED.** Exactly as it is today. Used both from `/analyze` candidates and standalone when you want to bank a format manually, unrelated to any client. Optimizes → visualizes across niches → refine loop → banks the brick for all clients.
5. **/produce** — the whole back half in one skill. Reads Snapshot + Bullseye + Content Analysis, then:
   - **Pitches the format split** — "25 scripts across ~6 formats, ~3 each. I want to try [format] because X, double down on [format] because it's working, and I'm dropping [format] because it keeps flopping for them." Formats only, all from the bank.
   - **You approve/swap formats.** ("Not that one, give me another.") Topics you leave to me — pulled from their niche, past content, and Bullseye.
   - **Writes the scripts**, hooks graded, into the branded doc — **write-script + script-doc-builder merged.** No separate doc-builder step.
   - **You review scripts one by one** and request changes.
   - **Learning loop** — at the end, it reflects on your edits and proposes any brick/doc/plugin updates, asking first.

**Deleted for good:** content-strategy, content-pitch, content-engine (old), script-doc-builder, add-competitors, creator-breakdown, outlier-pulse.

---

## The guided runner

**/run** (name TBD) — one command that drives the whole thing as a guided tutorial. Each run it asks the checklist and calls the right skill:

> 1. "Did anything change in their onboarding — any new files?" → if yes, update Snapshot.
> 2. "Let's re-check the Bullseye — still aligned?" → update if needed.
> 3. "Any new videos posted since last time? Go to Sandcastles and bulk-analyze the new ones." → `/analyze` updates the Content Analysis doc.
> 4. "Great — everything's current. How many scripts do you want?" → `/produce`.

The individual skills stay callable on their own; `/run` is just the guided path through them. It stops only at the real gates.

## The approval gates (the only places it stops)

1. **Credits** — before analyzing, exact video count and credit cost stated; never spent without your yes.
2. **Format candidates** — during `/analyze`, "is this a repeatable format? here's the link" → you approve → `/create-format`.
3. **Format split** — during `/produce`, you approve/swap the formats for the batch. Topics don't gate.

---

## Folder structure (the Drive reorg)

```
Shoot & Scale Content System/
├── clients/
│   └── <Client Name>/
│       ├── Snapshot.md
│       ├── Bullseye.md
│       ├── Content-Analysis.md
│       └── scripts/           ← batch output docs
├── format-bank/               ← unchanged, global, shared across clients
├── plugin/                    ← the v3 skill source
└── _archive/                  ← old docs moved here, not hard-deleted (safety)
```

---

## Migration & cleanup plan (all clients — your choice: keep Snapshot + Bullseye)

Eight clients have Snapshots; only **Esteban** has a Bullseye.
Clients: amelia-ravelo, caesar-chukwuma, chris-aldahondo, devin-bender, emas-law-group, esteban-andrade, hugi-contreras, mariela-cano.

For every client:
- **KEEP** → Snapshot (and Bullseye where it exists) → moved into `clients/<Client Name>/`.
- **REMOVE from the workflow** → strategy, format-results, competitors, diagnostic, run-state, content-pitch, old scripts, old script docs.
- Content Analysis gets **rebuilt fresh** on the next `/analyze`.

**Safety:** instead of hard-deleting, everything removed goes to `_archive/` first. If you'd rather I permanently delete, say so and I will.

---

## Open questions before I build (your call)

1. **Runner name** — `/run`, `/engine`, `/start`, or something else?
2. **Skill names** — good with `/snapshot`, `/bullseye`, `/analyze`, `/produce`, `/create-format`? Or shorter (e.g. `/onboard`)?
3. **Archive vs. hard-delete** — move old docs to `_archive/` (recommended, reversible) or permanently delete?
4. **Deploy** — the live plugin skills are packaged; after I rewrite the source I'll need to rebuild + reinstall the plugin for it to take effect. OK to run that build step as part of this?
5. **Standalone format add** — confirm `/create-format` stays fully independent so you can bank a format anytime with no client attached. (I believe yes.)

---

*Approve this (or redline it) and I'll (1) reorganize the Drive, (2) rebuild the five skills + runner, (3) leave create-format untouched, (4) verify the whole thing end-to-end on Esteban as the test client.*
