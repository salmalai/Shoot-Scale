---
name: revise
description: Turn a client's marked-up Script Doc into the next version of the SAME living doc, and learn from it. Use for /revise, "revise [client]", "read the revisions", "client sent back the doc", or "add this idea to [client]'s doc". Reads each video's verdict (green=approved, yellow=change, red=no) + comments, then locks greens, reworks yellows, drops reds (logging why), turns comment ideas into new scripts, updates the same file in place, and learns durable facts into Client-Memory. Once every video is approved it's ready to shoot; the videographer later writes what happened in each video's SHOT STATUS box (the ledgers are written from that, not from approval).
---

# Revise

The client marked up the Script Doc — green/yellow/red on each video title, plus comments. This skill
reads that, **acts on it in the SAME living document**, and **learns** from it so the next batch is
better. It never makes a new file; it updates the one the client reviewed, so the link never changes.

## The golden rule — one living file, read right before you write
Everything happens on the client's actual doc. **Re-read the file immediately before you write it
back** and overwrite the *same file* (same name, same link). This is a whole-file swap: read the
current bytes → change only what needs changing → write the same bytes back. Reading right before
writing is what stops you from clobbering an edit the client just made.

## File I/O is intent, not mechanics (so this ports to the app)
Describe every file step as intent and use these logical operations, which the runtime provides
(see `references/drive-adapter.md`): `find_latest_script_doc(client, shoot)`, `read_doc(ref)`,
`read_comments(ref)`, `update_doc(ref, bytes)` (overwrite same file). In Cowork these are the Drive
connector + mount; in the app they're Drive/Docs API calls. **The verdict + comment extraction is
done by `scripts/read_review.py` running on the doc bytes — that script is portable and unchanged
across environments.**

## Step 1 — Find the doc
Confirm the client and which shoot. The doc is the one Script Doc in
`clients/<Client Name>/Content/Shoot <N>/Scripts/`. If there's more than one file there, ask which —
never guess. Pull its current bytes.

## Step 2 — Read the review
Run `python3 scripts/read_review.py "<the doc>"`. You get, per video: `verdict`
(`approved` = green, `change` = yellow, `reject` = red, `pending` = untouched), the current
`topic / format / format_link / text_hook / editor_notes / script` (this reflects any wording the
client edited themselves), and their `comments`. Present a plain summary to the operator:
> "Video 1 — Change: 'she'd never say prestige, make it about cost.' Video 2 — Approved. Video 3 —
> No: 'we don't do dog-bite content.' Video 4 — Approved (she reworded the hook herself)."
Keep it human; don't dump JSON.

## Step 3 — LEARN before you edit (this is the point of the skill)
Look across the comments and the client's own text edits and separate two things:
- **One-off wording tweaks** (a punchier line, a small phrasing fix) — just keep them in the doc.
  Do NOT globalize them.
- **Durable facts or preferences** that should hold for EVERY future script — a legal fact ("the
  statute is 1 year, not 3"), a voice rule ("never say 'victim,' say 'injured client'"), a hard
  no ("don't put other firms down"), or a format/topic they dislike. For each of these, **propose**
  adding it to `clients/<Client Name>/Strategy/Client-Memory.md` and **ask before writing**:
  > "She corrected 3 years → 1 year on the statute. Want me to save that to her memory so we never
  > get it wrong again?"
  Red-verdict reasons go under `## Topic likes / dislikes` or a `## Avoid` list (format/topic + why).
  Keep memory curated and short — it's rules, not a transcript of every edit.

## Step 4 — Apply each verdict (in the same doc, this shoot)
- **Approved (green):** keep the video exactly as the client left it — their edits are final. Keep
  its `verdict: approved` so it stays green on rebuild.
- **Change (yellow):** rework THIS video for THIS shoot using their comment — new topic, different
  angle, or a rewritten script as asked. Keep the same format unless they asked to change it; respect
  every no-go (Snapshot + Client-Memory). Set it back to `pending` (no highlight) so they re-review.
- **Not this / reject (red):** remove the video. Log its reason to the avoid-list (Step 3). If the
  client's comment proposes a different idea, turn that into a NEW video (their idea, best-fit
  bank format) — `pending`, for this shoot.
- **Comment-only ideas** (a note that proposes a topic, whether loose or on a video): with the
  operator's ok, add it as a new `pending` video in a fitting format.
- **Pending (untouched):** leave as-is.
After adds/removals, the videos renumber sequentially (the builder does this).

## Step 5 — Rebuild and write back to the SAME file
Take the `read_review.py` JSON as your base, change only the videos you touched (Step 4), then
**re-read the file one more time** (anti-clobber), and rebuild:
`python3 ../produce/scripts/build_script_doc.py <data.json> "<the exact same doc path>"`
Overwrite the **same file** — same name (`<Client> - Scripts - Shoot <N>`), same link. Never write a
new file, never rename. (Approved videos rebuild green; reworked/new ones rebuild pending.)

## Step 6 — Don't write the ledgers here (and there's nothing to "lock")
Do **not** write Shot-History or the roster ledger in `/revise`. Client-green means *approved*, not
*shot* — and approved videos don't always get filmed. Those ledgers are written later, from what the
**videographer** actually reports in the SHOT STATUS boxes, during the next `/produce`'s Step 0.5
reconciliation. Writing them on approval is exactly the bug that let Shot-History claim videos that
never got shot.

**The doc never changes shape.** Every rebuild already includes a **SHOT STATUS** box on each video and
a **Videography Notes** box at the end (the builder always adds them) — so there is no separate "shoot
version" to switch to and nothing to lock. Once every video is green, just tell the operator plainly:
> "All approved and ready to shoot. After the shoot, the videographer writes what happened in each
> video's SHOT STATUS box — in their own words — plus the Videography Notes box. Next time we
> `/produce`, I'll read those and update the history."

If videos are still yellow/pending, it's **not** ready — keep looping the review (Steps 4–5).

## Step 7 — Report + loop
Tell the operator plainly what changed ("locked 2, reworked 1, dropped 1 and added your dog-training
idea"). The reworked/new videos are pending, so the client reviews again. Repeat until every video is
green — then it's approved and ready to shoot (see **Step 6**); the videographer fills the SHOT STATUS
boxes after filming.

## Single-idea add (the quick path)
"Add this idea to [client]'s doc for the shoot" isn't a full review — find the shoot's Script Doc,
read it, append ONE new `pending` video (their idea, best-fit bank format, respecting no-gos),
re-read, and overwrite the same file. Same living-doc rule.

**New client ideas belong in the Idea Bank.** Whenever the client sends a brand-new "make a video like
this" idea — whether it arrives here as a comment, a red-verdict alternative, or a "please also do X" —
first log it to `Strategy/Idea-Bank.docx` (a Word doc): if you're scripting it right now this shoot,
paste it under **Used ideas** stamped `Used — Shoot <N>, <date>`; if you're only capturing it for later,
paste it under **Open ideas** so the next `/produce` can pick it up. The Idea Bank is the durable home
for every idea, and each one is used only once. Edit that `.docx` in place — never convert it to a
Google Doc.

## Cowork test note
To read: materialize the file bytes (Drive connector download or the mount) and run `read_review.py`.
To write: overwrite the same file path. Freshly-edited Drive files lock for a few seconds
("resource deadlock") — wait and retry rather than failing.

Keep talk plain — don't expose file paths unless asked.
