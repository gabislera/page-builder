/**
 * OpenAI access, per-user daily limit, and usage log. Kept out of
 * `ai.ts` so the browser bundle never pulls in the SDK or the database.
 */
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, jsonSchema, type LanguageModelUsage, Output, zodSchema } from "ai";
import { and, count, eq, gt } from "drizzle-orm";
import type { z } from "zod";
import { db } from "#/db";
import { aiGeneration } from "#/db/schema";

/** fast: sections, copy, variations. smart: page planning and structural edits. */
export type AiTier = "fast" | "smart";

const DEFAULT_MODELS: Record<AiTier, string> = {
  fast: "gpt-5.4-mini",
  smart: "gpt-5.5",
};

export function aiModel(tier: AiTier) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("IA indisponível: configure OPENAI_API_KEY no servidor.");
  const id = (tier === "fast" ? process.env.OPENAI_MODEL_FAST : process.env.OPENAI_MODEL_SMART) || DEFAULT_MODELS[tier];
  return { id, model: createOpenAI({ apiKey })(id) };
}

/**
 * Schema for OpenAI strict mode. Reused parts go in `$defs` (inline, the
 * section schema is ~4x bigger); zod writes draft-7 `definitions`,
 * renamed to the `$defs` OpenAI documents.
 */
export function strictSchema<T>(schema: z.ZodType<T>) {
  const base = zodSchema(schema, { useReferences: true });
  return jsonSchema<T>(
    async () => {
      const json = JSON.stringify(await base.jsonSchema)
        .replaceAll('"#/definitions/', '"#/$defs/')
        .replace('"definitions":', '"$defs":');
      return JSON.parse(json);
    },
    { validate: base.validate },
  );
}

/** Generations per user in 24h (each variation or page section counts as one). */
const dailyLimit = () => Number(process.env.AI_DAILY_LIMIT) || 150;

export async function assertAiQuota(userId: string, needed = 1) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(aiGeneration)
    .where(and(eq(aiGeneration.userId, userId), gt(aiGeneration.createdAt, since)));
  if ((row?.n ?? 0) + needed > dailyLimit()) {
    throw new Error("Você atingiu o limite diário de gerações com IA. Tente novamente amanhã.");
  }
}

export async function logGeneration(entry: {
  userId: string;
  projectId: string;
  kind: string;
  model: string;
  prompt: string;
  output?: unknown;
  error?: string;
  usage?: LanguageModelUsage;
  durationMs: number;
}) {
  await db.insert(aiGeneration).values({
    userId: entry.userId,
    projectId: entry.projectId,
    kind: entry.kind,
    model: entry.model,
    prompt: entry.prompt.slice(0, 4000),
    output: entry.output ?? null,
    error: entry.error?.slice(0, 2000) ?? null,
    inputTokens: entry.usage?.inputTokens ?? 0,
    cachedInputTokens: entry.usage?.inputTokenDetails?.cacheReadTokens ?? 0,
    outputTokens: entry.usage?.outputTokens ?? 0,
    durationMs: entry.durationMs,
  });
}

/**
 * One structured call: model → validated object, logged either way.
 * Errors reach the user as `failMessage` (details stay in the log).
 */
export async function generateStructured<T>(opts: {
  tier: AiTier;
  schema: ReturnType<typeof strictSchema<T>>;
  instructions: string;
  prompt: string;
  log: { userId: string; projectId: string; kind: string; prompt: string };
  failMessage: string;
}): Promise<T> {
  const { id, model } = aiModel(opts.tier);
  const started = Date.now();
  const log = { ...opts.log, model: id };
  try {
    const result = await generateText({
      model,
      instructions: opts.instructions,
      prompt: opts.prompt,
      output: Output.object({ schema: opts.schema }),
      providerOptions: { openai: { reasoningEffort: "low" } },
      maxRetries: 1,
    });
    await logGeneration({ ...log, output: result.output, usage: result.usage, durationMs: Date.now() - started });
    return result.output as T;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logGeneration({ ...log, error: message, durationMs: Date.now() - started });
    console.error(`[ai] ${opts.log.kind}`, message);
    throw new Error(opts.failMessage);
  }
}
