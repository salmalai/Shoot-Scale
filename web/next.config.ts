import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The chat route reads the 6 skills' SKILL.md/references files live from ../skills at request
  // time (never copied — see lib/skillsFs.ts). Vercel's build only bundles files it can trace by
  // static analysis, and a dynamic path.join(SKILLS_ROOT, name, ...) isn't traceable, so without
  // this the skill files simply wouldn't exist in the deployed function.
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/chat": ["../skills/shoot-and-scale/skills/**/*"],
  },
};

export default nextConfig;
