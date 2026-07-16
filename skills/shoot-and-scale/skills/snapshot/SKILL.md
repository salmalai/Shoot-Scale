---
name: snapshot
description: Create or update a client's identity Snapshot — who they are, their voice, their branding, and what they want out of their content — from their onboarding materials. Use when the user says "/snapshot", "snapshot [client]", "onboard [client]", "new client [name]", or hands over an onboarding call transcript, email, intake form, or notes. This skill ONLY builds the identity doc. It does not analyze their videos (that's /analyze) or plan content (that's /produce).
---

# Snapshot

Builds ONE document: the client's **Snapshot** — their identity. Voice, personality, niche,
branding, background, and what they want out of their content. This is one of the three living
client docs (`Snapshot`, `Bullseye`, `Content-Analysis`) that every other skill reads. It is
**fact, not strategy** — no format buckets, no lineup, no rank tables live here.

Run this on every new client. It's the first thing that happens when a client comes on.

## Where it lives
`clients/<Client Name>/Snapshot.md` (proper-case folder, e.g. `clients/Esteban Andrade/Snapshot.md`).
Keep exactly one; overwrite in place on a real identity change (not every month).

## What feeds it
Anything from onboarding — the more the better: the **onboarding call transcript**, intake forms,
questionnaires, emails, notes, the client's own words anywhere. If you can't find any, ask the user
to point you to it or paste it. **Don't invent an identity from nothing.**

Treat unconfirmed call notes as *ideas the client was open to*, not confirmed wants. Flag
provenance: ✅ = grounded fact, ⚠️ = inferred / open to confirm.

## Steps
1. **Gather the materials.** Look in `clients/<Client Name>/` for onboarding docs; read them. Pull
   in anything pasted or emailed.
2. **Confirm-current beat (re-run).** If a Snapshot already exists, review it with the user and
   resolve its open ⚠️ flags BEFORE anything builds on it. Don't trust it just because the file is
   there. Ask: "Did anything change in their onboarding — any new files to fold in?"
3. **Pull how they ACTUALLY talk.** Collect verbatim quotes — real phrases, filler words, the way
   they explain things. This block keeps every future script sounding like them.
4. **Write the Snapshot** to `clients/<Client Name>/Snapshot.md`. Sections:
   - **Basic Info** — name, handle, niche, what the business does, branding (colors/tone).
   - **Sandcastles (analytics)** — pin the client's **workspace name** and each **channel UUID**
     (primary + any mirror), noting which platform is primary. Resolve UUIDs once via the channel
     handle (a `@handle` is often ambiguous across IG/YouTube Shorts, so store the UUID, not the
     handle). This is what lets `/analyze` switch into the right workspace and read the right channel
     every run without guessing.
   - **Avatar Voice** — personality + a "how they ACTUALLY talk" block of verbatim quotes.
   - **Niche & Positioning** — the lane and their angle in it; the subtopics they'll cover.
   - **Goals** — what they want out of their content (leads, authority, audience, sales). Concrete.
   - **Audience Psychology** — who they're talking to and what that person cares about (pains,
     desires, objections).
   - **Hard no-gos** — topics, claims, or styles the client won't do. These are inviolable.
   - **Story Bank** — usable personal stories / proof points.
   - **Still to confirm** — identity gaps to nail down later (⚠️).
5. **Report** plainly: snapshot's done, and the one or two things still worth confirming.

## What this skill does NOT do
- It does **not** analyze content or look at outlier scores — that's `/analyze`.
- It does **not** decide what to make — that's `/produce`. Identity only.

## The Snapshot wins every tie
If any later skill's output conflicts with the client's stated voice, ICP, or no-gos, the Snapshot
governs. Keep talk plain — don't expose file paths unless asked.
