# Shoot & Scale Content System — Standard Operating Procedure

*A step-by-step guide to running the whole content system, written for someone brand new to content strategy. Read it top to bottom once, then keep it open as a reference while you work.*

**Version 1.0 — July 2026 · Pairs with plugin v1.1.0**

> **v2.0.0 update (2026-07-09):** the system now has a **conductor** — the `content-engine` skill —
> that runs this whole workflow for a named client with minimal input. You can still run every skill
> by hand exactly as described below; the conductor just chains them for you. See **Section 12** for
> the v2 additions (the conductor, `audience-bullseye`, `content-pitch`, `channel-diagnostic`,
> `creator-breakdown`, `outlier-pulse`) and what changed in the existing skills.

---

## 1. What this system is (in plain English)

We run Instagram content for clients. The job is to make short videos (Reels) that (a) get seen by the right people and (b) turn those people into leads for the client's business.

The hard part isn't filming — it's knowing *what to make*. If you guess, you waste shoots on videos nobody watches. This system removes the guessing. It uses real performance data to answer three questions for every client:

1. **What already works for this client?** (their own best videos)
2. **What's working for everyone else in their world?** (their competitors)
3. **So what should we make next?** (the plan)

Everything below is just a reliable, repeatable way to answer those three questions and turn the answers into finished scripts.

You do **not** need to be a content expert to run this. The system does the analysis. Your job is to run the steps in order, make a few approval decisions along the way, and use your judgment where the guide tells you to.

---

## 2. Words you'll see a lot (quick glossary)

Read this once. You don't have to memorize it — just come back when a term trips you up.

- **Short-form content / Reel** — a short vertical video (usually 15–90 seconds) on Instagram, TikTok, or YouTube Shorts.
- **Niche** — the specific world a client lives in. Not "business" but "real estate lead generation." The tighter the niche, the better.
- **ICP (Ideal Client Profile)** — the exact person the client wants to reach and *sell to*. Getting a million views is useless if none of them are buyers. Good content attracts the **right** people, not just the **most** people.
- **Hook** — the first line/few seconds of a video. It decides whether someone keeps watching or scrolls away.
- **Format** — the reusable *structure* of a video, separate from its topic. Example: "the [X] theory" is a format; "the burning house theory" is that format filled with a topic. A good format works across many topics.
- **Outlier score** — the single most important number in this system. It tells you how much a video **over- or under-performed compared to that channel's own normal**. A 5x outlier got five times the channel's typical views. This is better than raw view counts because it's fair across channel sizes: a small creator's 50k-view video can be a huge outlier, while a big creator's 50k video might be *below* their normal. **High outlier = something about that video worked. That's what we want to copy.**
- **Remix** — taking a proven structure (a format or a whole video idea) that worked somewhere else and rebuilding it around the client's own topic and niche. This is the core creative move of the whole system.
- **Watchlist** — the list of channels we're tracking for a client inside Sandcastles. It holds the client's own channel *plus* their competitors.
- **Sandcastles** — the data tool we use. It tracks channels, pulls video stats, calculates outlier scores, and can break down a video's hook and format. Think of it as the research department.
- **Credits** — Sandcastles charges credits (which cost the agency money) for **deep analysis of a single video**. Most things — searching, discovering channels, recaps, pulling videos by outlier score — are **free**. More on this in Section 8.

---

## 3. The client's documents (what we build and where things live)

Every client gets a small set of living documents, stored in the shared Drive under `clients/`. Keeping them separate is intentional — each one has a different job and gets updated at a different time.

- **`<client>-client-snapshot.md` — the IDENTITY doc.** Who the client is: their voice, personality, niche, background, goals, audience, and hard "never do this" rules. This changes rarely. It's the source of truth every other step reads from.
- **`<client>-competitors.md` — the ROSTER doc.** The vetted list of competitors we're watching, with links, plus a read on what's winning in the niche. Built by the **add-competitors** skill.
- **`<client>-strategy.md` — the PLAYBOOK doc.** The current plan: what formats and topics to make next, and why. Rewritten by the **create-strategy** skill each cycle. Treat it as a *living hypothesis*, not gospel — it gets sharper every month as real data comes in.
- **`<client>-format-results.md` — the LEDGER doc.** A running history of every format we've tried and how it scored. It's the system's memory so we never re-test something that already flopped. Maintained automatically — you rarely open it by hand.

You mostly *read* the snapshot and *act on* the strategy. The other two run quietly in the background.

---

## 4. The workflow at a glance

Run the skills in this order. Each one feeds the next.

```
NEW CLIENT
   │
   ▼
1. create-client-snapshot   → builds the IDENTITY doc
   │
   ▼
2. add-competitors          → builds the ROSTER, fills the watchlist
   │
   ▼
3. create-strategy          → reads own channel + competitors → writes the PLAYBOOK
   │
   ▼
4. create-format (ongoing)  → banks reusable format "bricks" as you spot winners
   │
   ▼
5. write-script             → client + format + topic → finished script
   │
   ▼
6. script-doc-builder       → puts approved scripts into the branded client doc
   │
   ▼
SEND TO CLIENT
```

**Every month after that:** re-run **add-competitors** (to widen the niche view) and **create-strategy** (to refresh the plan with the newest data). The rest happens as needed.

**How you run a skill:** type its slash command in Cowork, e.g. `/create-strategy [client name]`. The skill then walks you through the rest and asks for your input where it needs a decision.

---

## 5. Step-by-step: each skill

Each skill below follows the same layout: **when to run it → what it does → how to run it → what you'll decide → what you get.**

### 5.1 — create-client-snapshot (build the identity doc)

**When to run:** once, right when a client comes on board.

**What it does:** reads the client's onboarding materials (call transcript, emails, intake notes — whatever exists) and writes the IDENTITY doc: who they are, how they talk, their niche, their goals, their audience, and their hard no-gos.

**How to run:** `/create-client-snapshot [client name]`, then give it the onboarding materials when asked.

**What you'll decide:** nothing heavy — mostly confirm it captured the client correctly. Anything it wasn't sure about is flagged so you can fill it in later.

**What you get:** the `client-snapshot.md`. This is the foundation — every later step reads it, so it's worth getting right. If you learn something new about the client later (e.g. a background detail changes), update this doc.

> **Why it matters:** every other skill leans on the snapshot to sound like the client and target the right audience. Garbage in, garbage out — so make the snapshot honest and specific.

### 5.2 — add-competitors (find who to watch, and learn what's winning)

**When to run:** once, right after the snapshot and *before* the first strategy. Re-run any month you want to widen the niche view.

**What it does — in five moves:**

1. **Reads the snapshot** to learn the client's niche, offer, ICP, and no-gos.
2. **Searches Sandcastles for channels** in that niche (a broad, global search), and also lines up any competitors the client named themselves.
3. **Filters hard for the client's ICP.** This is the important part. A raw search returns lots of near-misses — creators who *look* related but attract the wrong crowd (for example, "get rich with no money" channels that pull broke beginners instead of funded buyers). The skill culls those and tells you *why* it cut each one.
4. **Waits for your approval.** It shows you a shortlist — strong fits, the client's named accounts, and the culled list with reasons. **Nothing gets added until you say so.** For every recommended channel it gives you a profile link and a sample video link so you can look before you approve.
5. **Adds the ones you pick** to the watchlist and does a **free** scan of what's winning in the niche.

**How to run:** `/add-competitors [client name]`.

**What you'll decide:** which channels actually make the cut. Trust the ICP filter, but use your own eyes too — click the links. If a channel feels off for the client, leave it out.

**What you get:** the `competitors.md` ROSTER — the vetted channels (with links) plus a read on the formats, hooks, and topics winning in the niche.

> **Rule of thumb for approving:** ask "does this creator talk to the *same person our client sells to*?" If yes, keep. If they talk to beginners/dreamers when our client sells to established operators, cut — even if the topic looks similar.

### 5.3 — create-strategy (decide what to make next)

**When to run:** at onboarding (right after add-competitors) *and* every month.

**What it does — two passes:**

- **Inward pass (the client's own channel).** Pulls the client's top ~35 videos by outlier score and finds the patterns: which formats are their *ceiling* (biggest hits — do more), which only work with a special angle, and which flop (avoid). Reading the winners in detail can cost credits — the skill will always tell you the count and ask before spending (see Section 8).
- **Outward pass (the niche).** Pulls the **top ~30–50 videos in the niche by outlier** from the watchlist you built with add-competitors. This is **free** — no analysis needed. You get a browsable list: each video's title, outlier score, views, and a link. The skill also suggests a handful of **remix candidates** (videos worth copying the structure of, with a one-line angle for your client), and you're free to scan the list and point out the ones *you* like. Both feed the plan.

**How to run:** `/create-strategy [client name]`.

**What you'll decide:** on a re-run, it first shows you *what's new* and what it would change, then waits for your OK before rewriting the plan. You can also pick which niche videos to build from.

**What you get:** the updated `strategy.md` PLAYBOOK — the buckets of what to make and skip, the niche videos worth remixing, and the topic ideas. The `format-results.md` ledger updates quietly in the background.

> **If a client's own channel has no data yet** (brand new, or not indexed in Sandcastles), the strategy leans on the outward pass + the snapshot to write a "best-guess" v1. That's normal — it gets data-backed on the next run once their videos post and index.

### 5.4 — create-format (bank a reusable format when you spot a winner)

**When to run:** anytime you see a video format worth reusing — an ongoing habit, not a scheduled step.

**What it does:** turns one winning video (paste its URL) or one described idea into a reusable **"format brick"** — a template you can apply to any client. It optimizes the format, shows you how it'd look across a few different niches, refines it with you, and files it in the **Format Bank** once you approve, tagged *Proven* or *Testing*.

**How to run:** `/create-format`, then paste a video URL or say you have a custom idea.

**What you get:** a new format brick in the `format-bank/` folder, ready for write-script to use.

> **Habit to build:** when you scroll and something makes you stop, or you see a high-outlier video in a strategy run, bank it. Over time the Format Bank becomes your reusable toolkit.

### 5.5 — write-script (turn a client + a format into a real script)

**When to run:** when you're ready to produce the actual videos for a batch.

**What it does:** combines a saved **client** (their snapshot/voice) with a saved **format** (from the bank) and a **topic**, and writes a finished script in the client's voice. The topic comes from you or from the strategy's plan — this skill doesn't invent topics from data, it writes.

**How to run:** `/write-script [client name] [format]`, then give it the topic (or let it brainstorm options).

**You don't always need the full command.** Writing scripts depends on *context* — what's already been said in the conversation. If you're already working on a client (their snapshot is loaded, you've just talked through their strategy, or you've been getting format recommendations), you don't have to spell out the rigid `/write-script [client] [format]` form or feed it each topic one by one. You can just say **"write the scripts"** and it will pull the client, the recommended formats, and the topics from the context you've already built and write the whole batch. Only fall back to the explicit command when you're starting cold with no client/format context on the table.

**What you get:** a finished script (or a batch of them) in the client's voice, ready for review.

### 5.6 — script-doc-builder (package scripts for the client)

**When to run:** once your scripts are approved and ready to send.

**What it does:** drops the approved scripts into the **branded client Script Doc** (a Word file) — logo, legend, one video per page, with the client's lines in black and the interviewer's lines in red.

**How to run:** `/script-doc`.

**What you get:** the polished `.docx` you send to the client. This is the finish line.

---

## 6. The monthly routine (once a client is set up)

The first four steps (snapshot → competitors → strategy → first scripts) are the setup. After that, the recurring loop is short:

1. **Re-run `/add-competitors [client]`** — widen the niche view; add any new strong competitors that have popped up.
2. **Re-run `/create-strategy [client]`** — it re-checks the client's newest videos and the newest niche outliers, shows you what changed, and updates the plan after your OK.
3. **Bank formats** with `/create-format` as you spot winners.
4. **`/write-script`** the new batch from the refreshed plan.
5. **`/script-doc`** and send.

Doing this every month is what keeps the content getting *better* instead of just *more*.

---

## 7. Making approval decisions (your judgment calls)

The system does the heavy lifting, but it deliberately stops and asks you at a few points. Here's how to handle each:

- **Approving competitors (add-competitors).** Keep channels that talk to the *same buyer* as your client. Cut look-alikes that target the wrong audience, even if the topic matches. Click the links before deciding.
- **Approving a strategy update (create-strategy re-run).** Read the "what's new" summary. If the recommended changes make sense, approve. If something feels off for the client, say so — the plan is a hypothesis, not a command.
- **Picking remix videos.** Favor high-outlier videos whose *structure* you can rebuild for the client's topic without breaking their no-gos. You don't copy the topic — you copy the *shape*.

When in doubt, the snapshot is the tie-breaker. If a choice conflicts with the client's stated voice, ICP, or no-gos, don't do it.

---

## 8. Credits and money safety (read this)

Sandcastles charges **credits** — which cost the agency real money — but **only for one thing: deeply analyzing an individual video** (breaking down its exact hook and format). Almost everything else is free.

**Free (do these freely):**

- Searching and discovering channels
- Adding channels to a watchlist
- Channel recaps
- Pulling a channel's or niche's top videos by outlier score, views, or engagement

**Costs credits (always confirm first):**

- Deep analysis of a specific un-analyzed video (about one credit each)

The skills are built to protect the agency's credits: **any time a step is about to spend credits, it tells you how many and waits for your go-ahead.** Never approve a spend you don't understand — ask, or skip it. A video that's already been analyzed is free to re-read, so we never pay twice.

---

## 9. Troubleshooting (common snags)

- **"The client's channel has no data / no videos in Sandcastles."** It's probably still indexing (can take a few minutes for a new channel) or hasn't been added yet. Add the channel, wait, and continue. Write a best-guess v1 strategy from the snapshot + niche in the meantime; it gets data-backed next run.
- **"It says the handle is ambiguous."** The same handle exists on more than one platform (e.g. an Instagram *and* a YouTube channel). The skill will show you the options — pick the right one.
- **"Discovery returned a bunch of channels that feel wrong."** That's expected — the raw search is broad. The ICP filter exists exactly for this. Cut the wrong-audience ones; keep the ones who speak to the client's buyer.
- **"There are no competitors to pull from in the strategy's outward pass."** Run `/add-competitors` first — that's what fills the watchlist the outward pass reads from.
- **"A new `/command` isn't showing up."** The plugin was updated but not re-installed. Re-import the latest `.plugin` from the Drive `plugin/` folder via **Settings → Customization → Plugins → Add → Upload Plugin** (see Section 10).

---

## 10. Installing and updating the plugin

The skills live in the **Shoot & Scale Content System plugin**. To get the newest version (or install it the first time):

1. Open the shared Drive `plugin/` folder and grab the latest `.plugin` file (there's always exactly one; the `PLUGIN-VERSION.md` file tells you the current version).
2. In Claude, go to **Settings → Customization → Plugins**.
3. Click **Add**, then **Upload Plugin**, and select the `.plugin` file from Step 1.
4. Confirm to install — or re-install — it. Re-installing replaces your old version.

Plugins don't auto-update from the Drive, so whenever the team ships a new version, everyone re-installs once. You'll also need the **Sandcastles** connector and the shared **Google Drive** connected as a working folder.

---

## 11. One-page cheat sheet

| Step | Command | When | Produces |
| :--- | :--- | :--- | :--- |
| 1. Snapshot | `/create-client-snapshot [client]` | New client | Identity doc |
| 2. Competitors | `/add-competitors [client]` | After snapshot; monthly | Roster + watchlist |
| 3. Strategy | `/create-strategy [client]` | After competitors; monthly | The plan |
| 4. Format | `/create-format` | Whenever you spot a winner | Format brick |
| 5. Script | `/write-script [client] [format]` | Producing a batch | Finished scripts |
| 6. Client doc | `/script-doc` | Scripts approved | Branded .docx |

**The golden rules:**

1. Run the skills in order — each feeds the next.
2. Outlier score, not raw views, tells you what worked.
3. Attract the *right* audience (ICP), not the biggest one.
4. Copy the *structure* of winners, not the topic — that's a remix.
5. The snapshot is the source of truth; it wins every tie.
6. Free by default — confirm before any credit spend.
7. Re-run competitors + strategy every month to keep getting better.

---

## 12. v2.0.0 — The Content Engine (the conductor + new skills)

v2 doesn't replace anything above — it adds a layer on top. You can still run each skill by hand.
The difference is you now have one command that runs the *whole* thing for a client.

### 12.1 — The one command: `/content-engine`

> `/content-engine Esteban 20` — or just "make 20 videos for Esteban."

It reads where the client already is (do they have a snapshot? a bullseye? competitors? a current
strategy? a pitch for this batch?), runs only the stages that are missing, and takes you all the way
to finished scripts in the branded doc. It stops at **only three gates**:

1. **The manual Sandcastles bulk-analyze.** Deep analysis is faster in the Sandcastles web app than
   through Claude, so when it needs videos analyzed it tells you exactly what to do — "filter
   @esteban to the last 60 days, sort by outlier, bulk-analyze the top 15" — and waits. Then it
   reads the results for free and keeps going. This is the one manual chore, by design.
2. **Credit approval** — same as always; it never spends without your go-ahead.
3. **The content-plan approval** — it pitches the batch (each concept with *why it earns the slot*
   and *what would kill it*), you approve/kill, then it writes. This is the one creative checkpoint.

Everything else is automatic. You don't feed it topics one at a time or babysit each script.

### 12.2 — The new skills

- **`/audience-bullseye [client]`** — auto-derives the client's 5-ring Audience Bullseye (exact ICP
  in the center, broader rings out) and the **content-mix ratio** (default 3/2/2 per 7 videos:
  mostly core-audience, some adjacent, some reach — never the broadest ring). This is the "good ratio
  split" for a batch. Writes `<client>-bullseye.md`. One approval.
- **`/content-pitch [client]`** — the vision on one page: the actual slate to shoot, each concept
  mapped to a bullseye ring and a format, **pitched with why it should work and the risk that would
  kill it**. You approve/kill; survivors go to scripts. Writes `<client>-content-pitch.md`.
- **`/channel-diagnostic [channel]`** — a deep per-channel teardown (the client's own page or a
  competitor's): top topics, top hooks (with reusable templates), hidden insights, top formats — as
  an interactive HTML report. Use it to reverse-engineer what's working.
- **`/creator-breakdown [creator]`** — the deep "how did they blow up and how do they monetize"
  teardown of a single creator. Great for studying a rising competitor before you remix them.
- **`/outlier-pulse [client]`** — the daily niche radar: the overperforming videos across the
  client's watchlist, dropped into their folder each morning. Free, no credits. Keeps the strategy
  from going stale between monthly runs.

### 12.3 — What changed in the skills you already use

- **Analyze in Sandcastles first.** The analysis skills now tell you to bulk-analyze in the web app
  before running — faster and cheaper than pushing it through Claude.
- **Boosted-video screen.** A "winner" with under ~2% engagement is usually a paid/boosted video —
  the skills now flag and set these aside so we don't reverse-engineer ads.
- **Per-channel before averaging.** The outward niche read now studies the top competitor channels
  individually before generalizing, so insights aren't a muddy average.
- **Pillars + ratio in the strategy.** `create-strategy` now organizes the plan into content pillars
  and balances the lineup to the bullseye ratio.
- **Hooks graded.** `write-script` now grades every spoken hook A–F against the hook rubric and
  rewrites anything below B+ before it ships; `create-format` now also banks a reusable hook mad-lib.

### 12.4 — New per-client docs

`<client>-bullseye.md` (rings + ratio), `<client>-content-pitch.md` (the approved batch), and
`<client>-run-state.md` (the conductor's memory of what's current). The originals — snapshot,
competitors, strategy, format-results — are unchanged.

### 12.5 — v2 cheat sheet

| Step | Command | When | Produces |
| :--- | :--- | :--- | :--- |
| Run everything | `/content-engine [client] [N]` | Any batch | Finished scripts, minimal input |
| Bullseye | `/audience-bullseye [client]` | New client / re-aim | Rings + content-mix ratio |
| Pitch | `/content-pitch [client]` | Before a batch | The approved slate |
| Diagnostic | `/channel-diagnostic [channel]` | Deep study | Four-reel HTML teardown |
| Breakdown | `/creator-breakdown [creator]` | Study a riser | How they broke out + monetize |
| Radar | `/outlier-pulse [client]` | Standing | Daily niche outliers |

---

*Questions or something unclear? That's a sign this SOP needs a line added — flag it so the next person has it easier.*
