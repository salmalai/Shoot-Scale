# Shoot & Scale — Content System (v4)

The linear rebuild. Twelve skills collapsed to six. One client, three living docs, one path.

## The path
```
/run  →  snapshot → bullseye → analyze → (create-format) → produce
```

## The six skills
- **/run** — the guided conductor. Walks the checklist, calls the right skill, stops only at the gates.
- **/snapshot** — the client's identity doc (voice, branding, no-gos).
- **/bullseye** — niche, the ring ladder, and the content-mix ratio. Also the topic source.
- **/analyze** — deep-reads the client's OWN top ~50–60 videos into a living **Content Analysis** doc
  (what's working vs. flopping, by format and topic) and surfaces repeatable format candidates for
  approval.
- **/create-format** — turn a winning structure (or an original idea) into a reusable Format Bank
  brick. Standalone: bank formats anytime, with or without a client. *(Unchanged from prior versions.)*
- **/produce** — pitch the format split → user approves formats → write hook-graded scripts → build
  the branded Script Doc → learn from the edits.

## The rules baked in
- **Topics never gate.** Pulled from the Bullseye's inner rings + the client's proven winners.
- **Formats are bank-only.** Never invented, always user-approved.
- **Competitor analysis is out** of the workflow (manual only).
- **Double down on what works, drop what flops, and deliberately test fresh formats.**
- **The engine learns** — after production it proposes brick/doc/plugin improvements, asking first.

## Files per client (`clients/<Client Name>/`)
`Snapshot.md` · `Bullseye.md` · `Content-Analysis.md` · `scripts/`

The Format Bank (`format-bank/`) is global and shared across all clients.

## Requires
Sandcastles (for `/analyze`). `python-docx` for the Script Doc generator in `/produce`.
