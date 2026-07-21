// Plain data, no filesystem access — safe to import from client components
// (the "/" command menu) as well as server code (system prompt building).

export const SKILL_NAMES = ["snapshot", "bullseye", "analyze", "create-format", "produce", "revise"] as const;
export type SkillName = (typeof SKILL_NAMES)[number];

export const SKILL_CATALOG: { name: SkillName; command: string; description: string }[] = [
  {
    name: "snapshot",
    command: "/snapshot",
    description: "Build or update the client's identity doc — voice, niche, goals, hard no-gos.",
  },
  {
    name: "bullseye",
    command: "/bullseye",
    description: "Derive the client's audience Bullseye and the content-mix ratio from the Snapshot.",
  },
  {
    name: "analyze",
    command: "/analyze",
    description: "Deep-read the client's own video performance into what's working vs. flopping.",
  },
  {
    name: "create-format",
    command: "/create-format",
    description: "Turn a video URL or an original idea into a reusable Format Bank brick.",
  },
  {
    name: "produce",
    command: "/produce",
    description: "Pitch the format split, write hook-graded scripts, and build the branded Script Doc.",
  },
  {
    name: "revise",
    command: "/revise",
    description: "Read the client's marked-up Script Doc (green/yellow/red + comments) and update the same living doc in place.",
  },
];

export function isSkillName(name: string): name is SkillName {
  return (SKILL_NAMES as readonly string[]).includes(name);
}

export function skillDescriptionsText(): string {
  return SKILL_CATALOG.map((s) => `- ${s.name} (${s.command}): ${s.description}`).join("\n");
}
