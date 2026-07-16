---
name: create-format
description: Turn one short-form video URL — OR one original idea — into a reusable "Format AI Prompt" brick saved in the Format Bank. Use when the user types "/create-format", says "create format", "add a format", "make a format from this video", "save this as a format", pastes a TikTok / Instagram / YouTube Shorts URL, or says "I have a custom format idea." ALWAYS switches into the "Analyze Videos" Sandcastles workspace before analyzing any URL — never a client's workspace. Optimizes the format, extracts a hook mad-lib, VISUALIZES it as 3 scripts across 3 niches, runs a refinement loop, and only saves the brick after the user approves.
---

# Create Format

Turn one video — or one original idea — into a reusable format "brick": an AI prompt that captures
the structural ENGINE (not the topic), so it can be reused on any subject later. A manual,
taste-driven habit: you spot a banger, you drop the URL — or you have an original idea and want it
formalized.

## What a real format is (judge every candidate against this)
A format = **a concept + a repeatable script structure, usually welded to a visual layout.** It must
be **niche-agnostic** — strip the topic and the skeleton still works for a law firm, a realtor, a
coach/consultant. If a candidate is really just a trend (dead audio), a one-off gag, a bare visual
layout, or a topic, it is NOT an evergreen format — do not bank it. A real format reliably produces
a good video when you plug in any topic.

## One flat bank — no status tiers
Every brick that survives the refinement loop goes into the bank and is usable for any client. There
is no Proven/Testing gate: like a format and use it, drop it if it underperforms. Record where it
came from (the `origin:` note) as provenance, not as a gate.

## Step 0 — Switch into the "Analyze Videos" workspace FIRST (non-negotiable, Mode A)
Before ANY Sandcastles call: `switch_workspace` into **Analyze Videos**
(`ef2d2968-11dc-489e-9a79-f79a1f4aed43`). Confirm with `list_workspaces` if the UUID ever misses.
This is the scratch workspace for format mining — random bangers from anywhere get analyzed here, NOT
in a client's workspace. Client workspaces stay clean: they hold only that client's own videos so
`/analyze` reads back a true picture of their channel.

**Skipping this is the #1 failure:** in the wrong workspace an already-analyzed video reads back as
"not analyzed," you burn a credit re-running it, and you pollute a client's library with a video
they never posted. If the source video is already in Analyze Videos, `get_video_details` returns the
full analysis for free — always check there before spending.

Mode B (custom idea, no URL) touches no Sandcastles tools — skip this step entirely.

## Input — two modes
- **Mode A — URL:** in the **Analyze Videos** workspace, analyze it with Sandcastles `analyze_video`
  (already-analyzed = free; never re-run). Pull the spoken_hook + madlib, narrative_structure
  sections, format_type, topic, common_belief / contrarian_reality, and the visual_layout.
- **Mode B — custom idea (no URL):** parse the idea into beats; write a faithful example script in
  its rhythm, labeled illustrative.

## Steps
1. Find the repeatable ENGINE (structure separate from topic); count the beats.
2. Optimize it: strip anything niche-specific; pressure-test TAM, curiosity gap, relatability; make
   beats pure-payload, snappy, well-escalated.
3. Build the clean transcript and the fill-in-the-blank Mad Lib.
4. **Extract the HOOK mad-lib too.** Pull the source video's spoken hook and strip it to its
   reusable shape (e.g. "This [thing] hit [big metric] and it comes down to [N] things"). Store it
   in the brick as a **HOOK MAD LIB** line so write-script has a proven, on-format opening to adapt.
   Screen the example hooks for anti-patterns and fix them: no vague superlatives, no delayed topic
   context, no throat-clearing, and **never an em-dash in a hook (it reads as AI)** — use periods,
   commas, or line breaks.
5. Draft ONE Format AI Prompt using the EXACT template in `references/format-template.md`, with the
   required blocks: **BEST FOR**, **CHOOSING THE TOPIC**, **HOW THE FORMAT WORKS**, **STRUCTURE /
   MAD LIB**, **HOOK MAD LIB**, **REFERENCE TRANSCRIPT**. Copy-paste ready, ~250 words, a 2–4 word
   name. Do NOT save yet.
6. **VISUALIZE in 3 niches** — three short demo scripts (**law firm, real estate, coach/consultant**)
   following the exact beats, only the topic changing, so the user SEES it's niche-agnostic.
7. **Refinement loop:** show name, beats, hook mad-lib, and the 3 niche scripts; ask what's working
   and what isn't; revise and re-show 2–3 rounds. If it can't be made reliably good across niches,
   recommend scrapping it rather than banking a dud.
8. **Save only on approval.** Write to `./format-bank/format-NN-[slug].md` (next number from
   `INDEX.md`). First line is the source comment:
   `<!-- source: <URL or "custom idea"> · format #NN · [Name] · category: X · origin: [Client/source] [date] · vetted-by: <user name> · <date> -->`
   The `vetted-by:` stamp is REQUIRED — it records who approved the brick, so it can never be mistaken
   for an auto-added/unvetted format later. Then add it to `INDEX.md` under its category
   (Games/Challenges, Educational, or Skits).

## Updating an existing format
Open the brick, re-run the 3-niche refinement loop (and re-check the hook mad-lib), and overwrite in
place (same number/slug), updating the source comment.

## The Format Bank
Folder `format-bank/` with the bricks + `INDEX.md`. The INDEX carries the Status system and each
brick's BEST FOR line. Keep talk plain; don't expose file paths unless asked.

---

## v3 operating rules (2026-07-10 — from the first live run; override where in conflict)

- **Self-contained & evergreen gate.** Reject any candidate that needs an external video to pull or react to. If it can't reliably produce a good video from ANY topic with zero external dependency, it is NOT a format. (Reaction #14 was removed for exactly this.)
- **Pitch first, build second.** Pitch candidates you believe are repeatable + evergreen + usable for ANY client (with links); user approves; THEN optimize via the normal 3-niche process; THEN write scripts. Never write scripts on an unapproved structure.
- **Format mining lives in "Analyze Videos."** Every URL analyzed for a format brick goes in that workspace — never a client's. `/analyze` owns client workspaces; `/create-format` owns Analyze Videos. If a format candidate surfaced from a *client's* winner during `/analyze`, it's already analyzed in their workspace — read it there, don't re-analyze it, and don't switch back and forth mid-run.
