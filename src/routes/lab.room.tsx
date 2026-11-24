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

const DOOR_POINT: [number, number, number] = [2.4, 0.12, -5.6];

function ReadingRoom() {
  const stageRef = useRef<HTMLDivElement>(null);
  const labels = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selected, setSelected] = useState<Note | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [sound, setSound] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const focusRef = useRef<((point: [number, number, number]) => void) | null>(null);
  const doorOpenRef = useRef<(() => void) | null>(null);
  const doorLabelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let cleanup: (() => void) | null = null;
    const stage = stageRef.current;
    if (!stage) return;

    const view = { yaw: 0.2, pitch: -0.02, dragging: false, x: 0, y: 0 };
    let tween: { fromYaw: number; toYaw: number; fromPitch: number; toPitch: number; start: number } | null = null;
    let doorTarget = 0;
    let leftDoor: import("three").Object3D | null = null;
    let rightDoor: import("three").Object3D | null = null;
    const onDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("button, a")) return;
      tween = null;
      setEngaged(true);
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
    focusRef.current = (point) => {
      const [x, y, z] = point;
      tween = {
        fromYaw: view.yaw,
        toYaw: Math.atan2(-x, -z),
        fromPitch: view.pitch,
        toPitch: Math.atan2(y, Math.hypot(x, z)),
        start: performance.now(),
      };
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

        scenes: {
          // An authored installation in the photographed room: a real 3D double door.
          const frame = new THREE.Group();
          const dark = new THREE.MeshStandardMaterial({ color: 0x171b1c, roughness: 0.48, metalness: 0.25, envMapIntensity: 0.7 });
          const cream = new THREE.MeshStandardMaterial({ color: 0xe8dfce, roughness: 0.62, metalness: 0.05, envMapIntensity: 0.45 });
          const gold = new THREE.MeshStandardMaterial({ color: 0xa88445, roughness: 0.3, metalness: 0.8, envMapIntensity: 0.8 });

          const portalCanvas = document.createElement("canvas");
          portalCanvas.width = 1024;
          portalCanvas.height = 1400;
          const ctx = portalCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#f1e7d2";
            ctx.fillRect(0, 0, 1024, 1400);
            ctx.fillStyle = "#171b1c";
            ctx.fillRect(0, 0, 1024, 12);
            ctx.font = "600 54px Georgia, serif";
            ctx.fillText("THE ANNEX", 92, 220);
            ctx.font = "400 36px Georgia, serif";
            ctx.fillText("No finding has", 92, 320);
            ctx.fillText("been quoted.", 92, 374);
            ctx.fillStyle = "#6b542d";
            ctx.font = "500 22px monospace";
            ctx.fillText("A PUBLISHED FINDING / THE TEST", 92, 1120);
          }
          const portalTexture = new THREE.CanvasTexture(portalCanvas);
          portalTexture.colorSpace = THREE.SRGBColorSpace;
          const portal = new THREE.Mesh(
            new THREE.PlaneGeometry(1.78, 2.45),
            new THREE.MeshBasicMaterial({ map: portalTexture }),
          );
          portal.position.z = -0.14;
          frame.add(portal);

          const leftPivot = new THREE.Group();
          leftPivot.position.set(-0.91, 0, 0);
          const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.39, 0.08), cream);
          leftPanel.position.set(0.45, 0, 0.02);
          leftPivot.add(leftPanel);
          const rightPivot = new THREE.Group();
          rightPivot.position.set(0.91, 0, 0);
          const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.39, 0.08), cream);
          rightPanel.position.set(-0.45, 0, 0.02);
          rightPivot.add(rightPanel);
          frame.add(leftPivot, rightPivot);

          const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.28), dark);
          top.position.y = 1.3;
          const bottom = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.28), dark);
          bottom.position.y = -1.3;
          const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.7, 0.28), dark);
          leftSide.position.x = -1.0;
          const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.7, 0.28), dark);
          rightSide.position.x = 1.0;
          frame.add(top, bottom, leftSide, rightSide);

          const handleL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), gold);
          handleL.position.set(-0.12, 0, 0.1);
          const handleR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), gold);
          handleR.position.set(0.12, 0, 0.1);
          frame.add(handleL, handleR);

          const base = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.1, 0.8), dark);
          base.position.y = -1.39;
          frame.add(base);
          frame.position.set(...DOOR_POINT);
          frame.scale.setScalar(1.18);
          frame.lookAt(0, 0, 0);
          scene.add(frame);
          leftDoor = leftPivot;
          rightDoor = rightPivot;
        }

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
          const doorNode = doorLabelRef.current;
          if (doorNode) {
            point.set(...DOOR_POINT);
            const facing = dir.dot(point.clone().normalize()) > 0.03;
            point.project(camera);
            doorNode.style.left = `${Math.max(6, Math.min(94, (point.x * 0.5 + 0.5) * 100))}%`;
            doorNode.style.top = `${Math.max(15, Math.min(85, (-point.y * 0.5 + 0.5) * 100))}%`;
            doorNode.style.opacity = facing ? "1" : "0";
            doorNode.style.pointerEvents = facing ? "auto" : "none";
          }
        };

        const animate = () => {
          if (!alive || !renderer) return;
          if (leftDoor && rightDoor) {
            const leftTarget = -1.28 * doorTarget;
            const rightTarget = 1.28 * doorTarget;
            leftDoor.rotation.y += (leftTarget - leftDoor.rotation.y) * 0.07;
            rightDoor.rotation.y += (rightTarget - rightDoor.rotation.y) * 0.07;
          }
          if (tween) {
            const progress = Math.min(1, (performance.now() - tween.start) / 760);
            const eased = 1 - Math.pow(1 - progress, 3);
            view.yaw = tween.fromYaw + (tween.toYaw - tween.fromYaw) * eased;
            view.pitch = tween.fromPitch + (tween.toPitch - tween.fromPitch) * eased;
            if (progress >= 1) tween = null;
          }
          updateLabels();
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(animate);
        };
        animate();
        doorOpenRef.current = () => { doorTarget = 1; };
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
      focusRef.current = null;
      doorOpenRef.current = null;
    };
  }, []);

  const playTone = (frequency: number, duration = 0.12) => {
    if (!sound) return;
    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      if (context.state === "suspended") void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration + 0.02);
    } catch {
      // Sound is an enhancement, never a requirement.
    }
  };

  const openNote = (note: Note) => {
    setSelected(note);
    setEngaged(true);
    setVisited((current) => current.includes(note.id) ? current : [...current, note.id]);
    focusRef.current?.(note.point);
    playTone(470 + Number(note.n) * 38);
  };

  const openDoor = () => {
    setDoorOpen(true);
    setEngaged(true);
    focusRef.current?.(DOOR_POINT);
    doorOpenRef.current?.();
    playTone(300, 0.2);
  };

  const resetRoom = () => {
    setSelected(null);
    setVisited([]);
    setEngaged(false);
  };

  const complete = visited.length === NOTES.length;

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
        <button type="button" className="room-sound" onClick={() => { setSound((value) => !value); playTone(620); }} aria-pressed={sound}>
          {sound ? "Sound on" : "Sound off"}
        </button>
        <Link to="/analyst" className="room-nav__enter">Enter the desk <span aria-hidden="true">↗</span></Link>
      </header>

      <main
        ref={stageRef}
        className={`room-stage ${ready ? "is-ready" : ""}`}
        style={{ backgroundImage: "url('/lab/solitude-preview.webp')" }}
      >
        <div className={`room-veil ${ready ? "is-ready" : ""}`} aria-hidden="true"><span>Entering the room</span></div>
        {!ready && !failed ? <div className="room-loading">entering the room</div> : null}
        {failed ? <div className="room-loading room-loading--failed">The room could not load in 3D.</div> : null}

        <button
          type="button"
          ref={doorLabelRef}
          onClick={openDoor}
          className={`room-door ${doorOpen ? "is-open is-hidden" : ""}`}
          aria-label="Open the annex door"
        >
          <span className="room-door__n">06</span>
          <span className="room-door__label">{doorOpen ? "The annex" : "The door"}</span>
          <span className="room-door__line" aria-hidden="true" />
        </button>

        {NOTES.map((note) => (
          <button
            key={note.id}
            type="button"
            ref={(node) => { labels.current[note.id] = node; }}
            onClick={() => openNote(note)}
            className={`room-note room-note--${note.id} ${selected?.id === note.id ? "is-active" : ""}`}
            aria-label={`Open note: ${note.title}`}
          >
            <span className="room-note__n">{note.n}</span>
            <span className="room-note__label">{note.label}</span>
            <span className="room-note__line" aria-hidden="true" />
          </button>
        ))}

        <section className={`room-intro ${engaged ? "is-engaged" : ""}`}>
          <p className="room-kicker">A room for the sentence you cannot settle</p>
          <h1>The room is the reading.</h1>
          <p className="room-intro__body">Drag to look around. Open the notes placed in the room.</p>
        </section>

        <div className="room-hint">
          <span>Drag to look</span>
          <nav className="room-map" aria-label="Notes in the room">
            {NOTES.map((note) => (
              <button key={note.id} type="button" onClick={() => openNote(note)} className={`${selected?.id === note.id ? "is-active" : ""} ${visited.includes(note.id) ? "is-visited" : ""}`} aria-label={note.label}>
                <span>{note.n}</span>
              </button>
            ))}
          </nav>
          <button type="button" className="room-door-prompt" onClick={openDoor}>
            {doorOpen ? "The annex is open" : "Open the door"} <span aria-hidden="true">↗</span>
          </button>
          <span>Not a verdict / a place to look</span>
        </div>

        {doorOpen ? (
          <aside className="room-door-note">
            <p>The door is open.</p>
            <span>A named finding or the published annex is the test. Everything else is a room for the question.</span>
            <Link to="/analyst">Put a source through it <span aria-hidden="true">↗</span></Link>
          </aside>
        ) : null}

        {selected ? (
          <aside className="room-caption" aria-live="polite">
            <button type="button" className="room-caption__close" onClick={() => setSelected(null)} aria-label="Close note">×</button>
            <p className="room-caption__kicker"><span>{selected.n}</span>{selected.label}</p>
            <h2>{selected.title}</h2>
            <p>{selected.body}</p>
            <div className="room-caption__foot"><span>{selected.source}</span><span>Threadwise / reading room</span></div>
          </aside>
        ) : complete ? (
          <section className="room-final">
            <p className="room-final__kicker">The room is read / five notes</p>
            <h2>The report exists.<br />The finding does not.</h2>
            <p>What remains is not a verdict. It is a short reading of what the record can actually support.</p>
            <div className="room-final__actions">
              <Link to="/analyst">Put a source in the room <span aria-hidden="true">↗</span></Link>
              <button type="button" onClick={resetRoom}>Look again</button>
            </div>
          </section>
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
