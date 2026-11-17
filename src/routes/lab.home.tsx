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
        <p className="cosmic-eyebrow">The desk</p>
        <h2>Read the evidence.<br /><em>Not just the story.</em></h2>
        <p>
          Threadwise is a quiet place to work out what a source actually says. Bring a link, a PDF
          or a screenshot. Leave with the frame, the gap, and the question worth keeping open.
        </p>
      </section>

      <section className="cosmic-section cosmic-tools">
        <p className="cosmic-eyebrow">Three instruments</p>
        <h2>One source at a time.</h2>
        <nav className="cosmic-tool-list" aria-label="The three tools">
          <Link to="/analyst"><span>01</span><strong>The Analyst</strong><em>What is this source doing?</em><b aria-hidden="true">↗</b></Link>
          <Link to="/seminar"><span>02</span><strong>Seminar</strong><em>Which explanation is stronger?</em><b aria-hidden="true">↗</b></Link>
          <Link to="/anatomy"><span>03</span><strong>The Anatomy</strong><em>How is this belief built?</em><b aria-hidden="true">↗</b></Link>
        </nav>
      </section>

      <section className="cosmic-section cosmic-method">
        <p className="cosmic-eyebrow">The method</p>
        <h2>Keep the question open.</h2>
        <div className="cosmic-steps">
          <div><span>01</span><h3>Read the move.</h3><p>Separate what happened from how the story tells it.</p></div>
          <div><span>02</span><h3>Keep the question.</h3><p>A claim can be serious without being settled.</p></div>
          <div><span>03</span><h3>Leave a test.</h3><p>Write down what would change your mind.</p></div>
        </div>
      </section>

      <section className="cosmic-section cosmic-closing">
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
