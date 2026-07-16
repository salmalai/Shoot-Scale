# How the Shoot & Scale Content System Works
### A super beginner-friendly guide

---

## 🧒 First, the fifth-grader version

Imagine you run a **restaurant that makes short videos instead of food.**

- Every **client** is like a chef with their own style. Before you cook for them, you need to know what they like, who they're cooking for, and what they're *not* allowed to serve.
- **Recipes** are called **formats** — proven ways to build a video that people love (like "rank these things worst-to-best" or a funny little skit).
- **Ingredients** are called **topics** — what the video is actually *about* (getting more house sellers, closing deals, hiring help).
- A helper robot named **Claude** does the cooking. You're the head chef who tastes each dish and says "yes," "change this," or "throw it out."
- A tool called **Sandcastles** is your taste-tester. It looks at the client's old videos and tells you which ones people loved and which flopped, so you cook more of the good stuff.

So the whole job is: **learn the chef → decide who we're feeding → look at what worked before → cook a big batch of videos → the chef approves them.** That's it. Everything else is just details.

---

## 🎯 What am I actually doing?

You're running a **factory that turns one client into a stack of ready-to-film video scripts** — fast, and in *their* voice, using video styles that are already proven to work.

You mostly do three things:
1. **Kick it off** — tell the system which client and how many videos ("Esteban, 20 scripts").
2. **Answer a few yes/no questions** at the important moments.
3. **Review the final scripts** and ask for tweaks.

The system does the heavy lifting in between. You are the decision-maker, not the typist.

---

## 🗂️ The pieces (who's who)

Think of these as the folders and helpers the system uses.

**The three "living documents"** — one set per client, kept in `clients/<Client Name>/`. They're the system's memory:

- **Snapshot** = *Who is this client?* Their voice, their brand colors, who they sell to, and the stuff they never want to post. (Also where we now save their Sandcastles login info so we never get lost.)
- **Bullseye** = *Who are we aiming at?* The exact dream viewer in the center, with wider rings of "also okay" viewers around them — and how many videos to aim at each ring.
- **Content-Analysis** = *What's working and what's flopping?* Built by studying the client's own past videos. This is the only doc that changes every time.

**The Format Bank** = a shared cookbook of proven video **recipes (formats)**, numbered like `#27 Handle Each Type`. Everybody's clients can use them. New recipes only go in the book after *you* approve them.

**Sandcastles** = the outside app that scores the client's videos (which went viral, which didn't). It's the taste-tester.

**Claude** = the helper that reads all of the above and writes the scripts.

---

## 🔄 The workflow (the assembly line)

The system always moves in the same order. You'll usually just type **`/run [client] [number] scripts`** and it walks you through it:

```
Snapshot  →  Bullseye  →  Analyze  →  (Create-Format)  →  Produce
 (who?)      (aim?)       (what works?)   (new recipe?)     (cook!)
```

Here's what each stage *feels* like:

**1. Snapshot — "Do we know this client?"**
If they're brand new, or something changed (new brand, new offer), we build/update their identity doc from their onboarding notes. If nothing changed, we just confirm it's still good and move on.

**2. Bullseye — "Who are we aiming at?"**
We double-check the dream-viewer target and the mix (for example: out of 20 videos, 9 for the bullseye, 6 for the next ring, 5 for the widest ring). Rarely changes once it's set.

**3. Analyze — "What's actually working for them?"**
This is the research step. You go into **Sandcastles**, filter the client's videos (last 3 months, decent engagement, sorted by best-performing), let it analyze the top ~100, and **export a JSON file**. You hand that file to Claude, and it reads all of them for free and writes the Content-Analysis: the winning formats, the winning topics, and the stuff to stop doing.

**4. Create-Format — "Did we find a new recipe worth keeping?"** *(only sometimes)*
If a client's winning video looks like a repeatable new style, you can save it as a new format in the cookbook — but only if you approve it.

**5. Produce — "Cook the batch."**
Claude proposes the **format split** (which recipes, how many of each). You approve or swap. Then it writes every script, grades each hook (the first 2 seconds that stop the scroll), and packages them into a clean, branded document — one video per page — for you to film.

---

## 🛑 The only 3 times the system stops for you

Everything is automatic **except** these three "stop signs." This is on purpose — your attention is saved for what matters:

1. **Credits** — before anything that costs money on Sandcastles, it tells you the exact count and waits for your "go." Nothing gets spent secretly.
2. **New format** — "This winning video could be a reusable recipe. Want to add it to the cookbook?"
3. **Format split** — before writing, "Here are the recipes I want to use for this batch — approve or swap?" (You approve *recipes*, not topics. Topics Claude picks itself.)

If you see anything else happening automatically, that's normal. These three are the real decisions.

---

## 👀 What a real run looks like (Esteban, 20 scripts)

1. You typed: **`/run esteban 20 scripts`**.
2. System checked his **Snapshot** and **Bullseye** — both current, so it moved on.
3. **Analyze:** you exported his 68 analyzed videos from Sandcastles as a JSON. Claude read them and found the big truth: his broad, curiosity-driven videos crush, while his "comment for my link" sales posts flop. That became his Content-Analysis doc.
4. **Format split:** Claude proposed a set of recipes. You reviewed them, tossed a few you didn't approve, and asked for **skits** instead. You locked the final mix.
5. **Produce:** Claude wrote all 20 scripts in his voice, graded the hooks, and built the branded **Script Doc** — ready to film.
6. **Learn:** at the end, we looked back at what went wrong and improved the system itself so next time is smoother.

That last step is a quiet superpower: **the system gets a little smarter every run.**

---

## ✅ Your quick-start cheat sheet

- **To make content:** type `/run [client name] [number] scripts`.
- **When it asks a question:** answer honestly — approve, swap, or skip.
- **When it needs Sandcastles data:** filter → analyze top ~100 → **Export JSON** → hand it over.
- **At the end:** open the Script Doc in Google Docs, highlight each title **green (approve) / yellow (tweak) / red (reject)**, and tell Claude your changes.
- **Golden rule:** the **Snapshot always wins.** If any video ever clashes with the client's voice or their "never do this" list, the Snapshot is the boss.

---

## 🧠 One-sentence summary

**You pick a client and a number; the system remembers who they are, studies what works, cooks a batch of on-brand video scripts, and stops only to let you approve the money, the recipes, and the final work.**
