import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { CampaignBibleView } from "./campaign-bible-view";
import { deleteCampaignAsset } from "./assets/actions";
import { deleteRandomTable } from "./random-tables/actions";
import { createEncounter } from "./encounters/actions";
import { createSession } from "./sessions/actions";
import { deleteEncounter } from "./encounters/[encounterId]/actions";
import { addCollaborator, removeCollaborator } from "./collaborators/actions";
import { PrintButton } from "@/components/print-button";
import { RevealToggle } from "@/components/reveal-toggle";
import { RandomTableRoller } from "@/components/random-table-roller";
import { BackLink } from "@/components/back-link";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { buildPreviewUrl } from "@/lib/campaign/preview-url";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";
import {
  dangerActionLinkClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-styles";
import { SESSION_STATUS_LABELS } from "@/lib/campaign/labels";

const SESSION_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "primary" | "success" }
> = {
  PLANNED: { label: SESSION_STATUS_LABELS.PLANNED, tone: "neutral" },
  PREPPED: { label: SESSION_STATUS_LABELS.PREPPED, tone: "primary" },
  PLAYED: { label: SESSION_STATUS_LABELS.PLAYED, tone: "success" },
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

const headerLinkClass =
  "text-sm font-medium text-primary hover:underline";

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
    <main className="mx-auto max-w-4xl px-6 py-8">
      <BackLink href="/" label="Mes campagnes" />

      <header className="card relative mt-3 overflow-hidden p-6 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent"
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight">
              {campaign.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="primary">{campaign.system}</Badge>
              {campaign.tone && <Badge tone="accent">{campaign.tone}</Badge>}
              {!isOwner && <Badge>Lecture seule</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 print:hidden">
            <Link
              href={`/campaigns/${campaign.id}/timeline`}
              className={headerLinkClass}
            >
              Chronologie
            </Link>
            <a
              href={`/campaigns/${campaign.id}/export`}
              className={headerLinkClass}
            >
              Exporter en Markdown
            </a>
            <PrintButton />
          </div>
        </div>
        {campaign.synopsis && (
          <p className="mt-4 leading-relaxed text-muted">{campaign.synopsis}</p>
        )}
      </header>

      <nav
        className="sticky top-14 z-20 -mx-6 mt-6 flex flex-wrap gap-2 border-b border-border bg-background/85 px-6 py-3 backdrop-blur-md print:hidden"
        aria-label="Navigation rapide dans la campagne"
      >
        {quickNavLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm whitespace-nowrap text-muted hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <section id="sessions" className="mt-10 scroll-mt-28">
        <SectionHeader title="Sessions">
          {isOwner && (
            <div className="flex flex-wrap gap-2 print:hidden">
              <Link
                href={`/campaigns/${campaign.id}/run`}
                className={secondaryButtonClass}
              >
                🎲 Écran de MJ (en jeu)
              </Link>
              <form action={createSession}>
                <input type="hidden" name="campaignId" value={campaign.id} />
                <button type="submit" className={secondaryButtonClass}>
                  Ajouter une session
                </button>
              </form>
              <Link
                href={`/campaigns/${campaign.id}/sessions/new`}
                className={primaryButtonClass}
              >
                Préparer avec l&apos;IA
              </Link>
            </div>
          )}
        </SectionHeader>
        {campaign.sessions.length === 0 ? (
          <EmptyState title="Aucune session préparée pour l'instant." />
        ) : (
          <ul className="card divide-y divide-border">
            {campaign.sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/campaigns/${campaign.id}/sessions/${session.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover"
                >
                  <span className="font-medium">Session {session.number}</span>
                  <Badge tone={SESSION_STATUS[session.status].tone}>
                    {SESSION_STATUS[session.status].label}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="encounters" className="mt-10 scroll-mt-28">
        <SectionHeader title="Combats" />
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
          <p className="mt-3 text-sm text-muted">
            Aucun combat pour l&apos;instant.
          </p>
        ) : (
          <ul className="card mt-3 divide-y divide-border">
            {campaign.encounters.map((encounter) => (
              <li
                key={encounter.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <Link
                  href={`/campaigns/${campaign.id}/encounters/${encounter.id}`}
                  className="font-medium hover:text-primary"
                >
                  {encounter.name}
                </Link>
                <div className="flex items-center gap-3">
                  <Badge tone={encounter.active ? "primary" : "neutral"}>
                    {encounter.active ? "En cours" : "Terminé"}
                  </Badge>
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
        <SectionHeader title="Cartes & documents">
          {isOwner && (
            <Link
              href={`/campaigns/${campaign.id}/assets/new`}
              className={`${primaryButtonClass} print:hidden`}
            >
              Ajouter un document (générer ou uploader)
            </Link>
          )}
        </SectionHeader>
        {campaign.assets.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Aucun document généré pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {campaign.assets.map((asset) => (
              <li key={asset.id} className="card group overflow-hidden">
                <Link
                  href={buildPreviewUrl(campaign.id, asset.filePath, {
                    title: asset.title,
                    back: `/campaigns/${campaign.id}#assets`,
                    backLabel: campaign.name,
                  })}
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/campaigns/${campaign.id}/files/${asset.filePath.split("/")[1]}`}
                    alt={asset.title}
                    className="aspect-square w-full object-cover transition group-hover:opacity-90"
                  />
                </Link>
                <div className="p-3">
                  <p className="text-sm font-medium">{asset.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {ASSET_KIND_LABELS[asset.kind]}
                  </p>
                  {isOwner && (
                    <div className="mt-1 flex items-center gap-2 print:hidden">
                      <RevealToggle
                        kind="asset"
                        id={asset.id}
                        campaignId={campaign.id}
                        revealed={asset.revealed}
                      />
                      <form action={deleteCampaignAsset}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="assetId" value={asset.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-danger hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CampaignBibleView campaign={campaign} readOnly={!isOwner} />

      <section id="random-tables" className="mt-10 scroll-mt-28">
        <SectionHeader title="Tables aléatoires">
          {isOwner && (
            <Link
              href={`/campaigns/${campaign.id}/random-tables/new`}
              className={`${primaryButtonClass} print:hidden`}
            >
              Générer une table
            </Link>
          )}
        </SectionHeader>
        {campaign.randomTables.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Aucune table générée pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {campaign.randomTables.map((table) => (
              <li key={table.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {table.title}
                    <span className="ml-2 align-middle">
                      <Badge tone="accent">
                        {RANDOM_TABLE_KIND_LABELS[table.kind]}
                      </Badge>
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
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
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
          <SectionHeader title="Partage">
            <Link
              href={`/campaigns/${campaign.id}/play`}
              className={secondaryButtonClass}
            >
              Prévisualiser la vue joueurs
            </Link>
          </SectionHeader>
          <p className="mt-1 text-sm text-muted">
            Invite un <strong>co-MJ</strong> (accès complet à la bible en
            lecture seule) ou un <strong>joueur</strong> (accès uniquement à la
            vue joueurs : contenu révélé et sans spoiler). Chacun a besoin d&apos;un
            compte Mythweaver.
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
                placeholder="personne@example.com"
              />
            </div>
            <div>
              <label htmlFor="collaboratorRole" className={labelClass}>
                Rôle
              </label>
              <select
                id="collaboratorRole"
                name="role"
                defaultValue="CO_GM"
                className={inputClass}
              >
                <option value="CO_GM">Co-MJ</option>
                <option value="PLAYER">Joueur</option>
              </select>
            </div>
            <button type="submit" className={primaryButtonClass}>
              Inviter
            </button>
          </form>

          {campaign.collaborators.length > 0 && (
            <ul className="card mt-4 divide-y divide-border">
              {campaign.collaborators.map((collaborator) => (
                <li
                  key={collaborator.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    {collaborator.user.email}
                    <Badge tone={collaborator.role === "PLAYER" ? "accent" : "primary"}>
                      {collaborator.role === "PLAYER" ? "Joueur" : "Co-MJ"}
                    </Badge>
                  </span>
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

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
