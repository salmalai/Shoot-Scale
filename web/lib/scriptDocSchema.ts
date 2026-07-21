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
        script: z.array(ScriptLineSchema).optional(),
      })
    )
    .min(1),
});

export type ScriptDocPayload = z.infer<typeof ScriptDocSchema>;
