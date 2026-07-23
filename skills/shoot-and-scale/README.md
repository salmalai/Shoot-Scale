# Shoot & Scale — Content System (v4.9)

The linear engine. One client, living docs, one path — no conductor, just the skills.

## The path
```
onboarding ─┬─ snapshot → bullseye → analyze          (one-command new-client setup)
            │
new shoot ──┴─ produce → revise → [SHOOT] → produce → revise → …
```
`onboarding` stands up a brand-new client end-to-end (folders + Snapshot + Bullseye + Content
Analysis + the empty ledgers). `snapshot` and `bullseye` are one-time (identity + North Star, and
snapshot now reads the client's website too). `analyze` refreshes the content strategy each shoot.
`produce` writes a shoot's batch — and first **reconciles the previous shoot** (what actually got
shot). `revise` turns the client's markup into the next version of the same living doc. The doc never
changes shape: it always carries a **SHOT STATUS** box per video that the videographer fills in their
own words after the shoot. There is no `/run` conductor — call the skill you need.

## The skills
- **/onboarding** — one command to stand up a new client: scaffolds the folders, confirms the
  onboarding materials, then runs snapshot → bullseye → analyze and seeds the empty Client-Memory,
  Shot-History, and Idea Bank. Idempotent (fills only what's missing). Stops before scripting.
- **/snapshot** — the client's identity doc (voice, branding, no-gos), from onboarding materials **and
  the client's website**. One-time.
- **/bullseye** — niche, the ring ladder, the content-mix ratio, and the client's **Content
  Territory** (signature lens + owned angle pillars). Also the topic source. One-time.
- **/analyze** — deep-reads the client's OWN videos into a living **Content Analysis** doc. Re-run
  each shoot when there's new footage.
- **/create-format** — turn a winning structure (or an original idea) into a reusable Format Bank
  brick. Standalone.
- **/produce** — confirm the shoot → **reconcile the previous shoot** (log what got shot, carry forward
  what didn't, learn what was dropped) → check the strategy is fresh → pitch the format split (main set
  **plus 3 low-lift backups**, pulling in client Idea-Bank ideas and carried-forward scripts) → write
  hook-graded scripts one at a time → build the branded Script Doc in the shoot folder. Checks the
  shot-history ledger AND the roster-wide ledger so it never repeats a script — for this client or any
  other client in the niche — and runs a twin-script fingerprint check before locking each script.
- **/revise** — read the client's green/yellow/red markup + comments on the living Script Doc; lock
  greens, rework yellows for this shoot, drop reds (logging why); turn comment-ideas into new
  scripts; update the SAME file in place; and learn durable facts/preferences into Client-Memory. When
  every video is approved it's **ready to shoot** — it does NOT write the ledgers (those come from the
  videographer's free-text SHOT STATUS notes at the next `/produce`).

## The rules baked in
- **Topics never gate.** Pulled from the Bullseye's inner rings + the client's proven winners.
- **Formats are bank-only.** Never invented, always user-approved.
- **Never repeat across shoots — or across clients.** Per-client `Shot-History.md` stops a client
  repeating itself; the roster-wide `roster-ledger.md` (drive root) stops two clients in the same
  niche shipping the same script. Within a niche a **(format × topic) pair is claimed once across all
  clients**: reuse the format only on a roster-new topic; reuse the topic only with a different format.
- **Diverge by design (Content Territory).** A format brick is a skeleton only — every concrete fill
  comes from the client's own material and their **Content Territory** (in the Bullseye), never from
  the brick's example transcript. A fingerprint (`fills:`) on each shipped script powers `/produce`'s
  twin-script check.
- **One living doc per shoot.** A Word `.docx` the client annotates in place — never converted to a
  Google Doc. `/revise` reads and rewrites that same file (same link).
- **Two review layers, one unchanging doc.** Every script doc has, from the start, a **SHOT STATUS**
  box on each video and a **Videography Notes** box at the end. The *client* reviews by **highlighting**
  the title (green/yellow/red = approve/change/reject); after the shoot the *videographer* **writes, in
  their own words**, what happened in the SHOT STATUS box ("got it" / "save for next time" / "client
  dropped this — reason"). The AI reads those notes and infers intent — no fixed keywords. The doc
  never changes shape and nothing gets "locked": the two layers just coexist (client highlights,
  videographer writes), and the videographer never renumbers or deletes.
- **Shot-History = reality, not intent.** It logs ONLY videos the videographer reported as shot,
  reconciled at the start of the next `/produce`. Approval alone never writes it.
- **Backups baked in.** Every batch = main set + **3 low-lift backups**, all client-approved; unused
  backups carry forward.
- **Idea Bank.** `Idea-Bank.docx` is a **living Word doc** of client "make a video like this" ideas,
  split into **Open ideas** and **Used ideas**. `/produce` reads Open ideas, turns the good ones into
  scripts, then **moves each used idea to Used ideas** so an idea is pulled **only once**; Shot-History
  dedup is the backstop. It's a `.docx` (not `.md`) because it's continually appended and read back —
  keep it as a Word file, never convert it to a Google Doc.
- **The engine learns** — revisions AND the videographer's post-shoot notes distill durable
  facts/preferences into `Client-Memory.md` (you confirm), and red reasons into an avoid-list.

## Filing (matches the drive's READ ME — Structure & Filing Rules)
```
Shoot & Scale Content System/          ← drive root
├── format-bank/    ← global Format Bank (bricks + INDEX.md)
├── roster-ledger.md ← global: every shipped script across ALL clients (cross-client no-repeat memory)
└── clients/<Client Name>/
    ├── Onboarding/ ← client-provided material
    ├── Strategy/   ← Snapshot.md · Bullseye.md (incl. Content Territory) · Content-Analysis.md · Client-Memory.md · Shot-History.md · Idea-Bank.docx (Word doc) · Analysis JSON/ (dated exports)
    └── Content/
        ├── Shoot 1/ ← Raw Videos/ · Edited Videos/ · Scripts/
        ├── Shoot 2/ …
        └── Shoot N/
```
Scripts file to `Content/Shoot N/Scripts/` as `<Client> - Scripts - Shoot N.docx` (one per shoot).
The Format Bank (`format-bank/`) and `roster-ledger.md` are global (drive root). Always ask which
shoot before writing.

## Portability
File I/O in the skills is written as intent over six logical operations (see
`skills/revise/references/drive-adapter.md`), so the same skills run on Cowork's Drive connector +
mount or on the Shoot & Scale app's Google Drive/Docs API. `read_review.py` and `build_script_doc.py`
run on bytes and are identical in both.

## Requires
Sandcastles (for `/analyze`). `python-docx` for the Script Doc generator, the review reader, and the
Idea Bank builder (`skills/onboarding/scripts/build_idea_bank.py`).
