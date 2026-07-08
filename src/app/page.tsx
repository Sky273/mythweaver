import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { signOutAction } from "./actions";
import { primaryButtonClass } from "@/components/form-styles";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";

export default async function Home() {
  const session = await auth();

  const campaigns = await prisma.campaign.findMany({
    where: { ownerId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  const sharedCollaborations = await prisma.campaignCollaborator.findMany({
    where: { userId: session!.user.id },
    include: { campaign: { include: { owner: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Mes campagnes</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span>{session!.user.email}</span>
            <span aria-hidden>·</span>
            <form action={signOutAction}>
              <button type="submit" className="text-primary hover:underline">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
        <Link href="/campaigns/new" className={primaryButtonClass}>
          + Nouvelle campagne
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Aucune campagne pour l'instant"
            hint="Décris ton univers en quelques mots et Mythweaver génère un premier jet complet : monde, factions, PNJ et intrigues."
            action={
              <Link href="/campaigns/new" className={primaryButtonClass}>
                Créer ma première campagne
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <CampaignCard
                href={`/campaigns/${campaign.id}`}
                name={campaign.name}
                system={campaign.system}
                tone={campaign.tone}
              />
            </li>
          ))}
        </ul>
      )}

      {sharedCollaborations.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold">
            Campagnes partagées avec moi
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedCollaborations.map((collaboration) => (
              <li key={collaboration.id}>
                <CampaignCard
                  href={
                    collaboration.role === "PLAYER"
                      ? `/campaigns/${collaboration.campaign.id}/play`
                      : `/campaigns/${collaboration.campaign.id}`
                  }
                  name={collaboration.campaign.name}
                  system={collaboration.campaign.system}
                  tone={collaboration.campaign.tone}
                  sharedBy={collaboration.campaign.owner.email}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function CampaignCard({
  href,
  name,
  system,
  tone,
  sharedBy,
}: {
  href: string;
  name: string;
  system: string;
  tone: string | null;
  sharedBy?: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex h-full flex-col p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary">
        {name}
      </h3>
      {tone && <p className="mt-1 text-sm text-muted line-clamp-2">{tone}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{system}</Badge>
        {sharedBy && (
          <span className="text-xs text-muted">MJ : {sharedBy}</span>
        )}
      </div>
    </Link>
  );
}
