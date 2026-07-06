import { SessionPrep } from "@/lib/llm/session-schema";

export function sessionPrepToMarkdown(
  campaignName: string,
  sessionNumber: number,
  prep: SessionPrep,
) {
  const lines: string[] = [`# ${campaignName} — Session ${sessionNumber}`];

  if (prep.recapForPlayers) {
    lines.push("", "## Récap pour les joueurs", prep.recapForPlayers);
  }

  lines.push("", "## Objectifs (MJ)", prep.objectives);

  if (prep.openingReadAloud) {
    lines.push("", "## Texte d'ouverture", `> ${prep.openingReadAloud}`);
  }

  if (prep.scenes.length > 0) {
    lines.push("", "## Scènes");
    for (const scene of prep.scenes) {
      lines.push(
        "",
        `### ${scene.title}${scene.locationName ? ` — ${scene.locationName}` : ""}`,
        scene.summary,
      );
      if (scene.involvedNPCNames.length > 0) {
        lines.push(`PNJ impliqués : ${scene.involvedNPCNames.join(", ")}`);
      }
    }
  }

  if (prep.keyNPCs.length > 0) {
    lines.push("", "## PNJ clés");
    for (const npc of prep.keyNPCs) {
      lines.push(
        "",
        `### ${npc.name}`,
        `Veut cette session : ${npc.wantsThisSession}`,
        `Comment le jouer : ${npc.playingTips}`,
      );
    }
  }

  if (prep.hooks.length > 0) {
    lines.push("", "## Accroches");
    for (const hook of prep.hooks) lines.push(`- ${hook}`);
  }

  if (prep.complications.length > 0) {
    lines.push("", "## Complications");
    for (const complication of prep.complications) lines.push(`- ${complication}`);
  }

  return lines.join("\n");
}
