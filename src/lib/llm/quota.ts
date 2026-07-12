import { prisma } from "@/lib/prisma";

export const MONTHLY_GENERATION_LIMIT = Number(
  process.env.MONTHLY_GENERATION_LIMIT ?? 200,
);

export function startOfCurrentMonth(now = new Date()) {
  const date = new Date(now);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function computeRemainingQuota(
  used: number,
  limit: number = MONTHLY_GENERATION_LIMIT,
) {
  return Math.max(0, limit - used);
}

export async function getRemainingQuota(userId: string) {
  const used = await prisma.generationLog.count({
    where: { userId, createdAt: { gte: startOfCurrentMonth() } },
  });
  return computeRemainingQuota(used);
}

export type GenerationKind =
  | "campaign_bible"
  | "session_prep"
  | "recap_analysis"
  | "campaign_image"
  | "entity_regeneration"
  | "entity_generation"
  | "plot_briefing"
  | "campaign_qa"
  | "random_table";

export async function checkGenerationQuota(userId: string) {
  const remaining = await getRemainingQuota(userId);
  if (remaining <= 0) {
    throw new Error(
      `Quota mensuel de génération atteint (${MONTHLY_GENERATION_LIMIT}). Réessaie le mois prochain.`,
    );
  }
}

export async function recordGeneration(userId: string, kind: GenerationKind) {
  await prisma.generationLog.create({ data: { userId, kind } });
}
