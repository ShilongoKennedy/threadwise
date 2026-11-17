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

type ObjectKind = "lens" | "rings" | "question" | "book";

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
        if (!alive) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0, 6.2);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.35));
        const key = new THREE.DirectionalLight(0xfff8ed, 3.7);
        key.position.set(-4, 4, 5);
        scene.add(key);
        const fill = new THREE.PointLight(0xa8cfff, 11, 20, 2);
        fill.position.set(4, -1, 3);
        scene.add(fill);

        const navy = new THREE.MeshStandardMaterial({ color: 0x1b3b52, roughness: 0.28, metalness: 0.55 });
        const cobalt = new THREE.MeshStandardMaterial({ color: 0x315a78, roughness: 0.32, metalness: 0.4 });
        const cream = new THREE.MeshStandardMaterial({ color: 0xece8dc, roughness: 0.82, metalness: 0 });
        const acid = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, roughness: 0.5, metalness: 0.1 });

        const group = new THREE.Group();

        if (kind === "lens") {
          const glass = new THREE.Mesh(
            new THREE.CylinderGeometry(0.92, 0.92, 0.14, 72),
            new THREE.MeshPhysicalMaterial({
              color: 0xdceaf4,
              transparent: true,
              opacity: 0.36,
              roughness: 0.08,
              metalness: 0,
              clearcoat: 1,
              clearcoatRoughness: 0.06,
            }),
          );
          glass.rotation.x = Math.PI / 2;
          group.add(glass);
          const rim = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.047, 16, 112), navy);
          group.add(rim);
          const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 1.28, 28), navy);
          handle.position.set(0.93, -1.02, 0);
          handle.rotation.z = -0.72;
          group.add(handle);
          group.rotation.set(0.12, 0.22, -0.32);
        }

        if (kind === "rings") {
          const specs = [
            { material: navy, rx: 0.2, ry: 0, rz: 0 },
            { material: cobalt, rx: 1.1, ry: 0.5, rz: 0.45 },
            { material: acid, rx: 0.6, ry: 1.2, rz: 0.9 },
          ];
          specs.forEach((spec) => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.035, 14, 112), spec.material);
            ring.rotation.set(spec.rx, spec.ry, spec.rz);
            group.add(ring);
          });
          group.rotation.set(0.18, 0.2, 0.1);
        }

        if (kind === "question") {
          const points = [
            [0.02, -1.15, 0],
            [0.02, -0.72, 0],
            [0.01, -0.34, 0],
            [-0.28, -0.03, 0],
            [-0.52, 0.4, 0],
            [-0.35, 0.78, 0],
            [0.08, 0.86, 0],
            [0.4, 0.6, 0],
            [0.35, 0.25, 0],
            [0.05, 0.11, 0],
          ];
          const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
          const hook = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.115, 16, false), navy);
          group.add(hook);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 28, 20), acid);
          dot.position.set(0.02, -1.55, 0);
          group.add(dot);
          group.rotation.set(0.08, 0.22, -0.06);
        }

        if (kind === "book") {
          const leftCover = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.08, 0.08), navy);
          leftCover.position.set(-0.62, 0, 0);
          leftCover.rotation.y = -0.34;
          group.add(leftCover);
          const rightCover = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.08, 0.08), cobalt);
          rightCover.position.set(0.62, 0, 0);
          rightCover.rotation.y = 0.34;
          group.add(rightCover);
          const leftPages = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.94, 0.18), cream);
          leftPages.position.set(-0.59, 0.02, 0.08);
          leftPages.rotation.y = -0.34;
          group.add(leftPages);
          const rightPages = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.94, 0.18), cream);
          rightPages.position.set(0.59, 0.02, 0.08);
          rightPages.rotation.y = 0.34;
          group.add(rightPages);
          const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.08, 0.26), navy);
          spine.position.set(0, 0, 0.02);
          group.add(spine);
          const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.012), acid);
          ribbon.position.set(0.1, -0.96, 0.2);
          group.add(ribbon);
          group.rotation.set(0.26, 0.06, 0.08);
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
        const observer = new ResizeObserver(resize);
        observer.observe(mount);

        let visible = true;
        const io = new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
        }, { rootMargin: "180px" });
        io.observe(mount);

        const base = group.rotation.y;
        const animate = (time: number) => {
          if (!alive || !renderer) return;
          if (visible) {
            group.rotation.y = base + Math.sin(time * 0.00035) * 0.2;
            group.position.y = Math.sin(time * 0.0006 + kind.length) * 0.035;
            renderer.render(scene, camera);
          }
          frame = window.requestAnimationFrame(animate);
        };
        animate(0);
        setStatus("ready");

        cleanup = () => {
          io.disconnect();
          observer.disconnect();
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          [navy, cobalt, cream, acid].forEach((material) => material.dispose());
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
          <SectionObject kind="question" />
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
