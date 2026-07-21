# Shoot & Scale — Content System (v4.3)

The linear engine. One client, living docs, one path — no conductor, just the skills.

## The path
```
snapshot → bullseye → analyze → (create-format) → produce → revise
```
`snapshot` and `bullseye` are one-time (identity + North Star). `analyze` refreshes the content
strategy each shoot. `produce` writes a shoot's batch. `revise` turns the client's markup into the
next version of the same living doc. There is no `/run` conductor — call the skill you need.

## The skills
- **/snapshot** — the client's identity doc (voice, branding, no-gos). One-time.
- **/bullseye** — niche, the ring ladder, and the content-mix ratio. Also the topic source. One-time.
- **/analyze** — deep-reads the client's OWN videos into a living **Content Analysis** doc. Re-run
  each shoot when there's new footage.
- **/create-format** — turn a winning structure (or an original idea) into a reusable Format Bank
  brick. Standalone.
- **/produce** — confirm the shoot → check the strategy is fresh → pitch the format split → write
  hook-graded scripts one at a time → build the branded Script Doc in the shoot folder. Checks the
  shot-history ledger so it never repeats a topic or angle.
- **/revise** — read the client's green/yellow/red markup + comments on the living Script Doc; lock
  greens, rework yellows for this shoot, drop reds (logging why); turn comment-ideas into new
  scripts; update the SAME file in place; and learn durable facts/preferences into Client-Memory.

## The rules baked in
- **Topics never gate.** Pulled from the Bullseye's inner rings + the client's proven winners.
- **Formats are bank-only.** Never invented, always user-approved.
- **Never repeat across shoots.** The `Shot-History.md` ledger tracks every past topic/angle/format;
  `/produce` auto-avoids repeats.
- **One living doc per shoot.** A Word `.docx` the client annotates in place — never converted to a
  Google Doc. `/revise` reads and rewrites that same file (same link).
- **Green / yellow / red:** approved / change-this-shoot / hard-no-plus-why. Each shoot is a fixed
  set; nothing carries to a future shoot automatically.
- **The engine learns** — revisions distill durable facts/preferences into `Client-Memory.md` (you
  confirm), and red reasons into an avoid-list.

## Filing (matches the drive's READ ME — Structure & Filing Rules)
```
clients/<Client Name>/
├── Onboarding/     ← client-provided material
├── Strategy/       ← Snapshot.md · Bullseye.md · Content-Analysis.md · Client-Memory.md · Shot-History.md
└── Content/
    ├── Shoot 1/    ← Raw Videos/ · Edited Videos/ · Scripts/
    ├── Shoot 2/    …
    └── Shoot N/
```
Scripts file to `Content/Shoot N/Scripts/` as `<Client> - Scripts - Shoot N.docx` (one per shoot).
The Format Bank (`format-bank/`) is global. Always ask which shoot before writing.

## Portability
File I/O in the skills is written as intent over six logical operations (see
`skills/revise/references/drive-adapter.md`), so the same skills run on Cowork's Drive connector +
mount or on the Shoot & Scale app's Google Drive/Docs API. `read_review.py` and `build_script_doc.py`
run on bytes and are identical in both.

## Requires
Sandcastles (for `/analyze`). `python-docx` for the Script Doc generator and the review reader.
