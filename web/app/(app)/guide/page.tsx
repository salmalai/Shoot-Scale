import { requireMember } from "@/lib/auth";

const STEPS = [
  {
    n: 1,
    cmd: "/snapshot",
    title: "Onboard the client",
    body: "Turns onboarding notes into the client's identity doc — their voice, niche, and hard no-gos.",
  },
  {
    n: 2,
    cmd: "/bullseye",
    title: "Set their audience",
    body: "Defines exactly who they're for and how many videos per batch aim at each ring.",
  },
  {
    n: 3,
    cmd: "/analyze",
    title: "Analyze their videos",
    body: "Reads what's already working vs. flopping on their page. Uses Sandcastles.",
  },
  {
    n: 4,
    cmd: "/create-format",
    title: "Save a winning format",
    optional: true,
    body: "Banks a repeatable format so it can be reused for any client later.",
  },
  {
    n: 5,
    cmd: "/produce",
    title: "Produce the batch",
    body: "Writes the scripts, grades the hooks, and builds the branded script doc.",
  },
];

export default async function GuidePage() {
  await requireMember();

  return (
    <div className="screen">
      <div className="frame" style={{ padding: 28 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>
          Cheat sheet
        </p>
        <h1 style={{ marginBottom: 4 }}>How the engine works</h1>
        <p className="muted" style={{ marginBottom: 8 }}>
          Five steps from a new client to a finished batch of scripts. Not sure where to start? Just type{" "}
          <span className="cmd">/run</span> and it walks you through all of it.
        </p>

        {STEPS.map((step) => (
          <div className="step" key={step.n}>
            <div className="num">{step.n}</div>
            <div>
              <h3>
                {step.title}
                &nbsp;&nbsp;
                <span className="cmd">{step.cmd}</span>
                {step.optional && (
                  <>
                    &nbsp;&nbsp;
                    <span className="muted small" style={{ fontWeight: 400 }}>
                      optional
                    </span>
                  </>
                )}
              </h3>
              <p className="muted small">{step.body}</p>
            </div>
          </div>
        ))}

        <div className="panel" style={{ padding: 16, marginTop: 20 }}>
          <h3 style={{ marginBottom: 6 }}>The moments it stops for you</h3>
          <p className="muted small">
            1 · whether a winner becomes a saved format &nbsp;·&nbsp; 2 · approving the format split before
            scripts are written. Everything else — including spending Sandcastles credits — runs on its own.
          </p>
        </div>
      </div>
    </div>
  );
}
