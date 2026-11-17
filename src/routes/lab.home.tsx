import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/lab/home")({
  head: () => ({
    meta: [
      { title: "Earth — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CosmicHome,
});

function EarthScene({ progress }: { progress: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let cleanup: (() => void) | null = null;
    const mount = mountRef.current;
    if (!mount) return;

    const boot = async () => {
      try {
        const THREE = await import("three");
        if (!alive) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
        camera.position.set(0, 0, 4.5);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.1));
        const key = new THREE.DirectionalLight(0xfff7ec, 3.6);
        key.position.set(-4, 3, 5);
        scene.add(key);
        const rim = new THREE.PointLight(0x7cb2ff, 18, 18, 2);
        rim.position.set(3, 1, 3);
        scene.add(rim);

        const group = new THREE.Group();
        group.rotation.z = 0.409;
        scene.add(group);

        const loader = new THREE.TextureLoader();
        const [earthMap, cloudMap] = await Promise.all([
          loader.loadAsync("/lab/earth.jpg"),
          loader.loadAsync("/lab/clouds.png"),
        ]);
        if (!alive) return;
        earthMap.colorSpace = THREE.SRGBColorSpace;
        cloudMap.colorSpace = THREE.SRGBColorSpace;

        const earth = new THREE.Mesh(
          new THREE.SphereGeometry(1, 128, 96),
          new THREE.MeshStandardMaterial({ map: earthMap, roughness: 0.9, metalness: 0 }),
        );
        group.add(earth);

        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(1.009, 128, 96),
          new THREE.MeshStandardMaterial({
            map: cloudMap,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            roughness: 1,
          }),
        );
        group.add(clouds);

        const atmosphere = new THREE.Mesh(
          new THREE.SphereGeometry(1.045, 80, 60),
          new THREE.MeshBasicMaterial({
            color: 0x8cc8ff,
            transparent: true,
            opacity: 0.085,
            side: THREE.BackSide,
            depthWrite: false,
          }),
        );
        group.add(atmosphere);

        const resize = () => {
          if (!renderer) return;
          const rect = mount.getBoundingClientRect();
          camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
          camera.updateProjectionMatrix();
          renderer.setSize(rect.width, rect.height, false);
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(mount);

        const base = 3.8;
        const animate = () => {
          if (!alive || !renderer) return;
          const target = base + progressRef.current * Math.PI * 2.25;
          earth.rotation.y += (target - earth.rotation.y) * 0.07 + 0.00025;
          clouds.rotation.y = earth.rotation.y * 1.015;
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(animate);
        };
        animate();
        setState("ready");

        cleanup = () => {
          observer.disconnect();
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          earthMap.dispose();
          cloudMap.dispose();
          renderer?.dispose();
          if (renderer?.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
          renderer = null;
        };
      } catch {
        if (alive) setState("failed");
      }
    };
    void boot();

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, []);

  return (
    <div className="cosmic-globe" ref={mountRef} aria-hidden="true">
      {state === "loading" ? <span className="cosmic-loading">Loading Earth…</span> : null}
      {state === "failed" ? <span className="cosmic-loading">3D unavailable.</span> : null}
    </div>
  );
}

type ObjectKind = "lens" | "rings" | "compass" | "book";

function SectionObject({ kind }: { kind: ObjectKind }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let cleanup: (() => void) | null = null;
    const mount = mountRef.current;
    if (!mount) return;

    const boot = async () => {
      try {
        const THREE = await import("three");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (!alive) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0, 6.25);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        mount.appendChild(renderer.domElement);

        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = new RoomEnvironment();
        const envTarget = pmrem.fromScene(environment, 0.04);
        scene.environment = envTarget.texture;
        scene.environmentIntensity = 1.05;
        pmrem.dispose();

        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const key = new THREE.DirectionalLight(0xfff8ed, 3.1);
        key.position.set(-4, 4, 5);
        scene.add(key);
        const fill = new THREE.PointLight(0xa8cfff, 7, 20, 2);
        fill.position.set(4, -1, 3);
        scene.add(fill);

        const brushCanvas = document.createElement("canvas");
        brushCanvas.width = 256;
        brushCanvas.height = 256;
        const brushContext = brushCanvas.getContext("2d");
        if (brushContext) {
          brushContext.fillStyle = "#a6a6a6";
          brushContext.fillRect(0, 0, 256, 256);
          for (let i = 0; i < 900; i += 1) {
            const shade = 90 + Math.floor(Math.random() * 100);
            brushContext.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.12 + Math.random() * 0.28})`;
            brushContext.lineWidth = Math.random() > 0.8 ? 1.4 : 0.45;
            const y = Math.random() * 256;
            brushContext.beginPath();
            brushContext.moveTo(0, y);
            brushContext.lineTo(256, y + (Math.random() - 0.5) * 2);
            brushContext.stroke();
          }
        }
        const brushTexture = new THREE.CanvasTexture(brushCanvas);
        brushTexture.wrapS = THREE.RepeatWrapping;
        brushTexture.wrapT = THREE.RepeatWrapping;
        brushTexture.repeat.set(2, 2);

        const navy = new THREE.MeshStandardMaterial({ color: 0x173447, roughness: 0.28, metalness: 0.82, roughnessMap: brushTexture, bumpMap: brushTexture, bumpScale: 0.008, envMapIntensity: 1.15 });
        const cobalt = new THREE.MeshStandardMaterial({ color: 0x2b5877, roughness: 0.32, metalness: 0.58, roughnessMap: brushTexture, envMapIntensity: 1.2 });
        const steel = new THREE.MeshStandardMaterial({ color: 0xb8c8d1, roughness: 0.2, metalness: 1, roughnessMap: brushTexture, bumpMap: brushTexture, bumpScale: 0.006, envMapIntensity: 1.25 });
        const cream = new THREE.MeshStandardMaterial({ color: 0xeee9dc, roughness: 0.88, metalness: 0, envMapIntensity: 0.5 });
        const acid = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, roughness: 0.28, metalness: 0.65, envMapIntensity: 1.1 });
        const glass = new THREE.MeshPhysicalMaterial({
          color: 0xdfeef6,
          roughness: 0.04,
          metalness: 0,
          transmission: 1,
          thickness: 0.28,
          ior: 1.46,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
          envMapIntensity: 1.4,
        });

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = 512;
        pageCanvas.height = 1024;
        const context = pageCanvas.getContext("2d");
        if (context) {
          context.fillStyle = "#eee9dc";
          context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          context.fillStyle = "rgba(45, 52, 49, 0.55)";
          for (let y = 38; y < pageCanvas.height - 30; y += 14) {
            let x = 54;
            const end = 440 + Math.floor(Math.random() * 26);
            while (x < end) {
              const width = 9 + Math.random() * 28;
              context.fillRect(x, y, Math.min(width, end - x), 2);
              x += width + 5;
            }
          }
          context.fillStyle = "rgba(45, 52, 49, 0.22)";
          context.fillRect(pageCanvas.width / 2 - 1, 0, 2, pageCanvas.height);
          context.fillStyle = "rgba(45, 52, 49, 0.18)";
          context.fillRect(42, 0, 1, pageCanvas.height);
        }
        const pageTexture = new THREE.CanvasTexture(pageCanvas);
        pageTexture.colorSpace = THREE.SRGBColorSpace;
        pageTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const pageMaterial = new THREE.MeshStandardMaterial({ map: pageTexture, roughness: 0.9, metalness: 0, envMapIntensity: 0.4 });

        const group = new THREE.Group();

        if (kind === "lens") {
          const profile = [
            new THREE.Vector2(0, 0.14),
            new THREE.Vector2(0.45, 0.12),
            new THREE.Vector2(0.78, 0.07),
            new THREE.Vector2(0.94, 0.018),
            new THREE.Vector2(0.94, -0.018),
            new THREE.Vector2(0.78, -0.07),
            new THREE.Vector2(0.45, -0.12),
            new THREE.Vector2(0, -0.14),
          ];
          const lens = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), glass);
          lens.rotation.x = Math.PI / 2;
          group.add(lens);

          const rim = new THREE.Mesh(new THREE.TorusGeometry(0.955, 0.065, 24, 128), navy);
          group.add(rim);
          const innerRim = new THREE.Mesh(new THREE.TorusGeometry(0.89, 0.018, 12, 128), steel);
          innerRim.position.z = 0.02;
          group.add(innerRim);

          const handlePivot = new THREE.Group();
          handlePivot.rotation.z = Math.PI / 4;
          const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.2, 32), steel);
          collar.position.y = -1.01;
          handlePivot.add(collar);
          const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.105, 1.32, 32), navy);
          handle.position.y = -1.73;
          handlePivot.add(handle);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), navy);
          cap.position.y = -2.39;
          handlePivot.add(cap);
          group.add(handlePivot);
          group.rotation.set(0.1, 0.18, -0.28);
        }

        if (kind === "rings") {
          const specs = [
            { material: steel, rx: 0.25, ry: 0.1, rz: 0.1 },
            { material: navy, rx: 1.25, ry: 0.36, rz: 0.4 },
            { material: cobalt, rx: 0.58, ry: 1.18, rz: 0.82 },
          ];
          specs.forEach((spec, index) => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.07, 24, 128), spec.material);
            ring.rotation.set(spec.rx, spec.ry, spec.rz);
            ring.position.z = index * 0.008;
            group.add(ring);
          });
          const rotor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 32), cobalt);
          group.add(rotor);
          const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.72, 20), steel);
          axle.rotation.z = Math.PI / 2;
          group.add(axle);
          const axle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.3, 20), steel);
          axle2.rotation.x = Math.PI / 2;
          group.add(axle2);
          group.rotation.set(0.2, 0.16, 0.08);
        }

        if (kind === "compass") {
          const compassCase = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.22, 84), navy);
          compassCase.rotation.x = Math.PI / 2;
          group.add(compassCase);
          const caseRim = new THREE.Mesh(new THREE.TorusGeometry(1.09, 0.055, 18, 128), steel);
          group.add(caseRim);
          const face = new THREE.Mesh(new THREE.CylinderGeometry(1.01, 1.01, 0.035, 84), cream);
          face.rotation.x = Math.PI / 2;
          face.position.z = 0.13;
          group.add(face);
          const faceGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.035, 84), glass);
          faceGlass.rotation.x = Math.PI / 2;
          faceGlass.position.z = 0.19;
          group.add(faceGlass);

          for (let i = 0; i < 24; i += 1) {
            const angle = (i / 24) * Math.PI * 2;
            const tick = new THREE.Mesh(new THREE.BoxGeometry(i % 6 === 0 ? 0.022 : 0.014, i % 6 === 0 ? 0.15 : 0.09, 0.012), steel);
            tick.position.set(Math.sin(angle) * 0.87, Math.cos(angle) * 0.87, 0.17);
            tick.rotation.z = -angle;
            group.add(tick);
          }

          const needle = new THREE.Group();
          const north = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.72, 0.026), acid);
          north.position.y = 0.36;
          needle.add(north);
          const south = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.72, 0.026), navy);
          south.position.y = -0.36;
          needle.add(south);
          needle.position.z = 0.21;
          needle.rotation.z = 0.36;
          group.add(needle);
          const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), steel);
          pin.position.z = 0.23;
          group.add(pin);
          group.rotation.set(0.27, 0.12, 0.06);
        }

        if (kind === "book") {
          const leftCover = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.09), navy);
          leftCover.position.set(-0.63, 0, 0);
          leftCover.rotation.y = -0.33;
          group.add(leftCover);
          const rightCover = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.09), cobalt);
          rightCover.position.set(0.63, 0, 0);
          rightCover.rotation.y = 0.33;
          group.add(rightCover);

          const leftPages = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.96, 0.2), cream);
          leftPages.position.set(-0.61, 0.01, 0.08);
          leftPages.rotation.y = -0.33;
          group.add(leftPages);
          const rightPages = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.96, 0.2), cream);
          rightPages.position.set(0.61, 0.01, 0.08);
          rightPages.rotation.y = 0.33;
          group.add(rightPages);

          const leftPage = new THREE.Mesh(new THREE.PlaneGeometry(1.13, 1.88), pageMaterial);
          leftPage.position.set(-0.61, 0.01, 0.23);
          leftPage.rotation.y = -0.33;
          group.add(leftPage);
          const rightPage = new THREE.Mesh(new THREE.PlaneGeometry(1.13, 1.88), pageMaterial);
          rightPage.position.set(0.61, 0.01, 0.23);
          rightPage.rotation.y = 0.33;
          group.add(rightPage);

          const spine = new THREE.Mesh(new THREE.BoxGeometry(0.13, 2.1, 0.3), navy);
          spine.position.set(0, 0, 0.03);
          group.add(spine);
          const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.8, 0.014), acid);
          ribbon.position.set(0.1, -1.02, 0.25);
          group.add(ribbon);
          group.rotation.set(0.28, 0.08, 0.06);
        }

        scene.add(group);
        const resize = () => {
          if (!renderer) return;
          const rect = mount.getBoundingClientRect();
          camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
          camera.updateProjectionMatrix();
          renderer.setSize(rect.width, rect.height, false);
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);

        let visible = true;
        const io = new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
        }, { rootMargin: "180px" });
        io.observe(mount);

        const base = group.rotation.y;
        const animate = (time: number) => {
          if (!alive || !renderer) return;
          if (visible) {
            group.rotation.y = base + Math.sin(time * 0.00035) * 0.16;
            group.position.y = Math.sin(time * 0.00055 + kind.length) * 0.03;
            renderer.render(scene, camera);
          }
          frame = window.requestAnimationFrame(animate);
        };
        animate(0);
        setStatus("ready");

        cleanup = () => {
          io.disconnect();
          resizeObserver.disconnect();
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          [navy, cobalt, steel, cream, acid, glass, pageMaterial].forEach((material) => material.dispose());
          pageTexture.dispose();
          brushTexture.dispose();
          envTarget.dispose();
          renderer?.dispose();
          if (renderer?.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
          renderer = null;
        };
      } catch {
        if (alive) setStatus("failed");
      }
    };
    void boot();

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [kind]);

  return (
    <div className="cosmic-object" ref={mountRef} aria-hidden="true">
      {status === "loading" ? <span className="cosmic-object__fallback">Loading object…</span> : null}
      {status === "failed" ? <span className="cosmic-object__fallback">3D unavailable.</span> : null}
    </div>
  );
}

function CosmicHome() {
  const [progress, setProgress] = useState(1);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const ticks = Array.from({ length: 74 });

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setSignedIn(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="cosmic-home">
      <header className="cosmic-brand">
        <BrandLockup size="md" asLink />
      </header>
      <main className="cosmic-main">
        <div className="cosmic-globe-wrap">
          <span className="cosmic-glow" aria-hidden="true" />
          <EarthScene progress={progress} />
          <span className="cosmic-shadow" aria-hidden="true" />
        </div>

        <div className="cosmic-caption">
          <h1>Today</h1>
          <p>Earth</p>
        </div>

        <div className="cosmic-timeline">
          <div className="cosmic-ticks" aria-hidden="true">
            {ticks.map((_, index) => (
              <span key={index} className={index > 65 ? "is-major" : ""} style={{ height: `${index > 65 ? 18 + (index - 65) * 2 : 6 + (index % 5 === 0 ? 4 : 0)}px` }} />
            ))}
          </div>
          <span className="cosmic-thumb" style={{ left: `${progress * 100}%` }} aria-hidden="true" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
            aria-label="Spin the Earth through time"
            className="cosmic-range"
          />
          <div className="cosmic-labels">
            <span>Drag to spin</span>
            <span>Today</span>
          </div>
        </div>

        <a href="#desk" className="cosmic-scroll">Scroll to the desk <span aria-hidden="true">↓</span></a>
      </main>

      <section id="desk" className="cosmic-section cosmic-intro">
        <div className="cosmic-section-head">
          <div className="cosmic-section-copy">
            <p className="cosmic-eyebrow">The desk</p>
            <h2>Read the evidence.<br /><em>Not just the story.</em></h2>
            <p>
              Threadwise is a quiet place to work out what a source actually says. Bring a link, a PDF
              or a screenshot. Leave with the frame, the gap, and the question worth keeping open.
            </p>
          </div>
          <SectionObject kind="lens" />
        </div>
      </section>

      <section className="cosmic-section cosmic-tools">
        <div className="cosmic-section-head">
          <div className="cosmic-section-copy">
            <p className="cosmic-eyebrow">Three instruments</p>
            <h2>One source at a time.</h2>
          </div>
          <SectionObject kind="rings" />
        </div>
        <nav className="cosmic-tool-list" aria-label="The three tools">
          <Link to="/analyst"><span>01</span><strong>The Analyst</strong><em>What is this source doing?</em><b aria-hidden="true">↗</b></Link>
          <Link to="/seminar"><span>02</span><strong>Seminar</strong><em>Which explanation is stronger?</em><b aria-hidden="true">↗</b></Link>
          <Link to="/anatomy"><span>03</span><strong>The Anatomy</strong><em>How is this belief built?</em><b aria-hidden="true">↗</b></Link>
        </nav>
      </section>

      <section className="cosmic-section cosmic-method">
        <div className="cosmic-section-head cosmic-section-head--reverse">
          <SectionObject kind="compass" />
          <div className="cosmic-section-copy">
            <p className="cosmic-eyebrow">The method</p>
            <h2>Keep the question open.</h2>
          </div>
        </div>
        <div className="cosmic-steps">
          <div><span>01</span><h3>Read the move.</h3><p>Separate what happened from how the story tells it.</p></div>
          <div><span>02</span><h3>Keep the question.</h3><p>A claim can be serious without being settled.</p></div>
          <div><span>03</span><h3>Leave a test.</h3><p>Write down what would change your mind.</p></div>
        </div>
      </section>

      <section className="cosmic-section cosmic-closing">
        <SectionObject kind="book" />
        <p className="cosmic-eyebrow">The last page</p>
        <h2>Read one thing<br /><em>properly.</em></h2>
        <p>Ten minutes with a source you already distrust will teach you more than a month of summaries.</p>
        <div className="cosmic-actions">
          <Link to="/analyst" className="cosmic-button">Bring a source <span aria-hidden="true">↗</span></Link>
          <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="cosmic-textlink">Open the IAEA sample <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className="cosmic-sitefoot">
        <nav aria-label="Threadwise pages">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
          <Link to="/digest">Record</Link>
        </nav>
        <div>
          {signedIn ? <Link to="/profile">Profile</Link> : <Link to="/login">Sign in</Link>}
          <span>Threadwise / read carefully</span>
        </div>
      </footer>
    </div>
  );
}
