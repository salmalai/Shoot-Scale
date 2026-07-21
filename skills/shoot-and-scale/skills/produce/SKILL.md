---
name: produce
description: Produce ready-to-shoot scripts for a client's SHOOT: confirm which shoot, check the content strategy is fresh, pitch the format split for approval, write hook-graded scripts one at a time, and build the branded Script Doc in the shoot folder. Use for /produce, "produce [N] for [client]", "write scripts for [client]", "make [client]'s batch", or "shoot [N] for [client]". Reads the client's living docs, past shoots, and Format Bank so it never repeats a script. Formats are bank-only.
---

# Produce

The back half of the engine: **confirm the shoot → check the strategy is fresh → pitch the format
split → user approves formats → write the scripts one at a time (hooks graded) → build the branded
doc in its shoot folder → learn from the edits.**

## The inputs (read all of these first)
Look under `clients/<Client Name>/Strategy/` first; if a doc isn't there, fall back to the client
folder root (older clients kept them there). Never invent — if a doc is missing, say so.
- `Strategy/Snapshot.md` — voice, branding, **hard no-gos**.
- `Strategy/Bullseye.md` — the rings + the **content-mix ratio** and the topic zones.
- `Strategy/Content-Analysis.md` — **what's working vs. flopping**, by format and topic, plus the
  proven topic bank. This is the spine of every decision.
- `Strategy/Client-Memory.md` — **learned preferences and no-gos harvested from past revisions**
  (e.g. "won't put other law firms down"). If it exists, it is inviolable, same as the Snapshot's
  no-gos. If it doesn't exist yet, that's fine — `/revise` creates it.
- `Strategy/Shot-History.md` — the **ledger of every video already shot** (shoot #, topic, angle,
  format, hook). This is the memory that guarantees you never repeat a topic or angle across shoots.
  If it doesn't exist yet, backfill it once by reading the prior shoots' `Content/Shoot */Scripts/`
  docs, then keep using it.
- `format-bank/INDEX.md` + the bricks — the ONLY place formats come from.

## The rules that keep this honest
1. **Formats are bank-only and user-approved.** Every format is an indexed Format-Bank brick. Never
   invent a format, never pitch one that isn't in the bank, never write on an unapproved format. Want
   a structure that isn't banked? Route to `/create-format` first.
2. **Topics never gate.** You choose topics yourself from the Bullseye's inner rings + the client's
   proven winning topics (Content Analysis). The user approves formats, not topics.
3. **Don't reproduce a past script.** Formats and topics are free to repeat — reusing a proven
   format, or covering a topic again from a fresh angle, is encouraged. The ONLY thing that must
   never ship is the *same script*: the past shoots' final scripts are there so you can see what's
   already been written and write something genuinely new, not a copy or a light reword of an
   existing one. Same format + same topic + a fresh script is completely fine.

## Step 0 — Lock the shoot, the folders, and the memory (do this before anything else)
1. **Ask which shoot this is for — always.** "Is this Shoot 1, Shoot 2, Shoot 3…, or the Free
   Trial?" Never assume. This decides where everything files. (Hard rule from the drive README:
   if the shoot is unknown, ask — never drop work at the client root.)
2. **Scaffold the shoot folder — and NEVER create a duplicate script doc.** Look in
   `clients/<Client Name>/Content/`. If the shoot folder (e.g. `Shoot 3/`) does **not** exist, create
   it with its three subfolders exactly: `Content/Shoot 3/Raw Videos/`, `Content/Shoot 3/Edited
   Videos/`, `Content/Shoot 3/Scripts/` (Title Case, plain "Shoot 3" — no `#`). If it already exists,
   use it as-is. Then **check `Shoot <N>/Scripts/` for an existing script doc BEFORE writing.** If one
   is already there, STOP and ask: "There's already a script doc for Shoot <N> — do you want to (a)
   edit that existing one, (b) replace it and start fresh, or (c) is this genuinely a separate doc?"
   Never silently drop a second doc into the same shoot — the rule is **one Script Doc per shoot**. If
   they say replace, overwrite the SAME file; if edit, hand to `/revise`.
3. **Freshness reminder (content strategy only).** Check the date on `Content-Analysis.md`. Tell the
   operator plainly: "Their content strategy was last updated [date]. Did they post new videos since
   then? If so, go bulk-analyze the new ones in Sandcastles and hand me the fresh JSON, and I'll fold
   it in first." If they say it's current, move on. **Do NOT re-ask about onboarding or the
   Bullseye** — those are one-time and don't change per shoot.
4. **Load the shot-history ledger.** Read `Strategy/Shot-History.md` — every topic/angle/format
   already shot for this client. If it's missing, backfill it once from the prior shoots'
   `Content/Shoot */Scripts/` docs, then use it. This is how you avoid repeats without re-reading
   every full doc each time.

## Step 1 — Decide the format split
From the Content Analysis, apply the format philosophy:
- **Double down on what works** — weight the batch toward formats winning for this client.
- **Erase what flops** — never use a format the Content Analysis lists as flopping for them.
- **Try the untested** — deliberately include a few bank formats they've never run as real
  experiments; that's how we find their next winner. Each must fit the niche, person, and analysis.
- **Honor the idea bank** — if the user/client has dropped specific ideas for this client, slot them
  in and match each to the format that best fits it ("this idea lands well as [format]").
Balance the count to the Bullseye ratio (e.g. 20 → 9/6/5 across rings).

## Step 2 — Pitch the split (the ONE creative gate)
Present the batch as a **format split**, not topics:
> "[N] scripts across [~6] formats, ~3 each. Doubling down on [format] because it's winning; trying
> [format] because we've never tested it and it fits; dropping [format] because it keeps flopping
> for them." Each format is a real bank brick (name + number).
**Flag provenance** for each format: proven winner (Content Analysis), untested experiment, or only
newly/auto-added and not yet vetted (check the brick's `vetted-by:` stamp + the INDEX vetting note).
Never present an unvetted brick as a proven winner. The user approves or swaps ("not that one, give
me another") — pull the next-best bank replacement and keep the ring balance. **Nothing gets written
until the split is approved.** Keep topics to yourself.

## Step 3 — Write the scripts ONE AT A TIME (hooks graded)
Do **not** dump the whole batch at once — that invites rubber-stamping. Write and present **script 1,
pause for the user's reaction, then script 2**, and so on. Watch their reactions as you go and adjust
the ones that follow.

For each slot: pick a topic yourself (Bullseye inner rings + proven topics; respect EVERY no-go from
the Snapshot AND Client-Memory). **Check every pick against the Shot-History ledger and auto-avoid
repeats** — if the topic OR angle is too close to something already shot, steer to a genuinely
different one on your own; only flag the operator if you truly can't find a fresh angle in the niche.
You may reuse a past *format*; just make sure the topic/angle AND the script are new. Then write it.
1. **ALWAYS open and read the actual format brick before writing** — never reconstruct from memory.
2. Use the **Script Writer prompt** (`references/script-writer-prompt.md`): paste the brick into the
   `=== THE FORMAT ===` slot and the Snapshot into the `=== NICHE & Avatar Voice & Content Context
   ===` slot. Follow its hook engine and output format exactly.
3. Write each as the canonical block: **Topic → Format (name + reference URL) → Text Hook → Editor
   Notes → Script.** Text hook 3–7 words, Title Case, "you/your", distinct from the spoken opening.
4. **Grade every spoken hook** against `references/kallaway-hooks-workshop.md`: rapid context,
   clarity, contrast/curiosity, distillation, specificity, absorption, instant value. Screen
   anti-patterns (vague superlatives, delayed context, throat-clearing, jargon, generic fear
   kickers) and **never use an em-dash in a hook.** Iterate any hook below **B+** until it's B+ or
   better. Show each hook's final grade in one line; keep reasoning tucked.

## Step 4 — Build the branded Script Doc (into the shoot folder)
Package the batch into the branded `.docx` (logo, legend, cyan header, review instructions, one video
per page, Topic/Format/Text-Hook grid, Editor Notes + Script boxes):
1. Tag each script line by speaker: **client → black**, **interviewer → red**. Monologue = all
   client; Q&A = question is interviewer, answer is client (split into `runs` if a bullet has both).
2. Keep **Editor Notes** to production direction only (what to shoot / how to cut) — never content or
   the "why." If you want to record why a topic/format was chosen, keep it in your hand-off talk, not
   in the Editor Notes box.
3. Write the data JSON per the schema at the top of `scripts/build_script_doc.py` (set `shoot` to
   e.g. "Shoot 2" — it prints as the big header; there is no date field), then run:
   `python3 scripts/build_script_doc.py <data.json> "clients/<Client Name>/Content/Shoot <N>/Scripts/<Client> - Scripts - Shoot <N>.docx"`
   (needs `python-docx`; `pip install python-docx --break-system-packages` if missing).
4. **File it in the shoot's `Scripts/` folder** — `clients/<Client Name>/Content/Shoot <N>/Scripts/`.
   Do NOT write to `Strategy/scripts/` or the client root. Name it exactly
   `<Client> - Scripts - Shoot <N>` (no date). One doc per shoot.
5. Present the `.docx`. Give the user the client-facing instruction: the client reviews by **editing
   this Word file directly in Google Drive** (double-click → Edit) — they can change any wording
   themselves, then highlight each video title: **green = approved/ready, yellow = wants a change
   (they say what in a comment; we rework it for this same shoot), red = a hard no + why in a
   comment.** Each shoot is its own fixed set — nothing carries over to a future shoot automatically. **They must NOT convert it to a Google Doc /
   "Open with Google Docs" / "Save as Google Doc."** Converting forks a separate copy, breaks the
   living-doc link, and loses formatting. It stays one Word file the whole way through so `/revise`
   can update it in place.

## Step 5 — Hand off to review + learning
The client marks up that same doc; when they send it back, that's `/revise` (reads their
green/yellow/red + comments, learns their preferences into `Client-Memory.md` and the format bricks,
and rewrites the SAME doc). You don't have to do that here — just point them to it: "When they've
marked it up, come back and I'll run the revision."

If, while writing, the user gives you a clear voice/format correction, note it and after the batch
**reflect**: was it a voice miss (→ Snapshot/Client-Memory), a weak hook pattern or structural flaw
(→ the format brick, via `/create-format`'s update flow), or a plugin gap? **Ask before changing
anything.**

## Adding a single script to an existing shoot
If the user says "add this one idea to their doc for the upcoming shoot" (not a new batch), that's a
targeted add to the existing living doc — hand it to `/revise`, which finds the latest Script Doc for
that shoot and appends the new script in the chosen format. `/produce` is for new batches; `/revise`
owns edits to a doc that already exists.

## Keep talk plain — don't expose file paths unless asked.
