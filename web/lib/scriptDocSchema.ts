import { z } from "zod";

const ScriptLineSchema = z.union([
  z.object({ who: z.enum(["client", "interviewer"]), t: z.string() }),
  z.object({
    runs: z.array(z.object({ who: z.enum(["client", "interviewer"]), t: z.string() })),
  }),
]);

export const ScriptDocSchema = z.object({
  shoot: z.string().min(1),
  client: z.string().min(1),
  ig: z.string().optional(),
  videos: z
    .array(
      z.object({
        topic: z.string(),
        format: z.string(),
        format_link: z.string().optional(),
        text_hook: z.string(),
        editor_notes: z.string().optional(),
        // Optional: "approved" keeps the title highlighted green on rebuild (set by /revise).
        verdict: z.string().optional(),
        // Optional: true files this video under the BACKUP SCRIPTS section instead of the main list.
        backup: z.boolean().optional(),
        // Optional: usually blank when produce writes the doc — the videographer fills this in after
        // the shoot (shot it / redo next time / skipped + why).
        shot_status: z.string().optional(),
        script: z.array(ScriptLineSchema).optional(),
      })
    )
    .min(1),
  // Optional: the videographer's end-of-day recap, usually blank when produce writes the doc.
  videography_notes: z.string().optional(),
});

export type ScriptDocPayload = z.infer<typeof ScriptDocSchema>;
