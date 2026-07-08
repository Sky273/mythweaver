// AI generation (campaign bible, NPC portraits, faction crests, session
// prep, recaps, random tables, entity generation/regeneration) runs inside
// server actions on the /campaigns routes and can take far longer than
// Vercel's default function timeout — image generation with gpt-image-1 in
// particular (tens of seconds). Raise the limit for the whole subtree so
// these no longer time out. 60s is the Hobby-plan ceiling; on Pro it can go
// higher (up to 300).
export const maxDuration = 60;

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
