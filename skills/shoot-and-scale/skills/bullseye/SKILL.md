---
name: bullseye
description: Derive a client's Audience Bullseye — their exact ICP at the center with 4 broader rings around it — and the content-mix ratio for how many videos per batch aim at each ring. Use for /bullseye, "build the bullseye for [client]", "what's [client]'s content mix", or "how niche should [client] go". Reads the Snapshot and auto-derives the rings (no interview): it drafts, you correct, one approval. Writes ONE doc that /analyze and /produce read.
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
`clients/<Client Name>/Strategy/Bullseye.md`. Reads `Strategy/Snapshot.md` (fall back to the client
root for older clients). Never rewrites the Snapshot. Keep exactly one; overwrite in place, bump the
changelog.

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

## Step 4b — Derive the Content Territory (the client's signature lens)
The rings tell `/produce` WHAT a client can talk about; the **Content Territory** tells it HOW this
client owns it, so two clients in the same niche never sound alike — and so a generic niche topic that
several clients must cover comes out different for each. This is the layer that makes `/produce`'s
cross-client no-repeat rule actually *work* instead of just blocking. Derive two things from the
Snapshot (and Content-Analysis if it exists):
- **Signature lens** — the one angle only this client can take: their personal story, their proof,
  their POV, their format DNA. (E.g. Emas Law Group owns *games*; Mariela Cano owns *mentorship &
  students*.) One or two sentences.
- **Owned angle pillars** — 3–5 recurring doors this client walks generic niche topics through
  (their own cases, their city, their clientele, their pet peeves, their origin story). When a generic
  topic must be covered by more than one client in the niche, each client comes at it through their
  OWN pillars — that's what makes the scripts diverge instead of colliding.
Draft these; the user corrects them at the gate. `/produce` reads this section to source every script
fill (its rule 5) and to keep this client's voice distinct from the rest of the roster.

## Step 5 — Present for approval (the ONE gate)
Show the Center Statement, the 5-level ladder (one line per ring naming the constraint relaxed), the
mix ratio, and the **Content Territory** (signature lens + owned pillars). Ask them to confirm or
correct the center, the ladder, and the territory — the only decision here. If artifacts are
available, optionally render a concentric-ring visual; never block on it.

## Step 6 — Write the doc
Write `Bullseye.md`: the Center Statement, the ladder table, the content-mix ratio + calibration
rule, the topic-sourcing rule, the **Content Territory** (signature lens + owned angle pillars), and
a Changelog starting at v1. Stamp it a living doc.

## Hand-off
"Bullseye's set — this is what /analyze and /produce use to keep the batch on-niche and balanced.
Want me to analyze their videos now?" Keep talk plain — don't expose file paths unless asked.
