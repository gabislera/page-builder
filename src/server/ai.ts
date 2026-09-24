/**
 * AI generation. The model returns AI-Spec (validated by the schema);
 * the editor compiles it into nodes, so the response stays small and
 * the spec can be recompiled when the compiler improves.
 */
import { createServerFn } from "@tanstack/react-start";
import { generateText, jsonSchema, Output, zodSchema } from "ai";
import { z } from "zod";
import { SECTION_INSTRUCTIONS, sectionUserPrompt, VARIATIONS } from "#/builder/ai/prompt";
import { SectionSpec } from "#/builder/ai/spec";
import { requirePageAccess } from "./access.ts";
import { aiModel, assertAiQuota, logGeneration } from "./ai-store.ts";
import { authMiddleware } from "./middleware.ts";
import { loadSiteSettings } from "./page-store.ts";

/**
 * Section schema for OpenAI strict mode. Leaf blocks appear in several
 * places, so they go in `$defs` (inline, the schema is ~4x bigger);
 * zod writes draft-7 `definitions`, renamed to the `$defs` OpenAI documents.
 */
const sectionSchema = (() => {
  const base = zodSchema(SectionSpec, { useReferences: true });
  return jsonSchema<typeof SectionSpec._output>(
    async () => {
      const json = JSON.stringify(await base.jsonSchema)
        .replaceAll('"#/definitions/', '"#/$defs/')
        .replace('"definitions":', '"$defs":');
      return JSON.parse(json);
    },
    { validate: base.validate },
  );
})();

export const generateSection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      pageId: z.string(),
      prompt: z.string().trim().min(3).max(2000),
      /** Titles of the sections already on the page. */
      pageOutline: z.array(z.string().max(200)).max(40),
      variation: z
        .number()
        .int()
        .min(0)
        .max(VARIATIONS.length - 1),
    }),
  )
  .handler(async ({ data, context }) => {
    const row = await requirePageAccess(context.user.id, data.pageId);
    await assertAiQuota(context.user.id);
    const { settings } = await loadSiteSettings(row.projectId);
    const { id: modelId, model } = aiModel("fast");
    const prompt = sectionUserPrompt({
      prompt: data.prompt,
      siteName: settings.identity.name,
      pageName: row.name,
      pageOutline: data.pageOutline,
      variation: data.variation,
    });

    const started = Date.now();
    const log = {
      userId: context.user.id,
      projectId: row.projectId,
      kind: "section",
      model: modelId,
      prompt: data.prompt,
    };
    try {
      const result = await generateText({
        model,
        instructions: SECTION_INSTRUCTIONS,
        prompt,
        output: Output.object({ schema: sectionSchema }),
        providerOptions: { openai: { reasoningEffort: "low" } },
        maxRetries: 1,
      });
      await logGeneration({ ...log, output: result.output, usage: result.usage, durationMs: Date.now() - started });
      return { spec: result.output };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await logGeneration({ ...log, error: message, durationMs: Date.now() - started });
      console.error("[ai] generateSection", message);
      throw new Error("Não foi possível gerar a seção agora. Tente novamente.");
    }
  });
