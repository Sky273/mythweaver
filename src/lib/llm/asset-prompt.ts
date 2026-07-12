import { Prisma } from "@/generated/prisma/client";

export type CampaignForAssetPrompt = Prisma.CampaignGetPayload<{
  include: {
    world: true;
    regions: true;
    locations: { include: { region: true } };
  };
}>;

export function buildMapImagePrompt(
  campaign: CampaignForAssetPrompt,
  userPrompt: string,
) {
  const lines: string[] = [
    `Hand-drawn fantasy campaign map for "${campaign.name}" (${campaign.system}).`,
  ];

  if (campaign.tone) lines.push(`Overall tone/style: ${campaign.tone}.`);
  if (campaign.world?.overview) lines.push(campaign.world.overview);

  const locationsByRegion = new Map<string, typeof campaign.locations>();
  const unassignedLocations: typeof campaign.locations = [];
  for (const location of campaign.locations) {
    if (location.region) {
      const list = locationsByRegion.get(location.region.id) ?? [];
      list.push(location);
      locationsByRegion.set(location.region.id, list);
    } else {
      unassignedLocations.push(location);
    }
  }

  if (campaign.regions.length > 0) {
    lines.push(
      "",
      "The map MUST depict exactly these regions as distinct, clearly bordered areas, each labeled with its name in legible text:",
    );
    for (const region of campaign.regions) {
      lines.push(`- Region "${region.name}": ${region.description ?? ""}`);
      const locations = locationsByRegion.get(region.id) ?? [];
      for (const location of locations) {
        lines.push(
          `  - Location "${location.name}" within ${region.name}: ${location.description ?? ""}`,
        );
      }
    }
  }

  if (unassignedLocations.length > 0) {
    lines.push("", "Other notable locations to place on the map:");
    for (const location of unassignedLocations) {
      lines.push(`- "${location.name}": ${location.description ?? ""}`);
    }
  }

  lines.push(
    "",
    "Render every named region and location as a labeled element positioned sensibly relative to the others (do not omit any). Style: aged parchment cartography, hand-inked, no modern elements.",
    "Keep the depiction tasteful and safe-for-work: no nudity, no sexual or explicit content, no graphic gore.",
  );

  if (userPrompt) {
    lines.push("", `Additional direction from the GM: ${userPrompt}`);
  }

  return lines.join("\n");
}

export function buildPortraitImagePrompt(
  campaign: CampaignForAssetPrompt,
  npc: { name: string; description: string | null; motivations: string | null },
) {
  const lines: string[] = [
    `Character portrait for the tabletop RPG campaign "${campaign.name}" (${campaign.system}).`,
  ];

  if (campaign.tone) lines.push(`Overall tone/style: ${campaign.tone}.`);
  lines.push(
    "",
    `Subject: ${npc.name}.`,
    npc.description ?? "",
    npc.motivations ? `Personality/motivations to convey through expression and pose: ${npc.motivations}` : "",
    "",
    "Style: painted portrait bust, waist-up, neutral background, no text or logos.",
    "Keep the depiction tasteful and safe-for-work regardless of the character's backstory: fully clothed, no nudity, no sexual or explicit content, no graphic gore.",
  );

  return lines.join("\n");
}

export function buildCrestImagePrompt(
  campaign: CampaignForAssetPrompt,
  faction: { name: string; description: string | null; goals: string | null },
) {
  const lines: string[] = [
    `Heraldic crest/emblem for the faction "${faction.name}" in the tabletop RPG campaign "${campaign.name}" (${campaign.system}).`,
  ];

  if (campaign.tone) lines.push(`Overall tone/style: ${campaign.tone}.`);
  lines.push(
    "",
    faction.description ?? "",
    faction.goals ? `What the faction stands for: ${faction.goals}` : "",
    "",
    "Style: flat heraldic emblem/coat of arms, centered, plain background, no text, suitable as an icon.",
    "Keep the depiction tasteful and safe-for-work: no nudity, no sexual or explicit content, no graphic gore.",
  );

  return lines.join("\n");
}

export function buildLocationImagePrompt(
  campaign: CampaignForAssetPrompt,
  location: {
    name: string;
    description: string | null;
    region: { name: string } | null;
  },
) {
  const lines: string[] = [
    `Establishing scene of the location "${location.name}" in the tabletop RPG campaign "${campaign.name}" (${campaign.system}).`,
  ];

  if (campaign.tone) lines.push(`Overall tone/style: ${campaign.tone}.`);
  if (campaign.world?.overview) lines.push(campaign.world.overview);
  if (location.region) {
    lines.push(`Located in the region of ${location.region.name}.`);
  }

  lines.push(
    "",
    location.description ?? "",
    "",
    "Style: atmospheric environment/landscape illustration establishing the place, wide view, no people in focus, no text or logos.",
    "Keep the depiction tasteful and safe-for-work: no nudity, no sexual or explicit content, no graphic gore.",
  );

  return lines.join("\n");
}

export function buildDocumentImagePrompt(
  campaign: CampaignForAssetPrompt,
  userPrompt: string,
) {
  const lines: string[] = [
    `In-world document/illustration for the campaign "${campaign.name}" (${campaign.system}).`,
  ];

  if (campaign.tone) lines.push(`Overall tone/style: ${campaign.tone}.`);
  if (campaign.world?.overview) lines.push(campaign.world.overview);

  lines.push(
    "",
    userPrompt,
    "",
    "Keep the depiction tasteful and safe-for-work: no nudity, no sexual or explicit content, no graphic gore.",
  );

  return lines.join("\n");
}
