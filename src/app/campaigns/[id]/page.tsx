import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { CampaignBibleView } from "./campaign-bible-view";
import { deleteCampaignAsset } from "./assets/actions";
import { deleteRandomTable } from "./random-tables/actions";
import { createEncounter } from "./encounters/actions";
import { deleteEncounter } from "./encounters/[encounterId]/actions";
import { addCollaborator, removeCollaborator } from "./collaborators/actions";
import { PrintButton } from "@/components/print-button";
import { RandomTableRoller } from "@/components/random-table-roller";
import { BackLink } from "@/components/back-link";
import { buildPreviewUrl } from "@/lib/campaign/preview-url";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";
import {
  dangerActionLinkClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/form-styles";

const SESSION_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifiée",
  PREPPED: "Préparée",
  PLAYED: "Jouée",
};

const ASSET_KIND_LABELS: Record<string, string> = {
  MAP: "Carte",
  DOCUMENT: "Document",
};

const RANDOM_TABLE_KIND_LABELS: Record<string, string> = {
  ENCOUNTER: "Rencontres",
  LOOT: "Butin",
  NPC: "PNJ de circonstance",
  MISC: "Divers",
};

const QUICK_NAV_LINKS = [
  { href: "#sessions", label: "Sessions" },
  { href: "#encounters", label: "Combats" },
  { href: "#assets", label: "Documents" },
  { href: "#player-characters", label: "PJ" },
  { href: "#world", label: "Monde" },
  { href: "#regions", label: "Régions" },
  { href: "#locations", label: "Lieux" },
  { href: "#factions", label: "Factions" },
  { href: "#npcs", label: "PNJ" },
  { href: "#plot-threads", label: "Intrigues" },
  { href: "#random-tables", label: "Tables" },
];

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isOwner } = await requireCampaignAccess(id);

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      ...campaignBibleInclude,
      playerCharacters: true,
      sessions: { orderBy: { number: "desc" } },
      assets: { orderBy: { createdAt: "desc" } },
      randomTables: { orderBy: { createdAt: "desc" } },
      encounters: { orderBy: { createdAt: "desc" } },
      collaborators: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!campaign) notFound();

  const quickNavLinks = isOwner
    ? [...QUICK_NAV_LINKS, { href: "#sharing", label: "Partage" }]
    : QUICK_NAV_LINKS;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <BackLink href="/" label="Mes campagnes" />
      <header className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {campaign.system}
            {campaign.tone ? ` — ${campaign.tone}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Link
            href={`/campaigns/${campaign.id}/timeline`}
            className="text-sm text-indigo-500 hover:underline"
          >
            Chronologie
          </Link>
          <a
            href={`/campaigns/${campaign.id}/export`}
            className="text-sm text-indigo-500 hover:underline"
          >
            Exporter en Markdown
          </a>
          <PrintButton />
        </div>
      </header>
      {campaign.synopsis && (
        <p className="mt-4 text-base leading-relaxed">{campaign.synopsis}</p>
      )}

      <nav
        className="sticky top-0 z-20 -mx-6 mt-6 flex flex-wrap gap-2 border-b border-gray-200 bg-white px-6 py-3 print:hidden dark:border-gray-800 dark:bg-black"
        aria-label="Navigation rapide dans la campagne"
      >
        {quickNavLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-sm whitespace-nowrap hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <section id="sessions" className="mt-10 scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Sessions</h2>
          {isOwner && (
            <Link
              href={`/campaigns/${campaign.id}/sessions/new`}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 print:hidden"
            >
              Préparer la prochaine session
            </Link>
          )}
        </div>
        {campaign.sessions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Aucune session préparée pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-800">
            {campaign.sessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between py-2">
                <Link
                  href={`/campaigns/${campaign.id}/sessions/${session.id}`}
                  className="font-medium hover:underline"
                >
                  Session {session.number}
                </Link>
                <span className="text-xs text-gray-500">
                  {SESSION_STATUS_LABELS[session.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="encounters" className="mt-10 scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Combats</h2>
        </div>
        {isOwner && (
          <form
            action={createEncounter}
            className="mt-3 flex flex-wrap items-end gap-3 print:hidden"
          >
            <input type="hidden" name="campaignId" value={campaign.id} />
            <div className="flex-1">
              <label htmlFor="encounterName" className={labelClass}>
                Nom du combat
              </label>
              <input
                id="encounterName"
                name="name"
                required
                className={inputClass}
                placeholder="Embuscade sur la route de Mornepuits"
              />
            </div>
            <button type="submit" className={primaryButtonClass}>
              Nouveau combat
            </button>
          </form>
        )}
        {campaign.encounters.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Aucun combat pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-800">
            {campaign.encounters.map((encounter) => (
              <li
                key={encounter.id}
                className="flex items-center justify-between py-2"
              >
                <Link
                  href={`/campaigns/${campaign.id}/encounters/${encounter.id}`}
                  className="font-medium hover:underline"
                >
                  {encounter.name}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {encounter.active ? "En cours" : "Terminé"}
                  </span>
                  {isOwner && (
                    <form action={deleteEncounter} className="print:hidden">
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <input type="hidden" name="encounterId" value={encounter.id} />
                      <button type="submit" className={dangerActionLinkClass}>
                        Supprimer
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="assets" className="mt-10 scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Cartes & documents</h2>
          {isOwner && (
            <Link
              href={`/campaigns/${campaign.id}/assets/new`}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 print:hidden"
            >
              Générer un document
            </Link>
          )}
        </div>
        {campaign.assets.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Aucun document généré pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {campaign.assets.map((asset) => (
              <li key={asset.id} className="space-y-1">
                <Link
                  href={buildPreviewUrl(campaign.id, asset.filePath, {
                    title: asset.title,
                    back: `/campaigns/${campaign.id}#assets`,
                    backLabel: campaign.name,
                  })}
                >
                  <img
                    src={`/campaigns/${campaign.id}/files/${asset.filePath.split("/")[1]}`}
                    alt={asset.title}
                    className="aspect-square w-full rounded-md object-cover"
                  />
                </Link>
                <p className="text-sm font-medium">{asset.title}</p>
                <p className="text-xs text-gray-500">
                  {ASSET_KIND_LABELS[asset.kind]}
                </p>
                {isOwner && (
                  <form action={deleteCampaignAsset} className="print:hidden">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <input type="hidden" name="assetId" value={asset.id} />
                    <button type="submit" className={dangerActionLinkClass}>
                      Supprimer
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CampaignBibleView campaign={campaign} readOnly={!isOwner} />

      <section id="random-tables" className="mt-10 scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Tables aléatoires</h2>
          {isOwner && (
            <Link
              href={`/campaigns/${campaign.id}/random-tables/new`}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 print:hidden"
            >
              Générer une table
            </Link>
          )}
        </div>
        {campaign.randomTables.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Aucune table générée pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 space-y-6">
            {campaign.randomTables.map((table) => (
              <li key={table.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {table.title}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {RANDOM_TABLE_KIND_LABELS[table.kind]}
                    </span>
                  </p>
                  {isOwner && (
                    <form action={deleteRandomTable} className="print:hidden">
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <input type="hidden" name="tableId" value={table.id} />
                      <button type="submit" className={dangerActionLinkClass}>
                        Supprimer
                      </button>
                    </form>
                  )}
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                  {(table.entries as string[]).map((entry, index) => (
                    <li key={index}>{entry}</li>
                  ))}
                </ul>
                <div className="mt-3 print:hidden">
                  <RandomTableRoller entries={table.entries as string[]} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isOwner && (
        <section id="sharing" className="mt-10 scroll-mt-28 print:hidden">
          <h2 className="text-lg font-semibold">Partage</h2>
          <p className="mt-1 text-sm text-gray-500">
            Invite d&apos;autres MJ à consulter cette campagne en lecture
            seule (sans possibilité d&apos;éditer, générer ou supprimer quoi
            que ce soit).
          </p>

          <form action={addCollaborator} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <div className="flex-1">
              <label htmlFor="collaboratorEmail" className={labelClass}>
                Email de l&apos;utilisateur à inviter
              </label>
              <input
                id="collaboratorEmail"
                name="email"
                type="email"
                required
                className={inputClass}
                placeholder="autre-mj@example.com"
              />
            </div>
            <button type="submit" className={primaryButtonClass}>
              Inviter
            </button>
          </form>

          {campaign.collaborators.length > 0 && (
            <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
              {campaign.collaborators.map((collaborator) => (
                <li
                  key={collaborator.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>{collaborator.user.email}</span>
                  <form action={removeCollaborator}>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <input
                      type="hidden"
                      name="collaboratorId"
                      value={collaborator.id}
                    />
                    <button type="submit" className={dangerActionLinkClass}>
                      Retirer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
