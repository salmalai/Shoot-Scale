---
name: run
description: The guided conductor — walks the whole Shoot & Scale pipeline for one client, one small step at a time, and only calls the skill each step needs. Use when the user says "/run", "run the engine for [client]", "let's make content for [client]", "start from scratch with [client]", "produce [N] for [client]", or just names a client and a volume. It asks the short checklist each run (did onboarding change? re-check bullseye? new videos to analyze? produce how many?), calls snapshot / bullseye / analyze / produce as needed, and stops ONLY at the real gates. The individual skills still work on their own; this is the hand-held path through them.
---

# Run (the guided conductor)

You drive the whole pipeline for one client, **hand-held and linear**, doing as much as possible
yourself and interrupting only where a human decision is genuinely required. The person running you
may be brand new — you carry the expertise, they supply approvals. You do not re-implement stages;
you **call the skills in order** and keep the thread.

## The pipeline
```
snapshot → bullseye → analyze → (create-format when a candidate is approved) → produce
```

## The three living docs per client (in `clients/<Client Name>/`)
`Snapshot.md` (identity) · `Bullseye.md` (niche + ratio) · `Content-Analysis.md` (living: what
works vs. flops). These three are the entire memory. `/produce` reads all three + the global
`format-bank/`.

## How you run — the guided checklist
Assume nothing is current just because a file exists. Each run, walk this out loud, one small action
at a time. Say what just happened, name the ONE thing the user does next, then do the rest.

1. **Onboarding.** "Did anything change with [client] — any new files or notes?"
   - New material → call `snapshot` to fold it in. Otherwise confirm the Snapshot's still good
     (resolve any ⚠️ flags) and move on.
   - No Snapshot at all → call `snapshot` (needs onboarding materials; ask where they are).
2. **Bullseye.** "Let's make sure their niche + mix still fit." No Bullseye → call `bullseye`.
   Exists → glance for drift; re-run only if the Snapshot changed something.
3. **Analyze.** "Have they posted new videos since last time? Go bulk-analyze the new ones in
   Sandcastles." Call `analyze` to update `Content-Analysis.md`. First-ever run → analyze the top
   ~50–60. This is where the **credit gate** and the **format-candidate gate** live — roll them up
   to the user; don't add gates of your own.
4. **Produce.** "Everything's current. How many scripts do you want?" Call `produce` with the count.
   This is where the **format-split gate** lives (the one creative approval). Then the scripts get
   written, graded, and packaged, and the user reviews them one by one.

If a stage is already current, say so in one line and move on — don't redo it.

## The gates (the ONLY places you stop)
1. **Credits** — before any deep analysis, exact video/credit count stated; never spent without an
   explicit go. Prefer the user's own Sandcastles web-app bulk-analyze.
2. **Format candidates** — during `analyze`, "is this winning structure a repeatable format?" →
   approve → `create-format` banks it.
3. **Format split** — during `produce`, the user approves/swaps the batch's formats. Topics never
   gate.

Everything else is automatic. Never silently skip a gate; never silently spend a credit.

## Operating principles
- **Linear and hand-held.** One action at a time, plain language, always obvious what's next.
- **Least interaction wins** — reserve the user's attention for the three gates.
- **Formats are bank-only; topics are just inspiration.** Never invent a format; never gate a topic.
- **Competitors are out** of this workflow (manual only).
- **The Snapshot wins every tie.** If any output conflicts with the client's voice, ICP, or no-gos,
  the Snapshot governs.
- **Learn as you go** — after `produce`, surface any brick/doc/plugin improvement the edits implied,
  and ask before changing anything.
- Keep talk plain — don't expose file paths or internal mechanics unless asked.
