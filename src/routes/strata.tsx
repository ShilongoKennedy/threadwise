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

/** Altitude in the strata, 0 = bedrock (fact) … 1 = unanchored (unknown). */
const LIFT: Record<string, number> = {
  fact: 0,
  evidence: 0.18,
  assumption: 0.62,
  hypothesis: 0.82,
  unknown: 1,
};

const ALTITUDE = 9;
const CARD_W = 3.6;
const CARD_H = 1.8;

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

const liftOf = (node: TNode) => LIFT[node.data.epistemic] ?? 0.5;
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
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines);
}

function cardTexture(node: TNode, tint: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 640, 320);
  ctx.strokeStyle = "#1A1A1A";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 634, 314);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 18, 320);

  ctx.fillStyle = "#1A1A1A";
  ctx.font = "600 24px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(TYPE_INFO[node.data.kind].label.toUpperCase(), 44, 62);

  ctx.font = "600 20px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillStyle = "#1A1A1A80";
  const status = node.data.epistemic.toUpperCase();
  const width = ctx.measureText(status).width;
  ctx.strokeStyle = "#1A1A1A40";
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 84, width + 28, 40);
  ctx.fillText(status, 58, 112);

  ctx.fillStyle = "#1A1A1A";
  ctx.font = "500 42px Fraunces, Georgia, serif";
  const lines = wrapLines(ctx, node.data.title, 540, 3);
  lines.forEach((line, index) => ctx.fillText(line, 44, 190 + index * 50));

  ctx.fillStyle = "#1A1A1A66";
  ctx.font = "400 20px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`y ${(liftOf(node) * ALTITUDE).toFixed(1)}`, 44, 296);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
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
    scene.fog = new THREE.Fog("#FDFBF7", 70, 140);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    camera.position.set(0, 24, 46);
    /** Pull back far enough that the whole board fits, whatever the aspect. */
    const frameBoard = () => {
      const board = 54;
      const vFov = (camera.fov * Math.PI) / 180;
      const vertical = board / 2 / Math.tan(vFov / 2);
      const horizontal = vertical / Math.max(camera.aspect, 0.35);
      const distance = Math.max(vertical, horizontal) * 1.02;
      camera.position.set(0, distance * 0.62, distance * 0.86);
    };

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 4, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 16;
    controls.maxDistance = 110;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.update();

    const disposables: { dispose: () => void }[] = [];
    const textures: THREE.Texture[] = [];

    // ── Floor ────────────────────────────────────────────────
    const grid = new THREE.GridHelper(120, 60, "#1A1A1A", "#1A1A1A");
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.1;
    scene.add(grid);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshBasicMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.6 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);
    disposables.push(ground.geometry, ground.material);

    // ── Layout: preserve the canvas arrangement, normalise to a ~46-unit box ──
    const xs = nodes.map((n) => n.position.x);
    const zs = nodes.map((n) => n.position.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 400);
    const scale = 46 / span;

    const placed = new Map<string, THREE.Vector3>();
    for (const node of nodes) {
      placed.set(
        node.id,
        new THREE.Vector3(
          (node.position.x - cx) * scale,
          liftOf(node) * ALTITUDE + 1,
          (node.position.y - cz) * scale,
        ),
      );
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
      disposables.push(material);

      const ringGeometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(CARD_W + 0.22, CARD_H + 0.22));
      const frame = new THREE.LineSegments(
        ringGeometry,
        new THREE.LineBasicMaterial({ color: "#1A4BFF" }),
      );
      disposables.push(ringGeometry, frame.material as THREE.Material);
      frame.position.copy(position);
      frame.visible = false;
      frame.userData["nodeId"] = node.id;
      scene.add(frame);
      frames.push(frame);
    }

    // ── Cords: grounding lines and dangling threads ──────────
    const byId = new Map(nodes.map((n) => [n.id, n]));
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
          mid.y -= Math.max(0.6, from.distanceTo(to) * 0.22);
          const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
          const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
          const line = new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({ color: "#1A4BFF", transparent: true, opacity: 0.45 }),
          );
          scene.add(line);
          disposables.push(geo, line.material as THREE.Material);
        }
      } else {
        // Nothing holds it up: a thread straight down to the floor.
        const points = [from.clone(), new THREE.Vector3(from.x, 0.02, from.z)];
        const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(16));
        const line = new THREE.Line(
          geo,
          new THREE.LineDashedMaterial({
            color: "#C1121F",
            dashSize: 0.5,
            gapSize: 0.5,
            transparent: true,
            opacity: 0.35,
          }),
        );
        line.computeLineDistances();
        scene.add(line);
        disposables.push(geo, line.material as THREE.Material);
      }
    }

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
    if (view.current) {
      camera.position.fromArray(view.current.p);
      controls.target.fromArray(view.current.t);
    } else {
      frameBoard();
      controls.target.set(0, 5, 0);
    }
    controls.update();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    // ── Loop ─────────────────────────────────────────────────
    let raf = 0;
    rings.current = frames;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      controls.update();
      for (const mesh of cardMeshes) mesh.quaternion.copy(camera.quaternion);
      for (const frame of frames) frame.quaternion.copy(camera.quaternion);
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
              <span>altitude {(liftOf(selectedNode) * ALTITUDE).toFixed(1)}</span>
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
