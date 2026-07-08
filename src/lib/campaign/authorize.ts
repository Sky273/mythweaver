import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Returns 404 rather than a 403/redirect for campaigns the caller doesn't
// own, so unauthenticated/other users can't tell a campaign exists at all.
export async function requireCampaignOwnership(campaignId: string) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign || campaign.ownerId !== session.user.id) notFound();

  return campaign;
}

// For read-only views of the FULL bible: grants access to the owner or a
// CO_GM collaborator. PLAYER collaborators are deliberately excluded here —
// they must never reach the GM-facing bible (secrets, motivations, unrevealed
// content); they only get the player view via requirePlayerAccess. Write
// actions must keep using requireCampaignOwnership.
export async function requireCampaignAccess(campaignId: string) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) notFound();

  if (campaign.ownerId === session.user.id) {
    return { campaign, isOwner: true as const };
  }

  const collaborator = await prisma.campaignCollaborator.findUnique({
    where: { campaignId_userId: { campaignId, userId: session.user.id } },
  });
  if (!collaborator || collaborator.role !== "CO_GM") notFound();

  return { campaign, isOwner: false as const };
}

// For the player view: grants access to the owner, a CO_GM (who can preview
// it), or a PLAYER collaborator. Returns the caller's relationship so the view
// can, e.g., offer GM-only affordances to the owner.
export async function requirePlayerAccess(campaignId: string) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) notFound();

  if (campaign.ownerId === session.user.id) {
    return { campaign, isOwner: true as const };
  }

  const collaborator = await prisma.campaignCollaborator.findUnique({
    where: { campaignId_userId: { campaignId, userId: session.user.id } },
  });
  if (!collaborator) notFound();

  return { campaign, isOwner: false as const };
}
