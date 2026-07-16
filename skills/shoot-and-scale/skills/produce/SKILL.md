---
name: produce
description: Produce a batch of ready-to-shoot scripts for a client — pitch the FORMAT split, get the user's approval on formats only, then write hook-graded scripts and build the branded Script Doc, all in one skill. Use when the user says "/produce", "produce [N] scripts for [client]", "write [N] for [client]", "make [client]'s batch", or when the /run conductor calls it. Reads the client's three living docs (Snapshot, Bullseye, Content Analysis) + the Format Bank. Topics never gate; formats are bank-only and approved by the user. Ends by learning from the user's edits.
---

# Produce

The whole back half of the engine in one skill: **pitch the format split → user approves formats →
write the scripts (hooks graded) → build the branded doc → learn from the edits.** Replaces the old
content-pitch + write-script + script-doc-builder chain.

## The inputs (read all of these first)
- `clients/<Client Name>/Snapshot.md` — voice, branding, **hard no-gos**.
- `clients/<Client Name>/Bullseye.md` — the rings + the **content-mix ratio** and the topic zones.
- `clients/<Client Name>/Content-Analysis.md` — **what's working vs. flopping**, by format and
  topic, plus the proven topic bank. This is the spine of every decision.
- `format-bank/INDEX.md` + the bricks — the ONLY place formats come from.

## The two rules that keep this honest
1. **Formats are bank-only and user-approved.** Every format in the batch is an indexed Format-Bank
   brick. **Never invent a format. Never pitch a format that isn't in the bank. Never write a script
   on an unapproved format.** If you want a structure that isn't banked, route to `/create-format`
   first.
2. **Topics never gate.** You choose topics yourself from the Bullseye's inner rings + the client's
   proven winning topics (Content Analysis) — an endless idea bank in their niche. The user does not
   approve topics; they approve formats.

## Step 1 — Decide the format split (the philosophy)
From the Content Analysis, apply the format philosophy:
- **Double down on what works** — weight the batch toward formats that are winning for this client.
- **Erase what flops** — do NOT use any format the Content Analysis lists as flopping for them.
- **Be creative — try the untested.** Deliberately include a few formats from the bank they've
  **never** run (including skits) as real experiments — untested is the point; that's how we find
  their next winner. Make sure each fits the niche, the person, and the analysis.
Balance the count to the Bullseye ratio (e.g. 20 → 9/6/5 across rings).

## Step 2 — Pitch the split (the ONE creative gate)
Present the batch as a **format split**, not topics:
> "[N] scripts across [~6] formats, ~3 each. Doubling down on [format] because it's winning; trying
> [format] because we've never tested it and it fits; dropping [format] because it keeps flopping
> for them." Each format is a real bank brick (name + number).
**Flag provenance in the pitch.** For each format say whether it's a proven winner (from the
Content Analysis), an untested experiment, OR only newly/auto-added and not yet user-vetted. Check
the brick header for a `vetted-by:` stamp and the Format Bank INDEX vetting-status note; never
present an unvetted or auto-added brick as a proven winner.
The user approves or swaps formats ("not that one, give me another") — pull the next-best replacement
from the bank and keep the ring balance. **Nothing gets written until the split is approved.** Do not
pitch topics; keep them to yourself.

## Step 3 — Write the scripts (hooks graded)
For each slot: pick a topic yourself (Bullseye inner rings + the client's proven topics; respect
every no-go), then write the script.
1. **ALWAYS open and read the actual format brick before writing** — never reconstruct from memory.
2. Use the **Script Writer prompt** (`references/script-writer-prompt.md`): paste the brick into the
   `=== THE FORMAT ===` slot and the Snapshot into the `=== NICHE & Avatar Voice & Content Context
   ===` slot. Follow its hook engine and output format exactly.
3. Write each as the canonical block: **Topic → Format (name + reference URL) → Text Hook → Editor
   Notes → Script.** Text hook 3–7 words, Title Case, "you/your", distinct from the spoken opening.
4. **Grade every spoken hook** against the rubric in `references/kallaway-hooks-workshop.md`: rapid
   context, clarity, contrast/curiosity, distillation, specificity, absorption, instant value.
   Screen anti-patterns (vague superlatives, delayed context, throat-clearing, jargon, generic fear
   kickers) and **never use an em-dash in a hook — it reads as AI.** Iterate any hook below **B+**
   until it's B+ or better. Show each hook's final grade in one line; keep reasoning tucked.

## Step 4 — Build the branded Script Doc
Package the batch into the branded `.docx` (logo, legend, cyan header, review instructions, one
video per page, Topic/Format/Text-Hook grid, Editor Notes + Script boxes):
1. Tag each script line by speaker: **client → black**, **interviewer → red**. Monologue = all
   client; Q&A = question is interviewer, answer is client (split into `runs` if a bullet has both).
2. Add the top-of-block **`inspiration` / `why`** field (topic-or-format link + ring position +
   optional one-line why), kept **separate** from `editor_notes` (which is shot/edit direction only).
3. Write the data JSON per the schema at the top of `scripts/build_script_doc.py`, then run:
   `python3 scripts/build_script_doc.py <data.json> "clients/<Client Name>/scripts/<Client> - Script Doc <date>.docx"`
   (needs `python-docx`; `pip install python-docx --break-system-packages` if missing).
4. Save into `clients/<Client Name>/scripts/`. Present the `.docx`. Tell the user the one manual step:
   open it in Drive via right-click → Open with → Google Docs; review by highlighting the title
   (green=approve, yellow=remix, red=reject) and commenting.

## Step 5 — Review one by one, then LEARN from the edits
The user reviews scripts and requests changes. Make them in their voice, one at a time.
Then **reflect** (this is required, not optional): look across everything they changed and ask
yourself *why*. Was it a voice miss? A weak hook pattern? A structural flaw in the format itself?
- If the edits point to a fix in a **format brick's** prompt, propose updating it via
  `/create-format`'s "update an existing format" flow — so scripts come out better next time for
  **every** client.
- If they point to a **Snapshot / Bullseye / Content-Analysis** gap, propose updating that doc.
- If they point to a **plugin/skill** improvement, say so.
**Ask before changing anything.** Surface it plainly: "I noticed you kept doing X — I think we should
update [the brick / this doc / the plugin]. Want me to?"

## Hand-off
When `/run` called this, return control to it after the doc is built. Keep talk plain — don't expose
file paths unless asked.
