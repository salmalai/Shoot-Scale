import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CurrentMember } from "@/lib/auth";
import { uploadMarkdownToDrive } from "@/lib/googleDrive";

const CATEGORY_LABELS: Record<string, string> = {
  games_challenges: "🎮 Games / Challenges",
  educational: "📚 Educational",
  skits: "🎭 Skits",
};

type FormatRow = {
  number: number;
  slug: string;
  name: string;
  category: string;
  beats: string | null;
  origin: string | null;
  vetted_by: string | null;
};

export async function readFormatBankIndex() {
  const [{ data: bricks, error: bricksError }, { data: meta }] = await Promise.all([
    supabaseAdmin
      .from("format_bank")
      .select("number, slug, name, category, beats, origin, vetted_by")
      .order("number"),
    supabaseAdmin.from("format_bank_meta").select("value").eq("key", "index_preamble").maybeSingle(),
  ]);
  if (bricksError) throw new Error(bricksError.message);

  const byCategory = new Map<string, FormatRow[]>();
  for (const b of (bricks ?? []) as FormatRow[]) {
    const list = byCategory.get(b.category) ?? [];
    list.push(b);
    byCategory.set(b.category, list);
  }

  let out = (meta as { value: string } | null)?.value ?? "";
  out += "\n\n";
  for (const [category, label] of Object.entries(CATEGORY_LABELS)) {
    const list = byCategory.get(category) ?? [];
    if (!list.length) continue;
    out += `## ${label}\n| # | Format Name | Beats | Vetted by |\n|---|---|---|---|\n`;
    for (const b of list) {
      out += `| ${b.number} | ${b.name} | ${b.beats ?? ""} | ${b.vetted_by ?? "— (pre-rule, needs review)"} |\n`;
    }
    out += "\n";
  }
  return out;
}

// Finds bricks already banked from this exact source video, so a repeat /create-format run on the
// same URL can surface the existing brick(s) instead of silently minting a near-duplicate with a new
// name — the source URL is always embedded in the brick's leading <!-- source: ... --> comment.
export async function findFormatBySource(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return { matches: [] };

  // % and _ are live wildcards in Postgres LIKE/ILIKE — escape them (and any literal backslash first)
  // so a URL containing either (common in video-platform ids) can't produce false-positive matches.
  const escaped = trimmed.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");

  const { data, error } = await supabaseAdmin
    .from("format_bank")
    .select("number, slug, name, category, origin, content")
    .ilike("content", `%${escaped}%`);
  if (error) throw new Error(error.message);
  return {
    matches: (data ?? []).map((b) => ({ number: b.number, slug: b.slug, name: b.name, category: b.category, origin: b.origin })),
  };
}

export async function readFormatBrick(identifier: { number?: number; slug?: string }) {
  let query = supabaseAdmin.from("format_bank").select("*");
  if (identifier.number !== undefined) query = query.eq("number", identifier.number);
  else if (identifier.slug) query = query.eq("slug", identifier.slug);
  else throw new Error("Provide a format number or slug.");

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Format brick not found.");
  return data;
}

export async function writeFormatBrick(
  member: CurrentMember,
  input: {
    number?: number;
    slug: string;
    name: string;
    category: "games_challenges" | "educational" | "skits";
    beats?: string;
    origin?: string;
    content: string;
  }
) {
  let number = input.number;
  if (number === undefined) {
    // Structural backstop: the model is instructed to call find_format_by_source before creating a
    // new brick, but that's advisory (a system-prompt note, not enforced) — this check is what
    // actually stops a missed/forgotten step from banking a near-duplicate. Only applies when
    // creating a NEW brick (number omitted) and the content has a parseable source comment; updating
    // an existing brick (number passed explicitly) is unaffected.
    const sourceMatch = input.content.match(/<!--\s*source:\s*(\S+)/);
    if (sourceMatch) {
      const dup = await findFormatBySource(sourceMatch[1]);
      if (dup.matches.length) {
        const existing = dup.matches[0];
        throw new Error(
          `Format #${existing.number} ("${existing.name}") is already banked from this exact source video. Pass number: ${existing.number} to update it in place instead of creating a new brick.`
        );
      }
    }

    const { data } = await supabaseAdmin
      .from("format_bank")
      .select("number")
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();
    number = (data?.number ?? 0) + 1;
  }

  const { data: existing } = await supabaseAdmin
    .from("format_bank")
    .select("drive_file_id")
    .eq("number", number)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("format_bank").upsert(
    {
      number,
      slug: input.slug,
      name: input.name,
      category: input.category,
      beats: input.beats ?? null,
      origin: input.origin ?? null,
      // vetted_by is the authenticated user, never the model's own claim —
      // this is what actually enforces the skill's provenance rule.
      vetted_by: member.name,
      vetted_at: new Date().toISOString().slice(0, 10),
      content: input.content,
    },
    { onConflict: "number" }
  );
  if (error) throw new Error(error.message);

  // Match this repo's real format-bank/ folder — which is Drive-synced already, contents and all —
  // both its exact folder name and its "format-NN-slug.md" filename convention, so a new brick shows
  // up right alongside the ones already there instead of in a separate, unfamiliar location.
  const paddedNumber = String(number).padStart(2, "0");
  const { fileId, driveUrl } = await uploadMarkdownToDrive(input.content, `format-${paddedNumber}-${input.slug}.md`, {
    existingFileId: existing?.drive_file_id ?? undefined,
    folderPath: ["format-bank"],
  });

  const { error: driveError } = await supabaseAdmin
    .from("format_bank")
    .update({ drive_url: driveUrl, drive_file_id: fileId })
    .eq("number", number);
  if (driveError) throw new Error(driveError.message);

  return { number, name: input.name, drive_url: driveUrl, file_id: fileId };
}
