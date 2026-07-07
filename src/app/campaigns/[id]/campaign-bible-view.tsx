"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { LockToggle } from "@/components/lock-toggle";
import { Badge } from "@/components/badge";
import { GeneratingOverlay } from "@/components/generating-overlay";
import { actionLinkClass } from "@/components/form-styles";
import { buildPreviewUrl } from "@/lib/campaign/preview-url";
import {
  NPC_STATUS_LABELS,
  PLOT_STATUS_LABELS,
} from "@/lib/campaign/labels";
import {
  generateRegion,
  generateLocation,
  generateFaction,
  generateNPC,
  generatePlotThread,
} from "./generate-actions";

export type CampaignWithRelations = Prisma.CampaignGetPayload<{
  include: {
    world: true;
    regions: true;
    locations: { include: { region: true } };
    factions: true;
    npcs: { include: { faction: true; location: true } };
    plotThreads: true;
    playerCharacters: true;
  };
}>;

const NPC_STATUS_TONE: Record<string, "neutral" | "success" | "danger"> = {
  ALIVE: "success",
  DEAD: "danger",
  MISSING: "neutral",
  UNKNOWN: "neutral",
};

const PLOT_STATUS_TONE: Record<string, "neutral" | "primary" | "success"> = {
  SEEDED: "neutral",
  ACTIVE: "primary",
  RESOLVED: "success",
};

function matchesQuery(query: string, ...fields: (string | null | undefined)[]) {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(q));
}

const ReadOnlyContext = createContext(false);

const thumbClass =
  "h-12 w-12 shrink-0 rounded-md object-cover ring-1 ring-border";
const rowClass = "flex items-start justify-between gap-3 px-4 py-3";

export function CampaignBibleView({
  campaign,
  readOnly = false,
}: {
  campaign: CampaignWithRelations;
  readOnly?: boolean;
}) {
  const [query, setQuery] = useState("");

  const regions = useMemo(
    () => campaign.regions.filter((r) => matchesQuery(query, r.name, r.description)),
    [campaign.regions, query],
  );
  const locations = useMemo(
    () =>
      campaign.locations.filter((l) =>
        matchesQuery(query, l.name, l.description, l.region?.name),
      ),
    [campaign.locations, query],
  );
  const factions = useMemo(
    () =>
      campaign.factions.filter((f) =>
        matchesQuery(query, f.name, f.description, f.goals),
      ),
    [campaign.factions, query],
  );
  const npcs = useMemo(
    () =>
      campaign.npcs.filter((n) =>
        matchesQuery(
          query,
          n.name,
          n.description,
          n.motivations,
          n.secrets,
          n.faction?.name,
          n.location?.name,
        ),
      ),
    [campaign.npcs, query],
  );
  const plotThreads = useMemo(
    () =>
      campaign.plotThreads.filter((p) => matchesQuery(query, p.title, p.description)),
    [campaign.plotThreads, query],
  );
  const playerCharacters = useMemo(
    () =>
      campaign.playerCharacters.filter((pc) =>
        matchesQuery(query, pc.name, pc.playerName, pc.class, pc.summary, pc.backstory),
      ),
    [campaign.playerCharacters, query],
  );

  const worldMatches =
    !campaign.world || matchesQuery(query, campaign.world.overview, campaign.world.history, campaign.world.cosmology);

  return (
    <ReadOnlyContext.Provider value={readOnly}>
      <div>
        <div className="sticky top-28 z-10 mt-8 -mx-6 bg-background/85 px-6 py-2 backdrop-blur-md print:hidden">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher dans la bible de campagne…"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/70 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus-visible:outline-none"
          />
        </div>

        <Section
          id="player-characters"
          title="Personnages joueurs"
          addHref={`/campaigns/${campaign.id}/player-characters/new/edit`}
          hidden={query !== "" && playerCharacters.length === 0}
        >
          <ul className="card divide-y divide-border">
            {playerCharacters.map((pc) => (
              <li key={pc.id} className={rowClass}>
                <div>
                  <p className="font-medium">
                    {pc.name}
                    <span className="ml-2 text-xs font-normal text-muted">
                      {[pc.class, pc.playerName].filter(Boolean).join(" · ")}
                    </span>
                  </p>
                  {pc.summary && (
                    <p className="text-sm text-muted">{pc.summary}</p>
                  )}
                  {pc.backstory && (
                    <p className="mt-1 text-sm text-muted">{pc.backstory}</p>
                  )}
                  {pc.characterSheetPath && (
                    <a
                      href={`/campaigns/${campaign.id}/files/${pc.characterSheetPath.split("/")[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      Feuille de personnage
                    </a>
                  )}
                </div>
                <ItemActions
                  editHref={`/campaigns/${campaign.id}/player-characters/${pc.id}/edit`}
                />
              </li>
            ))}
          </ul>
        </Section>

        {campaign.world && worldMatches && (
          <Section
            id="world"
            title="Le monde"
            editHref={`/campaigns/${campaign.id}/world/edit`}
            lock={
              <LockToggle
                kind="world"
                id={campaign.world.id}
                campaignId={campaign.id}
                locked={campaign.world.locked}
              />
            }
          >
            <div className="card p-4">
              <p className="leading-relaxed">{campaign.world.overview}</p>
              {campaign.world.history && (
                <p className="mt-3 leading-relaxed text-muted">
                  {campaign.world.history}
                </p>
              )}
              {campaign.world.cosmology && (
                <p className="mt-3 leading-relaxed text-muted">
                  {campaign.world.cosmology}
                </p>
              )}
            </div>
          </Section>
        )}

        <Section
          id="regions"
          title="Régions"
          addHref={`/campaigns/${campaign.id}/regions/new/edit`}
          generate={<GenerateButton action={generateRegion} campaignId={campaign.id} />}
          hidden={query !== "" && regions.length === 0}
        >
          <ul className="card divide-y divide-border">
            {regions.map((region) => (
              <li key={region.id} className={rowClass}>
                <div>
                  <p className="font-medium">{region.name}</p>
                  {region.description && (
                    <p className="text-sm text-muted">{region.description}</p>
                  )}
                </div>
                <ItemActions
                  editHref={`/campaigns/${campaign.id}/regions/${region.id}/edit`}
                  lock={
                    <LockToggle
                      kind="region"
                      id={region.id}
                      campaignId={campaign.id}
                      locked={region.locked}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="locations"
          title="Lieux"
          addHref={`/campaigns/${campaign.id}/locations/new/edit`}
          generate={<GenerateButton action={generateLocation} campaignId={campaign.id} />}
          hidden={query !== "" && locations.length === 0}
        >
          <ul className="card divide-y divide-border">
            {locations.map((location) => (
              <li key={location.id} className={rowClass}>
                <div>
                  <p className="font-medium">
                    {location.name}
                    {location.region && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        {location.region.name}
                      </span>
                    )}
                  </p>
                  {location.description && (
                    <p className="text-sm text-muted">{location.description}</p>
                  )}
                </div>
                <ItemActions
                  editHref={`/campaigns/${campaign.id}/locations/${location.id}/edit`}
                  lock={
                    <LockToggle
                      kind="location"
                      id={location.id}
                      campaignId={campaign.id}
                      locked={location.locked}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="factions"
          title="Factions"
          addHref={`/campaigns/${campaign.id}/factions/new/edit`}
          generate={<GenerateButton action={generateFaction} campaignId={campaign.id} />}
          hidden={query !== "" && factions.length === 0}
        >
          <ul className="card divide-y divide-border">
            {factions.map((faction) => (
              <li key={faction.id} className={rowClass}>
                <div className="flex items-start gap-3">
                  {faction.crestPath && (
                    <Link
                      href={buildPreviewUrl(campaign.id, faction.crestPath, {
                        title: faction.name,
                        back: `/campaigns/${campaign.id}#factions`,
                        backLabel: campaign.name,
                      })}
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/campaigns/${campaign.id}/files/${faction.crestPath.split("/")[1]}`}
                        alt=""
                        className={thumbClass}
                      />
                    </Link>
                  )}
                  <div>
                    <p className="font-medium">{faction.name}</p>
                    {faction.description && (
                      <p className="text-sm text-muted">{faction.description}</p>
                    )}
                    {faction.goals && (
                      <p className="mt-1 text-sm italic text-muted">
                        Objectifs : {faction.goals}
                      </p>
                    )}
                  </div>
                </div>
                <ItemActions
                  editHref={`/campaigns/${campaign.id}/factions/${faction.id}/edit`}
                  lock={
                    <LockToggle
                      kind="faction"
                      id={faction.id}
                      campaignId={campaign.id}
                      locked={faction.locked}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="npcs"
          title="PNJ"
          addHref={`/campaigns/${campaign.id}/npcs/new/edit`}
          generate={<GenerateButton action={generateNPC} campaignId={campaign.id} />}
          hidden={query !== "" && npcs.length === 0}
        >
          <ul className="card divide-y divide-border">
            {npcs.map((npc) => (
              <li key={npc.id} className={rowClass}>
                <div className="flex items-start gap-3">
                  {npc.portraitPath && (
                    <Link
                      href={buildPreviewUrl(campaign.id, npc.portraitPath, {
                        title: npc.name,
                        back: `/campaigns/${campaign.id}#npcs`,
                        backLabel: campaign.name,
                      })}
                      className="shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/campaigns/${campaign.id}/files/${npc.portraitPath.split("/")[1]}`}
                        alt=""
                        className={thumbClass}
                      />
                    </Link>
                  )}
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {npc.name}
                      <Badge tone={NPC_STATUS_TONE[npc.status]}>
                        {NPC_STATUS_LABELS[npc.status]}
                      </Badge>
                      {(npc.faction?.name || npc.location?.name) && (
                        <span className="text-xs font-normal text-muted">
                          {[npc.faction?.name, npc.location?.name]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </p>
                    {npc.description && (
                      <p className="text-sm text-muted">{npc.description}</p>
                    )}
                    {npc.motivations && (
                      <p className="mt-1 text-sm text-muted">
                        Motivations : {npc.motivations}
                      </p>
                    )}
                    {npc.secrets && (
                      <p className="mt-1 text-sm italic text-muted">
                        Secret : {npc.secrets}
                      </p>
                    )}
                  </div>
                </div>
                <ItemActions
                  editHref={`/campaigns/${campaign.id}/npcs/${npc.id}/edit`}
                  lock={
                    <LockToggle
                      kind="npc"
                      id={npc.id}
                      campaignId={campaign.id}
                      locked={npc.locked}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="plot-threads"
          title="Intrigues"
          addHref={`/campaigns/${campaign.id}/plot-threads/new/edit`}
          generate={<GenerateButton action={generatePlotThread} campaignId={campaign.id} />}
          hidden={query !== "" && plotThreads.length === 0}
        >
          <ul className="card divide-y divide-border">
            {plotThreads.map((plot) => (
              <li key={plot.id} className={rowClass}>
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {plot.title}
                    <Badge tone={PLOT_STATUS_TONE[plot.status]}>
                      {PLOT_STATUS_LABELS[plot.status]}
                    </Badge>
                  </p>
                  {plot.description && (
                    <p className="text-sm text-muted">{plot.description}</p>
                  )}
                </div>
                <ItemActions
                  editHref={`/campaigns/${campaign.id}/plot-threads/${plot.id}/edit`}
                  lock={
                    <LockToggle
                      kind="plotThread"
                      id={plot.id}
                      campaignId={campaign.id}
                      locked={plot.locked}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </ReadOnlyContext.Provider>
  );
}

function Section({
  id,
  title,
  children,
  addHref,
  editHref,
  lock,
  generate,
  hidden,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  addHref?: string;
  editHref?: string;
  lock?: React.ReactNode;
  generate?: React.ReactNode;
  hidden?: boolean;
}) {
  const readOnly = useContext(ReadOnlyContext);

  if (hidden) return null;

  return (
    <section id={id} className="mt-10 scroll-mt-28">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-1 print:hidden">
            {lock}
            {editHref && (
              <Link href={editHref} className={actionLinkClass}>
                Éditer
              </Link>
            )}
            {generate}
            {addHref && (
              <Link href={addHref} className={actionLinkClass}>
                + Ajouter
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// One-click "generate a new entity via AI" button, sitting next to "+ Ajouter".
// Posts to the matching server action, which generates the entity grounded in
// the full bible, persists it, and redirects to its edit page for review. The
// GeneratingOverlay blocks navigation with a spinner during the LLM call.
function GenerateButton({
  action,
  campaignId,
}: {
  action: (formData: FormData) => Promise<void>;
  campaignId: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="campaignId" value={campaignId} />
      <button type="submit" className={actionLinkClass}>
        ✨ Générer
      </button>
      <GeneratingOverlay message="Génération en cours… l'IA crée un nouvel élément cohérent avec ta bible." />
    </form>
  );
}

function ItemActions({
  editHref,
  lock,
}: {
  editHref: string;
  lock?: React.ReactNode;
}) {
  const readOnly = useContext(ReadOnlyContext);
  if (readOnly) return null;

  return (
    <div className="flex shrink-0 items-center gap-1 print:hidden">
      {lock}
      <Link href={editHref} className={actionLinkClass}>
        Éditer
      </Link>
    </div>
  );
}
