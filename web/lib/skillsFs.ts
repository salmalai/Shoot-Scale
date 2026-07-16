import "server-only";
import fs from "node:fs";
import path from "node:path";
import { SKILL_NAMES, isSkillName, skillDescriptionsText, type SkillName } from "./skillCatalog";

export { SKILL_NAMES, isSkillName, type SkillName };
export const skillDescriptions = skillDescriptionsText;

// The 6 skills live one directory up from web/, at skills/shoot-and-scale/skills/.
// Read live from disk, never copied or edited — this is what "don't change
// anything in skill" means in practice.
const SKILLS_ROOT = path.resolve(process.cwd(), "..", "skills", "shoot-and-scale", "skills");

export function loadSkill(name: SkillName): string {
  return fs.readFileSync(path.join(SKILLS_ROOT, name, "SKILL.md"), "utf-8");
}

export function readSkillFile(name: SkillName, relativePath: string): string {
  const skillDir = path.join(SKILLS_ROOT, name);
  const resolved = path.resolve(skillDir, relativePath);
  if (!resolved.startsWith(skillDir + path.sep)) {
    throw new Error("Path escapes the skill folder.");
  }
  return fs.readFileSync(resolved, "utf-8");
}
