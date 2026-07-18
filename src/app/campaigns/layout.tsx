// AI generation (campaign bible, NPC portraits, faction crests, session
// prep, recaps, random tables, entity generation/regeneration) runs inside
// server actions on the /campaigns routes and can take far longer than
// Vercel's default function timeout — image generation with gpt-image-1 in
// particular (tens of seconds). Raise the limit for the whole subtree so
// these no longer time out. 300s requires **Fluid Compute** enabled on the
// Vercel project (Settings → Functions); with it, Hobby allows up to 300s.
// Without Fluid, Vercel clamps this back to the 60s Hobby ceiling.
export const maxDuration = 300;

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
