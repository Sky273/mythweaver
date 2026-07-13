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
      if (scene.readAloud) {
        lines.push("", `> ${scene.readAloud}`);
      }
      if (scene.stakes) {
        lines.push("", `**Enjeu :** ${scene.stakes}`);
      }
      if (scene.playerApproaches && scene.playerApproaches.length > 0) {
        lines.push("", "**Si les joueurs…**");
        for (const pa of scene.playerApproaches) {
          lines.push(`- ${pa.approach} → ${pa.response}`);
        }
      }
      if (scene.suggestedChecks && scene.suggestedChecks.length > 0) {
        lines.push("", "**Tests suggérés :**");
        for (const check of scene.suggestedChecks) lines.push(`- ${check}`);
      }
      if (scene.exits && scene.exits.length > 0) {
        lines.push("", "**Transitions :**");
        for (const exit of scene.exits) lines.push(`- ${exit}`);
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
