---
name: onboarding
description: Stand up a brand-new client end-to-end — create their folder structure, verify the onboarding materials are filed, then build the Snapshot, the Bullseye, and (from a Sandcastles JSON export) the Content Analysis, plus the empty Client-Memory and Shot-History ledgers. Use for /onboarding, /onboard, "onboard [client]", "new client [name]", "set up [client]", or "create the folders for [client]". Idempotent — on a client that already exists it fills only what's missing and never duplicates. Orchestrates the snapshot, bullseye, and analyze skills; it stops before scripting (that's /produce).
---

# Onboarding

The front door for a new client. One command takes them from **nothing → ready-for-scripts**: build
the folders, confirm their materials are in, then run the three strategy skills in order —
**Snapshot → Bullseye → Content Analysis** — and leave behind the two empty ledgers (`Client-Memory`,
`Shot-History`) and the JSON archive folder. When this finishes, a content operator can run `/produce`.

**This skill orchestrates; it does not re-implement.** It calls `/snapshot`, `/bullseye`, and
`/analyze` for the actual document work — never duplicate their logic here. Its own job is the
scaffolding, the ordering, the approvals gate, and making sure nothing gets created twice.

## The one rule that keeps this safe: create-if-missing, never overwrite
Every folder and file this skill touches is created **only if it isn't already there**. If a client
already has a folder, a doc, or a ledger, **leave it exactly as it is** and move on — this is what
makes onboarding safe to re-run and what stops it clashing with the specialist skills (which each
also create-if-missing). Onboarding never blows away existing work; at most it fills a gap.

## Where onboarding stops
It ends the moment `Content-Analysis.md` exists. **No scripts.** Scripting is `/produce`, a separate
skill run later by the content operator. Do not pitch formats or write scripts here.

---

## Step 0 — Identify the client and check what already exists
Get the client's full name in `First Last` Title Case (drive convention). Then look under
`clients/<Client Name>/` and take stock **before creating anything**:
- Does the client folder exist? Do `Onboarding/`, `Strategy/`, `Content/` exist?
- Which of the five docs already exist: `Snapshot.md`, `Bullseye.md`, `Content-Analysis.md`,
  `Client-Memory.md`, `Shot-History.md`?

Tell the operator plainly what's already there and what's missing, then proceed to fill only the
gaps. **A fully-onboarded client is a no-op** — say "they're already set up" and stop. A
half-onboarded client (e.g. folders + Snapshot but no Bullseye) resumes from the first missing piece.

## Step 1 — Scaffold the folder structure (create-if-missing)
Ensure this structure exists under `clients/<Client Name>/`, creating only the parts that are absent:
```
clients/<Client Name>/
├── Onboarding/                     ← everything the client gave us
├── Strategy/                       ← the living docs + the JSON archive
│   └── Analysis JSON/              ← every dated Sandcastles export lands here
└── Content/                        ← the shoots live here
    ├── Shoot 1/                    ← Raw Videos/ · Edited Videos/ · Scripts/
    │   ├── Raw Videos/
    │   ├── Edited Videos/
    │   └── Scripts/
    ├── Shoot 2/                    ← same three subfolders
    │   ├── Raw Videos/
    │   ├── Edited Videos/
    │   └── Scripts/
    └── Shoot 3/                    ← same three subfolders
        ├── Raw Videos/
        ├── Edited Videos/
        └── Scripts/
```
**Pre-create three shoot folders by default** — `Shoot 1`, `Shoot 2`, `Shoot 3`, each with its three
subfolders **exactly**: `Raw Videos/`, `Edited Videos/`, `Scripts/` (Title Case, plain `Shoot N` — no
`#`). Three is just the starting default; a client can always get more later — `/produce` creates any
higher-numbered shoot folder (Shoot 4, 5, …) create-if-missing when it scripts that shoot, and it
reuses these existing ones as-is. Because every folder here is create-if-missing, re-running onboarding
never duplicates or wipes a shoot that already has work in it. (Folder creation is intent: "ensure this
folder exists," portable across the Cowork mount and the app's Drive API — don't hardcode a device
path.)

## Step 2 — Confirm the onboarding materials are filed
The Snapshot is only as good as what it reads, so before building it, make sure everything the client
gave us is sitting in `Onboarding/`: the onboarding call (recording/transcript), intake form /
questionnaire, brand guidelines, ICP or business docs, lead magnets, emails — whatever exists.
- If materials are missing, **ask the operator to drop them into the Onboarding folder** (or paste
  them) and wait.
- If there was **no formal onboarding** (it happens), say so and proceed with whatever exists — the
  Snapshot will lean harder on the website and the client's own content, flagged as inferred. Don't
  block forever; proceed on the operator's go.
- The client's **website** counts as a material even if it's not a file — `/snapshot` will find and
  read it (from the docs, or by searching for it) in the next step.

## Step 3 — Lay down the empty ledgers + the idea bank (create-if-missing)
So they exist from day one instead of appearing later:
- **`Strategy/Client-Memory.md`** — stub with three empty dated headers: `## Learned no-gos`,
  `## Voice & style preferences`, `## Topic likes / dislikes`. (Inviolable once populated; `/revise`
  and `/produce`'s post-shoot reconciliation fill it from client/videographer feedback.) *Note:*
  `/snapshot` also seeds this — because both create-if-missing, whichever runs first wins and the
  other is a harmless no-op.
- **`Strategy/Shot-History.md`** — stub with the header and the one-line-per-video convention
  (`Shoot N | topic | angle | format | text hook`) and an empty body. It logs only **videos that were
  actually shot** — `/produce` appends them when it reconciles the previous shoot (green = shot). This
  is the ledger that stops the client ever repeating a topic/angle.
- **`Strategy/Idea-Bank.docx`** — a **Word document, never a `.md`.** This is the one strategy file
  that must be a real `.docx`, because it's a *living* doc: the team continually appends new ideas to it
  and `/produce` reads it back when scripting. **Always create it as a `.docx`** — build it with the
  helper so every run produces the same shape:
  `python3 scripts/build_idea_bank.py "<Client Name>" "clients/<Client Name>/Strategy/Idea-Bank.docx"`
  (needs `python-docx`; `pip install python-docx --break-system-packages` if missing). The doc it writes
  has two sections — **"Open ideas (not yet used)"** and **"Used ideas (already made into scripts — do
  not reuse)"** — plus the one rule: **each idea is used only once.** When a client sends a "make a video
  like this" (a URL + a note), the PM pastes it under Open ideas, raw. `/produce` reads the open ideas
  each batch, turns the good ones into scripts (tagging provenance in the roster ledger), then **moves
  that idea to Used ideas** so it's never pulled twice; the Shot-History dedup is the backstop.
  **Create-if-missing:** if `Idea-Bank.docx` already exists, leave it untouched. (If an older client
  still has a legacy `Idea-Bank.md`, the real bank is now the `.docx` — the `.md` is retired.)

Do **not** create `roster-ledger.md` here — that's the global, roster-wide ledger at the drive root,
owned by `/produce` and `/revise` (the client simply starts appearing in it when their first batch
ships). Onboarding never touches it.

## Step 4 — Build the Snapshot (run `/snapshot`, ONE approval)
Hand off to `/snapshot` for the identity doc — it reads the `Onboarding/` materials **and the client's
website**, pulls how they actually talk, and writes `Strategy/Snapshot.md`. Present it and get the
operator's **approval / corrections** before moving on. If a Snapshot already exists, run
`/snapshot`'s confirm-current beat instead of rebuilding.

## Step 5 — Build the Bullseye (run `/bullseye`, ONE approval)
Hand off to `/bullseye` — it auto-derives the ring ladder, the content-mix ratio, and the Content
Territory from the approved Snapshot, and writes `Strategy/Bullseye.md`. Present it and get the
operator's **approval / corrections** (the single gate). If a Bullseye already exists, review and
only change what the Snapshot now implies.

## Step 6 — Build the Content Analysis (run `/analyze`) — then onboarding ends
This is the last step. `/analyze` needs a **Sandcastles JSON export** of the client's own videos:
1. Ask the operator to export it (per `/analyze`'s standing export workflow) and hand it over.
2. **Archive the JSON** into `clients/<Client Name>/Strategy/Analysis JSON/` with a dated name
   (e.g. `Content Analysis 2026-07-22.json`) — this is the permanent home for every export, at
   onboarding and at every future shoot.
3. `/analyze` reads that JSON and writes `Strategy/Content-Analysis.md`.
- **Brand-new client with nothing posted yet?** There's nothing to analyze — say so and let `/analyze`
  write a thin v1 that leans on the Snapshot + Bullseye until real data exists. Onboarding still
  completes; the analysis fills in on the first real export.

When `Content-Analysis.md` exists, **onboarding is done.** Do not continue into scripting.

## Step 7 — Report the end state
Confirm plainly what the client now has, so a returning operator sees it at a glance:
> "[Client] is onboarded. Folders are set — including Shoot 1, 2, and 3, each with Raw Videos, Edited
> Videos, and Scripts; Snapshot, Bullseye, and Content Analysis are built and approved; Client-Memory,
> Shot-History, and the Idea Bank are seeded and empty; their onboarding docs are filed and the JSON
> export is archived. Ready for `/produce` whenever you want to script a shoot."
Note anything still worth confirming (open ⚠️ flags the Snapshot surfaced). Log completion in each
doc's own changelog (the specialist skills do this) — don't keep a separate onboarding log.

## What this skill does NOT do
- It does **not** write scripts or pitch formats — that's `/produce`.
- It does **not** invent identity, strategy, or analysis — it delegates those to `/snapshot`,
  `/bullseye`, `/analyze`, which own that judgment.
- It does **not** create or edit the roster-wide ledger or the Format Bank (both global).

Keep talk plain — don't expose file paths unless asked.
