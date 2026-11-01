import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ArrowLeft, X } from "lucide-react";
import { useThread, type TEdge, type TNode } from "@/lib/threadwise/store";
import { TYPE_INFO } from "@/lib/threadwise/model";
import { useWorkspaces } from "@/lib/threadwise/workspaces";

export const Route = createFileRoute("/strata")({
  head: () => ({
    meta: [
      { title: "Threadwise — Strata" },
      {
        name: "description",
        content:
          "An epistemic altitude view: what is grounded sits on the floor, what is assumed floats above it.",
      },
    ],
  }),
  component: StrataPage,
});

type Lens = "type" | "risk" | "scarcity";
type Epistemic = TNode["data"]["epistemic"];

/** Five shelves, bottom to top. Altitude is the whole point of the view. */
const LAYERS: { key: Epistemic; label: string; lift: number }[] = [
  { key: "fact", label: "FACT", lift: 0 },
  { key: "evidence", label: "EVIDENCE", lift: 0.18 },
  { key: "assumption", label: "ASSUMPTION", lift: 0.62 },
  { key: "hypothesis", label: "HYPOTHESIS", lift: 0.82 },
  { key: "unknown", label: "UNKNOWN", lift: 1 },
];

const ALTITUDE = 11;
const CARD_W = 3.1;
const CARD_H = 1.55;
const STEP_X = CARD_W + 0.85;
const STEP_Z = CARD_H + 1.75;
const ROW_LIMIT = 7;

const TYPE_HEX: Record<string, string> = {
  idea: "#1A4BFF",
  note: "#4E7C9E",
  question: "#3E9BC0",
  experiment: "#2E8F7F",
  action: "#2A2A2A",
  portal: "#1A1A1A",
  dossier: "#3E4A5C",
  omission: "#C1121F",
};

const RISK_RAMP = ["#D8D2C4", "#E0A33D", "#E0602C", "#C1121F"];
const SCARCITY_RAMP = ["#DCE3F5", "#8FA8FF", "#4A74FF", "#1A4BFF"];

const liftOf = (node: TNode) => LAYERS.find((l) => l.key === node.data.epistemic)?.lift ?? 0.5;
const isGround = (node: TNode) =>
  node.data.kind === "note" || node.data.epistemic === "fact" || node.data.epistemic === "evidence";

const tintOf = (node: TNode, lens: Lens) => {
  if (lens === "risk") return RISK_RAMP[node.data.lenses.risk] ?? RISK_RAMP[0]!;
  if (lens === "scarcity") return SCARCITY_RAMP[node.data.lenses.scarcity] ?? SCARCITY_RAMP[0]!;
  return TYPE_HEX[node.data.kind] ?? "#1A1A1A";
};

/** A card is grounded when at least one neighbour is fact/evidence (either direction). */
function groundingIds(nodeId: string, nodes: TNode[], edges: TEdge[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .map((edge) => (edge.source === nodeId ? edge.target : edge.source))
    .map((id) => byId.get(id))
    .filter((n): n is TNode => !!n && isGround(n))
    .map((n) => n.id);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  let truncated = false;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) {
        truncated = true;
        break;
      }
    } else {
      line = next;
    }
  }
  if (!truncated && line && lines.length < maxLines) lines.push(line);
  else if (truncated && lines.length) lines[lines.length - 1] += "…";
  return lines.slice(0, maxLines);
}

function cardTexture(node: TNode, tint: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 620;
  canvas.height = 310;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 620, 310);
  ctx.strokeStyle = "#1A1A1A";
  ctx.lineWidth = 5;
  ctx.strokeRect(2.5, 2.5, 615, 305);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 16, 310);

  ctx.fillStyle = "#1A1A1A";
  ctx.font = "600 22px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(TYPE_INFO[node.data.kind].label.toUpperCase(), 42, 56);

  const status = node.data.epistemic.toUpperCase();
  ctx.font = "600 18px 'JetBrains Mono', ui-monospace, monospace";
  const chipWidth = ctx.measureText(status).width;
  ctx.strokeStyle = "#1A1A1A55";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 74, chipWidth + 24, 34);
  ctx.fillStyle = "#1A1A1A99";
  ctx.fillText(status, 54, 98);

  ctx.fillStyle = "#1A1A1A";
  ctx.font = "500 38px Fraunces, Georgia, serif";
  wrapLines(ctx, node.data.title, 520, 2).forEach((line, index) =>
    ctx.fillText(line, 42, 178 + index * 46),
  );

  ctx.fillStyle = "#1A1A1A55";
  ctx.font = "400 18px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`ALT ${Math.round(liftOf(node) * ALTITUDE)}`, 42, 284);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function layerTexture(label: string, count: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 96);
  ctx.fillStyle = "#1A1A1A";
  ctx.font = "700 30px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(label, 0, 42);
  ctx.fillStyle = "#1A1A1A66";
  ctx.font = "400 20px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`${count} CARD${count === 1 ? "" : "S"}`, 0, 76);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function StrataPage() {
  const nodes = useThread((s) => s.nodes);
  const edges = useThread((s) => s.edges);
  const ws = useWorkspaces();
  const active = ws.workspaces.find((w) => w.id === ws.activeId);
  const canvas = active?.document.canvases.find((c) => c.id === active.document.activeCanvasId);

  const mount = useRef<HTMLDivElement>(null);
  const rings = useRef<THREE.LineSegments[]>([]);
  /** Survives the lens rebuild so changing colour does not reset the camera. */
  const view = useRef<{ p: [number, number, number]; t: [number, number, number] } | null>(null);
  const [lens, setLens] = useState<Lens>("type");
  const [selected, setSelected] = useState<string | null>(null);

  const stats = useMemo(() => {
    const floating = nodes.filter((n) => liftOf(n) >= 0.6);
    const unsupported = floating.filter((n) => groundingIds(n.id, nodes, edges).length === 0);
    return {
      total: nodes.length,
      floating: floating.length,
      unsupported: unsupported.length,
      share: floating.length ? Math.round((unsupported.length / floating.length) * 100) : 0,
    };
  }, [nodes, edges]);

  const selectedNode = nodes.find((n) => n.id === selected) ?? null;

  // Rebuild the whole scene when the graph or lens changes; it is a read-only view.
  useEffect(() => {
    const host = mount.current;
    if (!host || !nodes.length) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#FDFBF7");
    scene.fog = new THREE.Fog("#FDFBF7", 90, 200);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    camera.position.set(0, 30, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 14;
    controls.maxDistance = 170;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    const disposables: { dispose: () => void }[] = [];
    const textures: THREE.Texture[] = [];
    const billboards: THREE.Object3D[] = [];

    // ── Floor ────────────────────────────────────────────────
    const grid = new THREE.GridHelper(220, 110, "#1A1A1A", "#1A1A1A");
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.12;
    scene.add(grid);

    // ── Layout: five shelves, one per epistemic status ───────
    const placed = new Map<string, THREE.Vector3>();
    const shelves: { label: string; y: number; width: number; count: number }[] = [];

    for (const layer of LAYERS) {
      const cards = nodes.filter((n) => n.data.epistemic === layer.key);
      const rows = Math.max(1, Math.ceil(cards.length / ROW_LIMIT));
      const y = layer.lift * ALTITUDE + 1;

      cards.forEach((node, index) => {
        const row = Math.floor(index / ROW_LIMIT);
        const inRow = Math.min(ROW_LIMIT, cards.length - row * ROW_LIMIT);
        const column = index % ROW_LIMIT;
        placed.set(
          node.id,
          new THREE.Vector3(
            (column - (inRow - 1) / 2) * STEP_X,
            y,
            (row - (rows - 1) / 2) * STEP_Z,
          ),
        );
      });

      shelves.push({
        label: layer.label,
        y,
        width: Math.min(Math.max(cards.length, 1), ROW_LIMIT) * STEP_X,
        count: cards.length,
      });
    }

    // ── Shelf planes + labels ────────────────────────────────
    for (const shelf of shelves) {
      if (!shelf.count) continue;

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(shelf.width + 1.4, 1.9),
        new THREE.MeshBasicMaterial({
          color: "#1A1A1A",
          transparent: true,
          opacity: 0.045,
          side: THREE.DoubleSide,
        }),
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(0, shelf.y - CARD_H / 2 - 0.12, 0);
      scene.add(plane);
      disposables.push(plane.geometry, plane.material);

      const texture = layerTexture(shelf.label, shelf.count);
      if (!texture) continue;
      textures.push(texture);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 0.68),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
      );
      label.position.set(-(shelf.width / 2) - 2.6, shelf.y, 0);
      scene.add(label);
      billboards.push(label);
      disposables.push(label.geometry, label.material);
    }

    // ── Cards ────────────────────────────────────────────────
    const cardMeshes: THREE.Mesh[] = [];
    const frames: THREE.LineSegments[] = [];
    const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H);
    disposables.push(geometry);

    for (const node of nodes) {
      const position = placed.get(node.id);
      if (!position) continue;

      const texture = cardTexture(node, tintOf(node, lens));
      if (!texture) continue;
      textures.push(texture);

      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData["nodeId"] = node.id;
      scene.add(mesh);
      cardMeshes.push(mesh);
      billboards.push(mesh);
      disposables.push(material);

      const ringGeometry = new THREE.EdgesGeometry(
        new THREE.PlaneGeometry(CARD_W + 0.2, CARD_H + 0.2),
      );
      const frame = new THREE.LineSegments(
        ringGeometry,
        new THREE.LineBasicMaterial({ color: "#1A4BFF" }),
      );
      frame.position.copy(position);
      frame.visible = false;
      frame.userData["nodeId"] = node.id;
      scene.add(frame);
      frames.push(frame);
      billboards.push(frame);
      disposables.push(ringGeometry, frame.material as THREE.Material);
    }

    // ── Cords: grounding lines and dangling threads ──────────
    const drawn = new Set<string>();

    for (const node of nodes) {
      if (liftOf(node) < 0.2) continue;
      const from = placed.get(node.id);
      if (!from) continue;

      const grounds = groundingIds(node.id, nodes, edges);
      if (grounds.length) {
        for (const groundId of grounds) {
          const key = `${node.id}:${groundId}`;
          if (drawn.has(key)) continue;
          drawn.add(key);
          const to = placed.get(groundId);
          if (!to) continue;

          const mid = from.clone().add(to).multiplyScalar(0.5);
          mid.y -= Math.max(0.5, from.distanceTo(to) * 0.2);
          const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
          const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
          const line = new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({ color: "#1A4BFF", transparent: true, opacity: 0.4 }),
          );
          scene.add(line);
          disposables.push(geo, line.material as THREE.Material);
        }
      } else {
        // Nothing holds it up: a thread straight down to the bedrock.
        const curve = new THREE.CatmullRomCurve3(
          [from.clone(), new THREE.Vector3(from.x, 0.05, from.z)],
          false,
          "catmullrom",
          0.4,
        );
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(14));
        const line = new THREE.Line(
          geo,
          new THREE.LineDashedMaterial({
            color: "#C1121F",
            dashSize: 0.45,
            gapSize: 0.45,
            transparent: true,
            opacity: 0.3,
          }),
        );
        line.computeLineDistances();
        scene.add(line);
        disposables.push(geo, line.material as THREE.Material);
      }
    }

    // ── Camera: fit the whole board, portrait included ───────
    const box = new THREE.Box3();
    placed.forEach((point) => box.expandByPoint(point));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    camera.aspect = (host.clientWidth || 1) / (host.clientHeight || 1);
    camera.updateProjectionMatrix();

    const vFov = (camera.fov * Math.PI) / 180;
    const fitHeight = Math.max(size.y, 4) / 2 / Math.tan(vFov / 2);
    const fitWidth = Math.max(size.x, 10) / 2 / (Math.tan(vFov / 2) * Math.max(camera.aspect, 0.4));
    const distance = Math.max(fitHeight, fitWidth) * 1.35;

    if (view.current) {
      camera.position.fromArray(view.current.p);
      controls.target.fromArray(view.current.t);
    } else {
      camera.position.set(center.x, center.y + distance * 0.55, center.z + distance * 0.95);
      controls.target.copy(center);
    }
    controls.update();

    // ── Picking ──────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt = { x: 0, y: 0 };

    const onPointerDown = (event: PointerEvent) => {
      downAt = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(cardMeshes, false)[0];
      setSelected(hit ? (hit.object.userData["nodeId"] as string) : null);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // ── Resize ───────────────────────────────────────────────
    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    // ── Loop ─────────────────────────────────────────────────
    let raf = 0;
    rings.current = frames;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      controls.update();
      for (const item of billboards) item.quaternion.copy(camera.quaternion);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      view.current = {
        p: camera.position.toArray() as [number, number, number],
        t: controls.target.toArray() as [number, number, number],
      };
      rings.current = [];
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      textures.forEach((texture) => texture.dispose());
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
      scene.clear();
    };
  }, [nodes, edges, lens]);

  // The selection ring follows local state; the scene is not rebuilt for it.
  useEffect(() => {
    for (const ring of rings.current) ring.visible = ring.userData["nodeId"] === selected;
  }, [selected, lens]);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#FDFBF7] text-[#1A1A1A]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b-2 border-[#1A1A1A] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/app"
            className="flex shrink-0 items-center gap-1.5 border-2 border-[#1A1A1A] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-[#1A1A1A] hover:text-[#FDFBF7]"
          >
            <ArrowLeft className="h-3 w-3" /> Workspace
          </Link>
          <div className="min-w-0">
            <div className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
              Strata <span className="text-[#1A4BFF]">//</span> epistemic altitude
            </div>
            <div className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/40">
              {canvas?.title ?? "Canvas"} · {stats.total} cards
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-[#1A1A1A]/20 p-0.5">
            {(["type", "risk", "scarcity"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLens(option)}
                aria-pressed={lens === option}
                className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                  lens === option ? "bg-[#1A1A1A] text-[#FDFBF7]" : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="border-2 border-[#C1121F] px-2 py-1 text-right">
            <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#C1121F]/70">unsupported</div>
            <div className="font-mono text-[11px] font-bold text-[#C1121F]">
              {stats.share}% <span className="font-normal opacity-60">of {stats.floating}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={mount} className="absolute inset-0" />

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <p className="font-display text-2xl">Nothing to survey yet.</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">
              Add a few cards to the canvas, then come back.
            </p>
          </div>
        )}

        {/* legend */}
        <div className="pointer-events-none absolute bottom-3 left-3 border border-[#1A1A1A]/20 bg-[#FDFBF7]/90 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/50">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-[#1A4BFF]" /> grounded
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-px w-6 border-t border-dashed border-[#C1121F]" /> dangling
          </div>
          <div className="mt-1 text-[#1A1A1A]/35">drag to orbit · scroll to zoom · click a card</div>
        </div>

        {selectedNode && (
          <aside className="absolute right-3 top-3 w-[300px] max-w-[calc(100%-24px)] border-2 border-[#1A1A1A] bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A4BFF]">
                {TYPE_INFO[selectedNode.data.kind].label} · {selectedNode.data.epistemic}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close card"
                className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <h2 className="mt-1 font-display text-lg leading-tight">{selectedNode.data.title}</h2>
            {selectedNode.data.body && (
              <p className="mt-2 max-h-32 overflow-y-auto text-xs leading-relaxed text-[#1A1A1A]/60">
                {selectedNode.data.body}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-[#1A1A1A]/10 pt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/40">
              <span>altitude {Math.round(liftOf(selectedNode) * ALTITUDE)}</span>
              <span>
                {groundingIds(selectedNode.id, nodes, edges).length
                  ? `${groundingIds(selectedNode.id, nodes, edges).length} ground${
                      groundingIds(selectedNode.id, nodes, edges).length === 1 ? "" : "s"
                    }`
                  : "no support"}
              </span>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
