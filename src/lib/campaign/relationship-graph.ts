// Pure builder that turns the campaign bible's foreign-key relations into a
// node/edge graph for the relationship-graph view. Kept free of Prisma/React so
// it can be unit tested. Only relations that actually exist in the schema as FKs
// are represented (plot threads have no entity FKs, so they aren't graphed).

export type GraphNodeType = "region" | "location" | "faction" | "npc";

export interface GraphNode {
  id: string; // type-prefixed, unique across the whole graph
  type: GraphNodeType;
  label: string;
  sub?: string; // small secondary line (e.g. NPC status)
  href: string; // where clicking the node navigates (entity edit page)
}

export interface GraphEdge {
  source: string; // GraphNode.id
  target: string; // GraphNode.id
  label: string; // relation kind, e.g. "membre", "situé dans"
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RelationshipGraphInput {
  regions: { id: string; name: string; parentId: string | null }[];
  locations: { id: string; name: string; regionId: string | null }[];
  factions: { id: string; name: string }[];
  npcs: {
    id: string;
    name: string;
    status: string;
    factionId: string | null;
    locationId: string | null;
  }[];
}

const NPC_STATUS_LABELS: Record<string, string> = {
  ALIVE: "En vie",
  DEAD: "Mort",
  MISSING: "Disparu",
  UNKNOWN: "Inconnu",
};

export function buildRelationshipGraph(
  campaignId: string,
  input: RelationshipGraphInput,
): RelationshipGraph {
  const nodes: GraphNode[] = [];
  const ids = new Set<string>();

  const add = (node: GraphNode) => {
    nodes.push(node);
    ids.add(node.id);
  };

  for (const region of input.regions) {
    add({
      id: `region:${region.id}`,
      type: "region",
      label: region.name,
      href: `/campaigns/${campaignId}/regions/${region.id}/edit`,
    });
  }
  for (const location of input.locations) {
    add({
      id: `location:${location.id}`,
      type: "location",
      label: location.name,
      href: `/campaigns/${campaignId}/locations/${location.id}/edit`,
    });
  }
  for (const faction of input.factions) {
    add({
      id: `faction:${faction.id}`,
      type: "faction",
      label: faction.name,
      href: `/campaigns/${campaignId}/factions/${faction.id}/edit`,
    });
  }
  for (const npc of input.npcs) {
    add({
      id: `npc:${npc.id}`,
      type: "npc",
      label: npc.name,
      sub: NPC_STATUS_LABELS[npc.status] ?? undefined,
      href: `/campaigns/${campaignId}/npcs/${npc.id}/edit`,
    });
  }

  const edges: GraphEdge[] = [];
  const link = (source: string, target: string, label: string) => {
    // Only connect nodes that both exist in the graph.
    if (ids.has(source) && ids.has(target)) {
      edges.push({ source, target, label });
    }
  };

  for (const region of input.regions) {
    if (region.parentId) {
      link(`region:${region.id}`, `region:${region.parentId}`, "sous-région de");
    }
  }
  for (const location of input.locations) {
    if (location.regionId) {
      link(`location:${location.id}`, `region:${location.regionId}`, "situé dans");
    }
  }
  for (const npc of input.npcs) {
    if (npc.factionId) {
      link(`npc:${npc.id}`, `faction:${npc.factionId}`, "membre");
    }
    if (npc.locationId) {
      link(`npc:${npc.id}`, `location:${npc.locationId}`, "présent");
    }
  }

  return { nodes, edges };
}
