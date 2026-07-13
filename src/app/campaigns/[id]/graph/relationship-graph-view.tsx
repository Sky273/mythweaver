"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  GraphNode,
  GraphNodeType,
  RelationshipGraph,
} from "@/lib/campaign/relationship-graph";

const WIDTH = 900;
const HEIGHT = 640;

// Categorical colours chosen to stay legible on both light and dark canvases.
const TYPE_STYLE: Record<
  GraphNodeType,
  { color: string; label: string; radius: number }
> = {
  region: { color: "#10b981", label: "Régions", radius: 22 },
  location: { color: "#6366f1", label: "Lieux", radius: 18 },
  faction: { color: "#f59e0b", label: "Factions", radius: 20 },
  npc: { color: "#ec4899", label: "PNJ", radius: 14 },
};

interface Positioned {
  x: number;
  y: number;
}

// Deterministic Fruchterman-Reingold layout, run synchronously to a settled
// state. Seeded by node index so the layout is stable across renders.
function computeLayout(graph: RelationshipGraph): Record<string, Positioned> {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const pos: Record<string, Positioned> = {};
  if (n === 0) return pos;

  const area = WIDTH * HEIGHT;
  const k = Math.sqrt(area / n); // ideal edge length
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Seed on a circle so nothing starts coincident (which would make repulsion
  // explode) and the initial spread is even.
  nodes.forEach((node, i) => {
    const angle = (i / n) * Math.PI * 2;
    const r = Math.min(WIDTH, HEIGHT) * 0.35;
    pos[node.id] = {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  });

  const iterations = 400;
  let temp = Math.min(WIDTH, HEIGHT) * 0.1;
  const cool = temp / (iterations + 1);

  for (let iter = 0; iter < iterations; iter++) {
    const disp: Record<string, Positioned> = {};
    for (const node of nodes) disp[node.id] = { x: 0, y: 0 };

    // Repulsion between every pair.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = pos[a.id].x - pos[b.id].x;
        let dy = pos[a.id].y - pos[b.id].y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          // Deterministic tiny nudge (no Math.random) so the layout is stable.
          dx = (i - j) * 0.01 + 0.01;
          dy = (i + j) * 0.01 + 0.01;
          dist = Math.hypot(dx, dy) || 0.01;
        }
        const force = (k * k) / dist;
        const ux = dx / dist;
        const uy = dy / dist;
        disp[a.id].x += ux * force;
        disp[a.id].y += uy * force;
        disp[b.id].x -= ux * force;
        disp[b.id].y -= uy * force;
      }
    }

    // Attraction along edges.
    for (const edge of edges) {
      const a = pos[edge.source];
      const b = pos[edge.target];
      if (!a || !b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const force = (dist * dist) / k;
      const ux = dx / dist;
      const uy = dy / dist;
      disp[edge.source].x -= ux * force;
      disp[edge.source].y -= uy * force;
      disp[edge.target].x += ux * force;
      disp[edge.target].y += uy * force;
    }

    // Apply displacement, capped by the cooling temperature, kept in bounds.
    for (const node of nodes) {
      const d = disp[node.id];
      const dist = Math.hypot(d.x, d.y) || 0.01;
      const p = pos[node.id];
      p.x += (d.x / dist) * Math.min(dist, temp);
      p.y += (d.y / dist) * Math.min(dist, temp);
      // Wider horizontal inset so node labels (centred under each node) don't
      // spill past the canvas edges.
      const mx = 110;
      const my = 44;
      p.x = Math.max(mx, Math.min(WIDTH - mx, p.x));
      p.y = Math.max(my, Math.min(HEIGHT - my, p.y));
    }

    temp -= cool;
  }

  return pos;
}

export function RelationshipGraphView({ graph }: { graph: RelationshipGraph }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [layoutKey, setLayoutKey] = useState(0);
  const [positions, setPositions] = useState<Record<string, Positioned>>({});

  // Compute the force layout on the client only (after mount): running it during
  // SSR too would produce a hydration mismatch (floating-point drift between the
  // server and client renders of the same simulation). Seeding state from this
  // one-shot client computation is the intent, hence the rule suppression.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPositions(computeLayout(graph));
  }, [graph, layoutKey]);

  const drag = useRef<{
    id: string;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * WIDTH,
      y: ((clientY - rect.top) / rect.height) * HEIGHT,
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent, node: GraphNode) => {
    event.preventDefault();
    drag.current = { id: node.id, moved: false, pointerId: event.pointerId };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    drag.current.moved = true;
    const { x, y } = toSvgCoords(event.clientX, event.clientY);
    const id = drag.current.id;
    setPositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const onPointerUp = (node: GraphNode) => {
    const state = drag.current;
    drag.current = null;
    // A press without movement is a click → open the entity.
    if (state && !state.moved && state.id === node.id) {
      router.push(node.href);
    }
  };

  const relayout = () => {
    setLayoutKey((k) => k + 1);
  };

  const counts = useMemo(() => {
    const c: Record<GraphNodeType, number> = {
      region: 0,
      location: 0,
      faction: 0,
      npc: 0,
    };
    for (const node of graph.nodes) c[node.type]++;
    return c;
  }, [graph.nodes]);

  const nodeById = useMemo(() => {
    const map: Record<string, GraphNode> = {};
    for (const node of graph.nodes) map[node.id] = node;
    return map;
  }, [graph.nodes]);

  if (graph.nodes.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted">
        Rien à afficher pour l&apos;instant : ajoute des régions, lieux, factions
        et PNJ à la bible, puis relie-les (un PNJ à sa faction, un lieu à sa
        région…) pour voir la toile de la campagne se dessiner.
      </p>
    );
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {(Object.keys(TYPE_STYLE) as GraphNodeType[]).map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: TYPE_STYLE[type].color }}
            />
            <span className="text-muted">
              {TYPE_STYLE[type].label}
              <span className="ml-1 text-xs opacity-70">({counts[type]})</span>
            </span>
          </span>
        ))}
        <button
          type="button"
          onClick={relayout}
          className="ml-auto rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary"
        >
          Réorganiser
        </button>
      </div>

      <p className="mt-2 text-xs text-muted">
        Glisse un nœud pour le déplacer, clique dessus pour ouvrir sa fiche.
      </p>

      <div
        className="mt-3 overflow-hidden rounded-xl border border-border bg-surface"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-full w-full touch-none"
          onPointerMove={onPointerMove}
        >
          {graph.edges.map((edge, i) => {
            const a = positions[edge.source];
            const b = positions[edge.target];
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-border)"
                strokeWidth={1.5}
              />
            );
          })}

          {graph.nodes.map((node) => {
            const p = positions[node.id] ?? nodeById[node.id];
            if (!p || typeof p.x !== "number") return null;
            const style = TYPE_STYLE[node.type];
            return (
              <g
                key={node.id}
                transform={`translate(${p.x}, ${p.y})`}
                className="cursor-pointer"
                onPointerDown={(e) => onPointerDown(e, node)}
                onPointerUp={() => onPointerUp(node)}
              >
                <circle
                  r={style.radius}
                  fill={style.color}
                  stroke="var(--color-background)"
                  strokeWidth={2.5}
                />
                <text
                  y={style.radius + 13}
                  textAnchor="middle"
                  className="pointer-events-none fill-foreground"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
