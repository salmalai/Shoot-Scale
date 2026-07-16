---
name: bullseye
description: Derive a client's Audience Bullseye — their exact ICP in the center with 4 progressively broader rings around it — and the content-mix ratio that says how many videos per batch aim at each ring. Use when the user says "/bullseye", "build the bullseye for [client]", "what's [client]'s content mix", "how niche should [client] go", or when the /run conductor calls it. Reads the Snapshot and auto-derives the rings (it does NOT run a 15-question interview) — it drafts, you correct, one approval. Writes ONE doc, the Bullseye, which /analyze and /produce both read.
---

# Bullseye

Builds and maintains ONE document: the client's **Bullseye** — their exact ideal viewer at the
center, four progressively broader audience rings around it, and the **content-mix ratio** that
tells `/produce` how many videos per batch to aim at each ring. It is also the client's **topic
source** — the rings define what they're allowed to talk about, so we never need competitor topics.

We already have the client's identity in the Snapshot, so we **auto-derive** the rings and mix from
it. We do not interview the client. We draft, the user corrects, one approval, done.

Core principle: **aim smaller to grow bigger.** Broad content confuses the algorithm; precise
content teaches it exactly who the core viewer is, and *then* it expands reach on its own.

## Where it lives
`clients/<Client Name>/Bullseye.md`. Reads `clients/<Client Name>/Snapshot.md`. Never rewrites the
Snapshot. Keep exactly one; overwrite in place, bump the changelog.

## Step 0 — Load the client
Read the Snapshot. Pull the **niche/offer**, the **ICP** (who actually pays), the **audience
psychology**, and the **hard no-gos**. If a Bullseye already exists, read it and only change what
the Snapshot now implies is different; bump the version.

**Viewer ≠ buyer check.** If the watcher isn't the payer, center the bullseye on the **buyer**;
the viewer-heavy rings serve reach while the center serves revenue.

## Step 1 — Draft the center
A one-sentence **Center Statement**: `[specific person] who [specific situation] and struggles with
[specific problem]`. Person-level specificity is the bar — "real-estate investors" fails; "funded
wholesalers doing 2–5 deals/mo who can't get consistent seller leads" passes. If the Snapshot is
too thin, make your best-supported guess and flag it ⚠️ for the gate.

## Step 2 — Derive the 5 levels
Build exactly five levels by relaxing ONE constraint at a time moving outward. Each ring must be a
real, nameable audience. For each, estimate (directional): relative size (~5–10x per ring out),
conversion proximity (highest at center), competition density (thin at center, crowded outside).

## Step 3 — Set the content-mix ratio
Default for a batch of 7: **3 / 2 / 2** — three center (deep conversion), two Ring 1 (reach with
conversion), two Ring 2 (pure reach). **Never** aim Ring 3–4 in the first phase. Scale it to the
batch (e.g. 20 → 9/6/5). State the calibration rule: run this mix for the first 2–3 batches, then
bias toward whichever ring actually drove leads/DMs/sales.

## Step 4 — Topic-sourcing rule
Encode the two zones:
- **TOPICS come from the inner rings only** (center + Ring 1; Ring 2 at a stretch). Outer-ring
  topics drift the client broad. `/produce` pulls topics from here + the client's own winners.
- **CRAFT (formats, hooks, pacing) comes from anywhere.**

## Step 5 — Present for approval (the ONE gate)
Show the Center Statement, the 5-level ladder (one line per ring naming the constraint relaxed), and
the mix ratio. Ask them to confirm or correct the center and the ladder — the only decision here. If
artifacts are available, optionally render a concentric-ring visual; never block on it.

## Step 6 — Write the doc
Write `Bullseye.md`: the Center Statement, the ladder table, the content-mix ratio + calibration
rule, the topic-sourcing rule, and a Changelog starting at v1. Stamp it a living doc.

## Hand-off
"Bullseye's set — this is what /analyze and /produce use to keep the batch on-niche and balanced.
Want me to analyze their videos now?" When `/run` called this, return control to it. Keep talk
plain — don't expose file paths unless asked.
