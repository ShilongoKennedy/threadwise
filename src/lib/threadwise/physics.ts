import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import { relationshipForce } from "./graph";
import type { TEdge, TNode } from "./store";

type Particle = SimulationNodeDatum & { id: string };
export function createPhysics(nodes: TNode[], edges: TEdge[]) {
  const particles: Particle[] = nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }));
  const ids = new Set(particles.map((p) => p.id));
  const links = edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ source: e.source, target: e.target, ...relationshipForce(e.data?.relation) }));
  const cx = particles.reduce((sum, p) => sum + (p.x ?? 0), 0) / Math.max(1, particles.length);
  const cy = particles.reduce((sum, p) => sum + (p.y ?? 0), 0) / Math.max(1, particles.length);
  const simulation = forceSimulation(particles).stop()
    .force("links", forceLink<Particle, (typeof links)[number]>(links).id((p) => p.id).distance((l) => l.distance).strength((l) => l.strength))
    .force("charge", forceManyBody().strength(-250))
    .force("space", forceCollide<Particle>(190).strength(0.9))
    .force("x", forceX(cx).strength(0.008)).force("y", forceY(cy).strength(0.008));
  return { simulation, positions: () => Object.fromEntries(particles.map((p) => [p.id, { x: p.x ?? 0, y: p.y ?? 0 }])) };
}