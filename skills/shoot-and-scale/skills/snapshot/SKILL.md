---
name: snapshot
description: Create or update a client's identity Snapshot — who they are, their voice, branding, and what they want from their content — from onboarding materials AND their website. Use for /snapshot, "snapshot [client]", "refresh [client]'s snapshot", or an onboarding transcript, intake form, or notes. (Full new-client setup — folders + all the docs — is /onboarding, which calls this.) Builds ONLY the identity doc; it does not analyze videos (/analyze) or plan content (/produce).
---

# Snapshot

Builds ONE document: the client's **Snapshot** — their identity. Voice, personality, niche,
branding, background, and what they want out of their content. This is one of the three living
client docs (`Snapshot`, `Bullseye`, `Content-Analysis`) that every other skill reads. It is
**fact, not strategy** — no format buckets, no lineup, no rank tables live here.

Run this on every new client — usually via `/onboarding`, which calls it as its identity step — or
standalone to refresh a client's identity.

## Where it lives
`clients/<Client Name>/Strategy/Snapshot.md` (proper-case folder, e.g.
`clients/Esteban Andrade/Strategy/Snapshot.md`). Older clients may have it at the client-folder root —
read it there if that's where it is, but write new/updated Snapshots into `Strategy/`. Keep exactly
one; overwrite in place on a real identity change (not every month).

## What feeds it
Anything from onboarding — the more the better: the **onboarding call transcript**, intake forms,
questionnaires, emails, notes, the client's own words anywhere — **plus the client's website**, which
is almost always the richest single source of who they are, what they offer, and how they talk. If you
can't find any onboarding material, ask the user to point you to it or paste it, and still pull the
website. **Don't invent an identity from nothing** — but a website alone is a legitimate starting point
when there was no formal onboarding (flag what's inferred).

Treat unconfirmed call notes as *ideas the client was open to*, not confirmed wants. Flag
provenance: ✅ = grounded fact, ⚠️ = inferred / open to confirm.

## Steps
1. **Gather the materials — including the website.** Look in `clients/<Client Name>/Onboarding/` (and
   the client root) for onboarding docs; read them. Pull in anything pasted or emailed. Then **find and
   read the client's website:**
   - Look for the URL in the onboarding docs / intake form first.
   - If it isn't there, **search the web** for the client + business name and identify their official
     site, then **fetch and read it** (about page, services/offer, bio, taglines, tone).
   - Mine it for Basic Info, the offer, positioning, audience, and voice cues. Treat clear on-site
     facts as ✅; treat your reading of their tone/personality as ⚠️ unless the onboarding confirms it.
   - If you genuinely can't find a site, say so and proceed on the other materials.
2. **Confirm-current beat (re-run).** If a Snapshot already exists, review it with the user and
   resolve its open ⚠️ flags BEFORE anything builds on it. Don't trust it just because the file is
   there. Ask: "Did anything change in their onboarding — any new files to fold in?"
3. **Pull how they ACTUALLY talk.** Collect verbatim quotes — real phrases, filler words, the way
   they explain things. This block keeps every future script sounding like them.
4. **Write the Snapshot** to `clients/<Client Name>/Strategy/Snapshot.md`. Sections:
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
5. **Seed the memory file.** If `clients/<Client Name>/Strategy/Client-Memory.md` doesn't exist yet,
   create a stub with three empty, dated headers: `## Learned no-gos`, `## Voice & style
   preferences`, `## Topic likes / dislikes`. (`/onboarding` also seeds this — both are
   create-if-missing, so whichever runs first wins and the other is a no-op.) `/revise` and `/produce`'s
   post-shoot reconciliation fill it from client/videographer feedback over time and `/produce` reads it
   as inviolable. Don't put identity facts here — those live in the Snapshot.
6. **Report** plainly: snapshot's done, and the one or two things still worth confirming.

## What this skill does NOT do
- It does **not** analyze content or look at outlier scores — that's `/analyze`.
- It does **not** decide what to make — that's `/produce`. Identity only.

## The Snapshot wins every tie
If any later skill's output conflicts with the client's stated voice, ICP, or no-gos, the Snapshot
governs. Keep talk plain — don't expose file paths unless asked.
