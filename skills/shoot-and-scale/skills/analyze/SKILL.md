---
name: analyze
description: Deep-read a client's OWN videos into a living Content Analysis doc — what's working vs. flopping, by format and topic — and surface repeatable format candidates from their winners for approval into the Format Bank. Use for /analyze, "analyze [client]", "what's working for [client]", or "deep dive [client]'s channel". Runs on Sandcastles: switch into the client's workspace first, then read a JSON export. Competitor analysis is out of scope.
---

# Analyze

Deep-read the client's **own** content and keep ONE living document current: the **Content
Analysis**. This is the third living client doc (after Snapshot and Bullseye) and the only one that
changes every run. It answers one question: **what is actually working on this client's page, and
what isn't — by format and by topic** — so `/produce` can double down on winners and stop repeating
what flops.

You are a film editor handed raw footage: each analyzed video is a clip. Don't hand back the
footage — cut it into a clear read.

**Competitors are out of scope.** This skill looks only at the client's own channel. If the user
wants a competitor read, that's a manual job outside this workflow.

## Where it lives
`clients/<Client Name>/Strategy/Content-Analysis.md`. Reads `Strategy/Snapshot.md` (voice/no-gos + the
pinned **Sandcastles workspace + channel UUID**) and `Strategy/Bullseye.md` (rings/ratio) — fall back
to the client root for older clients. The Format Bank
(`format-bank/`) is global. Refer to Sandcastles tools by plain names (`list_workspaces`,
`switch_workspace`, `channel_recap`) — never hardcode a server prefix. The deep read comes from a
**JSON export**, NOT from per-video tool calls.

## Step 0 — Switch into the client's Sandcastles workspace FIRST (non-negotiable)
Before ANY pull: `list_workspaces` → `switch_workspace` into the **client's own workspace** (each
client has one; the name matches the client). The Snapshot's **Sandcastles** line records the exact
workspace + channel UUID — use it. **Skipping this is the #1 failure:** in the wrong workspace every
video reads back as "not analyzed" and you waste calls (and can burn credits) chasing nothing.
Also: a `@handle` is often ambiguous (same handle on Instagram AND YouTube Shorts). ALWAYS resolve
the channel by the **UUID pinned in the Snapshot**, never by handle.

## Step 1 — Get the analyzed set as a JSON export (the reliable, FREE path)
The Sandcastles MCP read path is unreliable: web-app-analyzed videos are NOT in the MCP "library," so
`get_video_details` returns nothing and **`analyze_video` CHARGES a credit even for already-analyzed
videos.** Do NOT read via the tools. Instead have the user export — this is the STANDING workflow
every time we run or re-run the deep analysis of a channel:
> Quick step for you in the Sandcastles web app (in the client's workspace):
> 1. Open **Videos** and filter to the client's channel.
> 2. Set **Posted in last 3 months**, **Engagement ≥ 2%**, and **sort by Outlier score**.
> 3. **Bulk-Analyze the top ~100** (already-analyzed = free; only brand-new ones cost 1 credit each —
>    that's the credit gate, entirely on your side).
> 4. Click **Export → JSON** and hand me the file.
Do it manually every time; don't try to reconstruct it through the MCP. Then read the JSON — each
video carries: `outlier_score`, `engagement_rate`, `view_count`, `format_category`, `format_type`,
`topic`, `seed`, `angle`, `hook`, `hook_category`, `mad_lib_formula`, `visual_layout`, `transcript`,
`url`. Aggregate by format_type and by topic cluster (median + max outlier per bucket) and pull the
winners' hooks/mad-libs. On a re-run, read the existing `Content-Analysis.md` first and find only
what CHANGED since the last date; don't rebuild from scratch.

**CREDIT GATE — hard rule:** never call `analyze_video` just to READ a video; it charges. The only
credits ever spent are the user's own web-app bulk-analyze, which they control. A brand-new channel
with nothing exported yet: say so and write a thin v1 leaning on the Snapshot + Bullseye until data exists.

## Step 2 — Read the winners AND the floor (with the boosted screen)
Read the analyzed structure of the top videos from the JSON.
- **Boosted screen:** the export is already filtered to **≥2% engagement**, so most paid-reach junk
  is pre-excluded — but still flag any naked "comment WORD" ad that slipped in (high views, no
  organic signal) so you don't learn the wrong lesson.
- Read **winners** (what to double down on) **and the floor** (what to stop doing): repost-farming
  duplicates, off-ICP promos, naked comment-bait with no payload, generic talking-head.

## Step 3 — Bucket it (formats AND topics)
Tally against outlier score, and write two clean buckets:

**FORMATS**
- **Working** — the formats behind their biggest outliers → double down.
- **Flopping** — formats that consistently underperform on their page → `/produce` must NOT reuse
  these (this is the client-specific subtract). Name them explicitly.
- Note which "working" formats map to an existing **Format Bank brick** vs. which are structures not
  yet banked.

**TOPICS**
- **Working** — subject territories that consistently overperform (cluster, rank by outlier, cite
  2–3 examples with links). These become the client's proven topic bank for `/produce`.
- **Flopping / off-ICP** — topics that pull the wrong audience or fall flat.

## Step 4 — Surface format candidates (the format-vetting gate)
From the winners, spot any structure that *could* be templatized into a reusable, niche-agnostic
brick. **Hand the user the link and ask** — "this structure keeps winning for them; is it a
repeatable format we could bank for every client?" You decide most are no; that's correct. For each
**yes**, hand off to `/create-format` (which optimizes, visualizes across 3 niches, and banks it).
Never bank a format here directly, and never invent one.

## Step 5 — Write / update the living Content Analysis doc
Overwrite `Content-Analysis.md` in place (one current version), dated, with a short changelog entry:
- **Headline finding** — the one structural truth this run.
- **Formats: Working / Flopping** (with bank-brick mapping + the explicit do-not-reuse list).
- **Topics: Working / Flopping-or-off-ICP** (with example links — the proven topic bank).
- **Boosted / floor screen** — what you excluded and why.
- **Format candidates** — any surfaced, with links + status (pending / approved → banked / rejected).
- **Changelog** — date, videos analyzed, what changed vs. last run.

On a re-run after a shoot: fold in how the new posts did, move formats/topics between buckets as the
data shifts, and note it in the changelog. This doc is the memory that keeps the strategy from going
stale.

## Hand-off
"Analysis is current — we now know what's working and what to avoid for them. Want me to produce a
batch?" (that's `/produce`). A format worth banking → route to `/create-format`. Keep talk plain —
don't expose file paths unless asked.
