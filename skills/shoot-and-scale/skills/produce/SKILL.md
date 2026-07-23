---
name: produce
description: Produce ready-to-shoot scripts for a client's SHOOT: confirm which shoot, check the content strategy is fresh, pitch the format split for approval, write hook-graded scripts one at a time, and build the branded Script Doc in the shoot folder. Use for /produce, "produce [N] for [client]", "write scripts for [client]", "make [client]'s batch", or "shoot [N] for [client]". Reads the client's living docs, past shoots, the roster-wide ledger, and Format Bank so it never repeats a script — for this client or any other client in the niche. Formats are bank-only.
---

# Produce

The back half of the engine: **confirm the shoot → check the strategy is fresh → pitch the format
split → user approves formats → write the scripts one at a time (hooks graded) → build the branded
doc in its shoot folder → learn from the edits.**

## The inputs (read all of these first)
Look under `clients/<Client Name>/Strategy/` first; if a doc isn't there, fall back to the client
folder root (older clients kept them there). Never invent — if a doc is missing, say so.
- `Strategy/Snapshot.md` — voice, branding, **hard no-gos**.
- `Strategy/Bullseye.md` — the rings, the **content-mix ratio**, the topic zones, and the client's
  **Content Territory** (their signature lens + owned angle pillars — the personal door every generic
  topic comes through). See rule 5.
- `Strategy/Content-Analysis.md` — **what's working vs. flopping**, by format and topic, plus the
  proven topic bank. This is the spine of every decision.
- `Strategy/Client-Memory.md` — **learned preferences and no-gos harvested from past revisions AND
  from the videographer's post-shoot notes** (e.g. "won't put other law firms down," "client dropped
  reenactments"). If it exists, it is inviolable, same as the Snapshot's no-gos. Created at
  `/onboarding`; `/revise` and this skill's Step 0.5 reconciliation add to it (asking first).
- `Strategy/Shot-History.md` — the **ledger of videos that were actually SHOT** (shoot #, topic, angle,
  format, hook) — never merely scripted or approved. A video lands here only when the videographer
  marked it **green (shot)** and Step 0.5 reconciled it. This is the memory that guarantees you never
  repeat a topic or angle across shoots. Created at `/onboarding`; if it's missing on an older client,
  backfill it once by reading prior shoots' `Content/Shoot */Scripts/` docs, then keep using it.
- `Strategy/Idea-Bank.docx` — **client-sent ideas** (a pasted URL + note: "make a video like this"), a
  **Word doc** with two sections: **Open ideas** (not yet used) and **Used ideas** (already scripted).
  Read it with `pandoc -t markdown "Strategy/Idea-Bank.docx"` (or python-docx). **Only pull from Open
  ideas.** For each open idea you turn into a script this batch, **tag its provenance** (`from client
  idea bank`) in the roster ledger, and — critically — **move it from Open ideas to Used ideas in the
  `.docx`** (stamp it `Used — Shoot <N>, <date> → <topic>`). An idea is used **exactly once**: never
  script an idea that's already in Used ideas (and Shot-History dedup is the backstop). See Step 1 and
  Step 4 for how this is written back.
- `roster-ledger.md` (drive root, sibling to `format-bank/`) — the **roster-wide ledger of every
  script already shipped for ANY client**: date, client, niche, format, topic, angle, text hook, and
  a `fills:` fingerprint. Shot-History stops *this* client repeating itself; the roster ledger stops
  *different* clients in the same niche shipping the same script. Read it every run. If it's missing,
  create it from the template header and backfill by aggregating every client's `Shot-History.md`.
  See rules 4 and 5.
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
   existing one. Same format + same topic + a fresh script is completely fine **for the same client**
   — the cross-client case is stricter, see rule 4.
4. **Never repeat across the roster (the collision rule).** Shot-History keeps a client from
   repeating *itself*; `roster-ledger.md` keeps the whole client base from *converging on each other*.
   Within a niche, a **(format × topic) pair can be claimed once across ALL clients.** So: if you're
   reusing a format another client in this niche already ran, the topic/angle MUST be net-new to the
   roster; if you're covering a topic another client already covered, the format MUST differ. **Never
   ship the same format + same topic another client already got.** Check every pick against the roster
   ledger, not just this client's Shot-History.
5. **The brick is a skeleton; the client is the flesh (no twin scripts).** A format brick's
   `REFERENCE TRANSCRIPT` and example fills exist to show the STRUCTURE only — never fill beats from
   them. Every concrete thing in a script — the examples, the list items, the numbers, the city, the
   cases, the story, the punchline — must be sourced from THIS client's own material (Snapshot,
   Content-Analysis, Client-Memory, and their **Content Territory** in the Bullseye). Two clients on
   the same format + a close topic produce twin scripts if you let the brick fill the blanks; routing
   every fill through the client's Content Territory is what makes them diverge by design.

## Step 0 — Confirm the shoot, the folders, and the memory (do this before anything else)
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
   it in first." If they hand you a new export, **save it into `Strategy/Analysis JSON/` (dated)** and
   run `/analyze` before scripting. If they say it's current, move on. **Do NOT re-ask about onboarding
   or the Bullseye** — those are one-time and don't change per shoot.
4. **Load the shot-history ledger.** Read `Strategy/Shot-History.md` — every topic/angle/format
   already **shot** for this client (kept current by the Step 0.5 reconciliation below). If it's
   missing on an older client, backfill it once from the prior shoots' `Content/Shoot */Scripts/`
   docs, then use it. This is how you avoid repeats without re-reading every full doc each time.
5. **Load the roster ledger.** Read `roster-ledger.md` at the drive root — every script already
   shipped for every client, with its niche and `fills:` fingerprint. This is the cross-client memory
   that powers the collision rule (rule 4) and the twin-script check (rule 5 + Step 3). If it's
   missing, create it from the template header and backfill by aggregating every client's
   `Shot-History.md`, then use it. **Filter it to THIS client's niche** so you're only comparing
   against the clients who could actually collide (e.g. all Personal Injury clients).

## Step 0.5 — Reconcile the PREVIOUS shoot (every shoot after the first)
Shot-History reflects **reality, not intent** — so before scripting a new batch, reconcile what
actually happened on the last one. **Skip this for Shoot 1** (nothing came before it).

Find the previous shoot's Script Doc in `Content/Shoot <N-1>/Scripts/` and read it with
`../revise/scripts/read_review.py`. Each video carries a free-text **`shot_status`** (the SHOT STATUS
box) where the videographer wrote — **in their own words** — what happened, plus a document-level
**`videography_notes`** recap for the whole day. **Read them like a human and infer intent from
context; there are no fixed keywords.** Sort each video into one of three outcomes:

- **Shot** (e.g. "got it," "done," "filmed all of these"). Append it to **`Strategy/Shot-History.md`**
  and to **`roster-ledger.md`** (with its `fills:` fingerprint; add `from client idea bank` if that's
  where it came from). This is the ONLY thing that writes those ledgers — client approval alone never
  does.
- **Not shot but wanted** (e.g. "ran out of time, let's grab it next shoot," "save for next time").
  It carries forward: offer it as a ready-made, already-approved candidate for THIS batch. Don't
  re-invent it; reuse the script as-is.
- **Dropped** (e.g. "client didn't want this one," "she changed her mind on reenactments"). Do not
  carry it forward; if the reason is a durable rule, **propose adding it to `Client-Memory.md`** (ask
  first).

When a note is genuinely ambiguous, **ask the operator** rather than guessing. Fold any durable
facts/preferences from the `videography_notes` recap into `Client-Memory.md` the same way (ask first).

**If the previous shoot's SHOT STATUS boxes are all blank** (never filled in), say so and reconstruct
from what you can: treat the shoot's `Edited Videos/` as evidence of what shipped, or ask the operator
which videos got shot. Never assume every approved video was shot.

## Step 1 — Decide the format split
From the Content Analysis, apply the format philosophy:
- **Double down on what works** — weight the batch toward formats winning for this client.
- **Erase what flops** — never use a format the Content Analysis lists as flopping for them.
- **Try the untested** — deliberately include a few bank formats they've never run as real
  experiments; that's how we find their next winner. Each must fit the niche, person, and analysis.
- **Honor the idea bank** — read `Strategy/Idea-Bank.docx` and look at its **Open ideas** section only;
  for any on-strategy open idea, slot it in and match it to the best-fit bank format ("this idea lands
  well as [format]"). Skip anything already under **Used ideas** or in Shot-History (made), and skip
  off-strategy ideas (respect the Bullseye + no-gos even for client ideas). Any open idea you script
  gets **moved to Used ideas** when you write the batch (Step 4) — one idea, one script, never twice.
- **Carry forward last shoot's yellows** — any video the Step 0.5 reconciliation surfaced as
  liked-but-not-shot is already written and already client-approved; reuse it as-is toward this batch
  rather than inventing a fresh one.

Balance the main count to the Bullseye ratio (e.g. 20 → 9/6/5 across rings).

**Backups (the SOP).** On top of the main set, add **3 backup scripts** — deliberately *low-lift*
formats (simple talking-head, easy setups) so they're painless to swap in if the client changes their
mind or a video can't be shot on the day. So a "12-video" batch is really **12 main + 3 backups = 15
scripts, all sent for client approval.** Backups still respect the ratio, no-gos, and no-repeat rules;
they just live in their own section. Unused backups aren't wasted — left yellow after the shoot, they
carry forward like anything else.

## Step 2 — Pitch the split (the ONE creative gate)
Present the batch as a **format split**, not topics:
> "[N] main scripts across [~6] formats, ~3 each — plus 3 low-lift backups. Doubling down on [format]
> because it's winning; trying [format] because we've never tested it and it fits; dropping [format]
> because it keeps flopping for them." Each format is a real bank brick (name + number). Call out
> which slots are carried-forward from last shoot (already approved) and which come from the idea bank.
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
the Snapshot AND Client-Memory), and come at it through the client's **Content Territory** (their
signature lens + owned pillars from the Bullseye) so it sounds like THEM, not a generic niche take.
**Check every pick against BOTH the Shot-History ledger (this client) AND the roster ledger (every
client in this niche), and auto-avoid repeats** — if the topic OR angle is too close to something this
client already shot, OR the format + topic pair was already claimed by another client in the niche
(rule 4), steer to a genuinely different one on your own; only flag the operator if you truly can't
find a fresh angle in the niche. You may reuse a past *format*; just make sure the topic/angle AND the
script are new **across the roster, not just this client**. Then write it.
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
5. **Twin-script check (do this before you lock the script).** Pull every roster-ledger row that used
   THIS format and compare your draft against them. It's a twin — rewrite it — if any of these match a
   prior use: the same hook mad-lib fill or a near-identical text hook; half or more of the same list
   items / examples / ranked entries; or the same central punchline or reveal. Fix the fills first
   (new examples pulled from the client's Content Territory), then the hook; if it still can't get
   clear of the prior version, switch the angle or the format. Ship only once it's distinct from every
   prior use of that format on the roster.

## Step 4 — Build the branded Script Doc (into the shoot folder)
Package the batch into the branded `.docx` (logo, legend, cyan header, review instructions, one video
per page, Topic/Format/Text-Hook grid, Editor Notes + Script boxes):
1. Tag each script line by speaker: **client → black**, **interviewer → red**. Monologue = all
   client; Q&A = question is interviewer, answer is client (split into `runs` if a bullet has both).
2. Keep **Editor Notes** to production direction only (what to shoot / how to cut) — never content or
   the "why." If you want to record why a topic/format was chosen, keep it in your hand-off talk, not
   in the Editor Notes box.
3. Write the data JSON per the schema at the top of `scripts/build_script_doc.py` (set `shoot` to
   e.g. "Shoot 2" — it prints as the big header; there is no date field). Mark each of the 3 backups
   with `"backup": true` — the builder drops them into a **BACKUP SCRIPTS** section after the main set.
   Leave `phase` unset (defaults to `review`) so this first version carries the client green/yellow/red
   legend. Then run:
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

6. **Update the Idea Bank (used-once bookkeeping).** For every script in this batch that came from the
   client's `Strategy/Idea-Bank.docx`, edit that Word doc: **move the idea out of "Open ideas" into
   "Used ideas,"** stamped `Used — Shoot <N>, <date> → <topic/format>`. This is what guarantees an idea
   is pulled **only once** — the next `/produce` reads Open ideas and won't see it again. (Edit the same
   `.docx` in place; don't convert it to a Google Doc. It's a whole-file rewrite: read it, move the
   used lines, save the same file.) If the batch used no idea-bank ideas, leave the doc untouched.

## Step 5 — Hand off to review + learning
The client marks up that same doc; when they send it back, that's `/revise` (reads their
green/yellow/red + comments, learns their preferences into `Client-Memory.md` and the format bricks,
and rewrites the SAME doc). You don't have to do that here — just point them to it: "When they've
marked it up, come back and I'll run the revision."

**The doc never changes shape.** It already has a **SHOT STATUS** box on every video and a
**Videography Notes** box at the end — from the moment it's built. The client reviews by highlighting
the title; after the shoot the videographer writes, in their own words, what happened in those boxes.
Same file, same link, the whole way through — the next `/produce`'s Step 0.5 reads those notes.
(Nothing gets "locked" or rebuilt into a second version — the two layers coexist on one unchanging doc:
the client highlights, the videographer writes.)

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
