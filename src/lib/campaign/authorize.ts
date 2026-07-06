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

// For read-only views: grants access to the owner or to a collaborator
// invited via CampaignCollaborator. Write actions must keep using
// requireCampaignOwnership — collaborators are read-only.
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
  if (!collaborator) notFound();

  return { campaign, isOwner: false as const };
}
