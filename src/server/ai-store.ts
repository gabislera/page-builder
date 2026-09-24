/**
 * OpenAI access, per-user daily limit, and usage log. Kept out of
 * `ai.ts` so the browser bundle never pulls in the SDK or the database.
 */
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelUsage } from "ai";
import { and, count, eq, gt } from "drizzle-orm";
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

/** Generations per user in 24h (each variation counts as one). */
const dailyLimit = () => Number(process.env.AI_DAILY_LIMIT) || 150;

export async function assertAiQuota(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(aiGeneration)
    .where(and(eq(aiGeneration.userId, userId), gt(aiGeneration.createdAt, since)));
  if ((row?.n ?? 0) >= dailyLimit()) {
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
