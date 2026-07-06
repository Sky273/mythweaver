import { CampaignWithRelations } from "@/app/campaigns/[id]/campaign-bible-view";
import { NPC_STATUS_LABELS, PLOT_STATUS_LABELS } from "@/lib/campaign/labels";

export function campaignBibleToMarkdown(campaign: CampaignWithRelations) {
  const lines: string[] = [`# ${campaign.name}`, `${campaign.system}`];

  if (campaign.tone) lines.push(`Ton : ${campaign.tone}`);
  if (campaign.synopsis) lines.push("", campaign.synopsis);

  if (campaign.playerCharacters.length > 0) {
    lines.push("", "## Personnages joueurs");
    for (const pc of campaign.playerCharacters) {
      lines.push(
        "",
        `### ${pc.name}${pc.class ? ` (${pc.class})` : ""}`,
        [pc.summary, pc.backstory].filter(Boolean).join("\n\n"),
      );
    }
  }

  if (campaign.world) {
    lines.push("", "## Le monde", campaign.world.overview);
    if (campaign.world.history) lines.push("", campaign.world.history);
    if (campaign.world.cosmology) lines.push("", campaign.world.cosmology);
  }

  if (campaign.regions.length > 0) {
    lines.push("", "## Régions");
    for (const region of campaign.regions) {
      lines.push("", `### ${region.name}`, region.description ?? "");
    }
  }

  if (campaign.locations.length > 0) {
    lines.push("", "## Lieux");
    for (const location of campaign.locations) {
      lines.push(
        "",
        `### ${location.name}${location.region ? ` — ${location.region.name}` : ""}`,
        location.description ?? "",
      );
    }
  }

  if (campaign.factions.length > 0) {
    lines.push("", "## Factions");
    for (const faction of campaign.factions) {
      lines.push("", `### ${faction.name}`, faction.description ?? "");
      if (faction.goals) lines.push(`Objectifs : ${faction.goals}`);
    }
  }

  if (campaign.npcs.length > 0) {
    lines.push("", "## PNJ");
    for (const npc of campaign.npcs) {
      lines.push(
        "",
        `### ${npc.name} [${NPC_STATUS_LABELS[npc.status]}]`,
        [npc.faction?.name, npc.location?.name].filter(Boolean).join(" · "),
        npc.description ?? "",
      );
      if (npc.motivations) lines.push(`Motivations : ${npc.motivations}`);
      if (npc.secrets) lines.push(`Secret : ${npc.secrets}`);
    }
  }

  if (campaign.plotThreads.length > 0) {
    lines.push("", "## Intrigues");
    for (const plot of campaign.plotThreads) {
      lines.push(
        "",
        `### ${plot.title} [${PLOT_STATUS_LABELS[plot.status]}]`,
        plot.description ?? "",
      );
    }
  }

  return lines.join("\n");
}
