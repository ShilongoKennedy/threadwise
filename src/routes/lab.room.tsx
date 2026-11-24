import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/lab/room")({
  head: () => ({
    meta: [
      { title: "The reading room — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReadingRoom,
});

const NOTES = [
  {
    id: "claim", n: "01", label: "The claim", title: "A report raised concerns.",
    body: "A confidential briefing is said to have raised concerns about Iran’s enrichment programme. It has not been published. No figure, site or finding from it has been quoted.",
    source: "The move / supplied briefing",
    point: [0, 0.4, -8] as [number, number, number],
  },
  {
    id: "record", n: "02", label: "The record", title: "What is actually public.",
    body: "Six reports repeat the same central fact: a briefing exists and has raised concerns. Repetition is not corroboration. The document itself remains out of sight.",
    source: "News record / six dated reports",
    point: [-5.2, 0.1, -6.4] as [number, number, number],
  },
  {
    id: "gap", n: "03", label: "The gap", title: "The leap from concerns to capability.",
    body: "‘Concerns’ can mean a capability, an intention, an access problem, or a political judgement. The sentence does not say which. That ambiguity is the real seam in the story.",
    source: "Language / the unstated referent",
    point: [4.9, -0.8, -6.6] as [number, number, number],
  },
  {
    id: "test", n: "04", label: "The test", title: "Publish the annex.",
    body: "A named site, a measured quantity, or a quoted finding would settle the question. Until one appears, the honest position is not ‘nothing happened’ but ‘the record does not say’.",
    source: "Falsifier / the document",
    point: [2.5, 1.7, -7.8] as [number, number, number],
  },
  {
    id: "actors", n: "05", label: "The actors", title: "Who wants the room to hear it?",
    body: "Officials, member states and the Agency each have a different reason to describe the briefing in public. A leak is also a move. Ask who gains from the timing being read as a signal.",
    source: "Incentives / not established",
    point: [-2.8, 1.5, -8.2] as [number, number, number],
  },
] as const;

type Note = (typeof NOTES)[number];

function ReadingRoom() {
  const stageRef = useRef<HTMLDivElement>(null);
  const labels = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selected, setSelected] = useState<Note | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let cleanup: (() => void) | null = null;
    const stage = stageRef.current;
    if (!stage) return;

    const view = { yaw: 0.2, pitch: -0.02, dragging: false, x: 0, y: 0 };
    const onDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("button, a")) return;
      view.dragging = true;
      view.x = event.clientX;
      view.y = event.clientY;
      stage.setPointerCapture?.(event.pointerId);
      stage.classList.add("is-dragging");
    };
    const onMove = (event: PointerEvent) => {
      if (!view.dragging) return;
      view.yaw -= (event.clientX - view.x) * 0.0045;
      view.pitch = Math.max(-0.8, Math.min(0.8, view.pitch + (event.clientY - view.y) * 0.0035));
      view.x = event.clientX;
      view.y = event.clientY;
    };
    const onUp = () => {
      view.dragging = false;
      stage.classList.remove("is-dragging");
    };
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const boot = async () => {
      try {
        const THREE = await import("three");
        const { RGBELoader } = await import("three/examples/jsm/loaders/RGBELoader.js");
        if (!alive) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 100);
        camera.rotation.order = "YXZ";
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.92;
        stage.appendChild(renderer.domElement);

        const texture = await new RGBELoader().loadAsync("/lab/solitude.hdr");
        if (!alive) return;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
        scene.backgroundIntensity = 1;

        const resize = () => {
          if (!renderer) return;
          const rect = stage.getBoundingClientRect();
          camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
          camera.updateProjectionMatrix();
          renderer.setSize(rect.width, rect.height, false);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(stage);

        const projected = new THREE.Vector3();
        const dir = new THREE.Vector3();
        const point = new THREE.Vector3();
        const updateLabels = () => {
          camera.rotation.y = view.yaw;
          camera.rotation.x = view.pitch;
          dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
          for (const note of NOTES) {
            const node = labels.current[note.id];
            if (!node) continue;
            point.set(...note.point);
            const facing = dir.dot(point.clone().normalize()) > 0.16;
            point.project(camera);
            const left = Math.max(6, Math.min(94, (point.x * 0.5 + 0.5) * 100));
            const top = Math.max(14, Math.min(86, (-point.y * 0.5 + 0.5) * 100));
            node.style.left = `${left}%`;
            node.style.top = `${top}%`;
            node.style.opacity = facing ? "1" : "0";
            node.style.pointerEvents = facing ? "auto" : "none";
          }
        };

        const animate = () => {
          if (!alive || !renderer) return;
          updateLabels();
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(animate);
        };
        animate();
        setReady(true);

        cleanup = () => {
          ro.disconnect();
          texture.dispose();
          renderer?.dispose();
          if (renderer?.domElement.parentElement === stage) stage.removeChild(renderer.domElement);
          renderer = null;
        };
      } catch {
        if (alive) setFailed(true);
      }
    };
    void boot();

    return () => {
      alive = false;
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, []);

  return (
    <div className="room-lab">
      <header className="room-nav">
        <Link to="/" className="room-brand">THREADWISE</Link>
        <span className="room-nav__label">The reading room / 001</span>
        <nav aria-label="The desk">
          <Link to="/analyst">Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">Anatomy</Link>
        </nav>
        <Link to="/analyst" className="room-nav__enter">Enter the desk <span aria-hidden="true">↗</span></Link>
      </header>

      <main
        ref={stageRef}
        className={`room-stage ${ready ? "is-ready" : ""}`}
        style={failed ? { backgroundImage: "url('/lab/solitude-preview.webp')" } : undefined}
      >
        {!ready && !failed ? <div className="room-loading">entering the room</div> : null}
        {failed ? <div className="room-loading room-loading--failed">The room could not load in 3D.</div> : null}

        {NOTES.map((note) => (
          <button
            key={note.id}
            type="button"
            ref={(node) => { labels.current[note.id] = node; }}
            onClick={() => setSelected(note)}
            className={`room-note room-note--${note.id}`}
            aria-label={`Open note: ${note.title}`}
          >
            <span className="room-note__n">{note.n}</span>
            <span className="room-note__label">{note.label}</span>
            <span className="room-note__line" aria-hidden="true" />
          </button>
        ))}

        <section className="room-intro">
          <p className="room-kicker">A room for the sentence you cannot settle</p>
          <h1>The room is the reading.</h1>
          <p className="room-intro__body">Drag to look around. Open the notes placed in the room.</p>
        </section>

        <div className="room-hint">
          <span>Drag to look</span>
          <span>Open a note</span>
          <span>Not a verdict / a place to look</span>
        </div>

        {selected ? (
          <aside className="room-caption" aria-live="polite">
            <button type="button" className="room-caption__close" onClick={() => setSelected(null)} aria-label="Close note">×</button>
            <p className="room-caption__kicker"><span>{selected.n}</span>{selected.label}</p>
            <h2>{selected.title}</h2>
            <p>{selected.body}</p>
            <div className="room-caption__foot"><span>{selected.source}</span><span>Threadwise / reading room</span></div>
          </aside>
        ) : null}
      </main>

      <footer className="room-foot">
        <span>Room: Greg Zaal / Poly Haven · CC0</span>
        <span>Reading room / 001</span>
        <span>Threadwise / 2026</span>
      </footer>
    </div>
  );
}
