import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/lab/hero3d")({
  head: () => ({
    meta: [
      { title: "A claim is a thread — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Hero3D,
});

function SpoolScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    const mount = mountRef.current;
    if (!mount) return;

    const boot = async () => {
      try {
        const THREE = await import("three");
        if (!alive) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0, 9.2);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xfff4ff, 0x1f184d, 2.1));
        const key = new THREE.DirectionalLight(0xfff0d8, 4.2);
        key.position.set(-4, 6, 7);
        scene.add(key);
        const lime = new THREE.PointLight(0xc8ff3d, 70, 18, 2);
        lime.position.set(4.5, 1.8, 4.2);
        scene.add(lime);
        const lilac = new THREE.PointLight(0xa78bfa, 48, 16, 2);
        lilac.position.set(-4, -3, 3);
        scene.add(lilac);

        const group = new THREE.Group();
        group.position.set(0.2, 0.1, 0);
        group.rotation.set(0.12, -0.28, -0.3);
        scene.add(group);

        const glassMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xb9a8f2,
          transparent: true,
          opacity: 0.16,
          roughness: 0.08,
          metalness: 0.1,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const glass = new THREE.Mesh(new THREE.CircleGeometry(2.65, 96), glassMaterial);
        glass.position.z = -0.9;
        group.add(glass);

        const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x8f7be8, metalness: 0.75, roughness: 0.22 });
        for (const radius of [2.65, 2.28, 1.94]) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius === 2.65 ? 0.018 : 0.009, 12, 160), rimMaterial);
          ring.position.z = -0.88;
          group.add(ring);
        }

        const flangeMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x17142b,
          metalness: 0.6,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.18,
        });
        const coreMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xe8e2d4,
          metalness: 0.05,
          roughness: 0.52,
          clearcoat: 0.5,
        });
        const threadMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xc8ff3d,
          emissive: 0x2d3b00,
          emissiveIntensity: 0.45,
          metalness: 0.1,
          roughness: 0.28,
          clearcoat: 1,
        });

        const spool = new THREE.Group();
        spool.rotation.set(0.1, 0.18, -0.18);
        group.add(spool);

        const flangeGeo = new THREE.CylinderGeometry(1.18, 1.18, 0.16, 80);
        for (const y of [-1.04, 1.04]) {
          const flange = new THREE.Mesh(flangeGeo, flangeMaterial);
          flange.position.y = y;
          spool.add(flange);
          const lip = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.035, 12, 100), rimMaterial);
          lip.rotation.x = Math.PI / 2;
          lip.position.y = y + (y > 0 ? 0.09 : -0.09);
          spool.add(lip);
        }
        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 1.92, 64), coreMaterial);
        spool.add(core);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.3, 32), flangeMaterial);
        spool.add(hub);

        const winding: import("three").Vector3[] = [];
        const turns = 20;
        const steps = turns * 30;
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const angle = t * Math.PI * 2 * turns;
          winding.push(new THREE.Vector3(Math.cos(angle) * 0.59, -0.88 + t * 1.76, Math.sin(angle) * 0.59));
        }
        const thread = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(winding), 500, 0.026, 8, false),
          threadMaterial,
        );
        spool.add(thread);

        const tailCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.59, 0.86, 0.08),
          new THREE.Vector3(1.5, 1.36, 0.1),
          new THREE.Vector3(2.7, 2.75, -0.2),
          new THREE.Vector3(2.15, 3.9, -0.5),
          new THREE.Vector3(0.45, 4.15, -0.7),
        ]);
        const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 120, 0.032, 8, false), threadMaterial);
        spool.add(tail);

        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 20), threadMaterial);
        bead.position.copy(tailCurve.getPoint(1));
        spool.add(bead);

        const resize = () => {
          if (!renderer) return;
          const rect = mount.getBoundingClientRect();
          const width = Math.max(1, rect.width);
          const height = Math.max(1, rect.height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(mount);

        const pointer = { x: 0, y: 0 };
        const onPointerMove = (event: PointerEvent) => {
          const rect = mount.getBoundingClientRect();
          pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
          pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
        };
        mount.addEventListener("pointermove", onPointerMove);

        const clock = new THREE.Clock();
        const animate = () => {
          if (!alive || !renderer) return;
          const t = clock.getElapsedTime();
          group.rotation.y = Math.sin(t * 0.22) * 0.1 + pointer.x * 0.28;
          group.rotation.x = -pointer.y * 0.16;
          spool.rotation.y = Math.sin(t * 0.18) * 0.12 + 0.18;
          group.position.y = Math.sin(t * 0.6) * 0.06 + 0.1;
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(animate);
        };
        animate();
        setState("ready");

        const cleanup = () => {
          observer.disconnect();
          mount.removeEventListener("pointermove", onPointerMove);
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          renderer?.dispose();
          if (renderer?.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
          renderer = null;
        };
        (mount as HTMLElement & { __cleanup?: () => void }).__cleanup = cleanup;
      } catch {
        if (alive) setState("failed");
      }
    };
    void boot();

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      (mount as HTMLElement & { __cleanup?: () => void }).__cleanup?.();
    };
  }, []);

  return (
    <div className="hero3d-stage">
      <div ref={mountRef} className="hero3d-canvas" aria-hidden="true" />
      {state === "loading" ? <div className="hero3d-loading">Threading the lens…</div> : null}
      {state === "failed" ? <div className="hero3d-loading">3D unavailable in this browser.</div> : null}
      <span className="hero3d-caption">01 / The spool · a claim wound through evidence</span>
    </div>
  );
}

function Hero3D() {
  return (
    <div className="hero3d">
      <header className="hero3d-nav">
        <Link to="/" className="hero3d-brand">
          <span className="hero3d-brand__dot" aria-hidden="true" />
          THREADWISE
        </Link>
        <nav aria-label="Tools">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">The Anatomy</Link>
        </nav>
        <Link to="/analyst" className="hero3d-enter">Enter the desk ↗</Link>
      </header>

      <main className="hero3d-main">
        <section className="hero3d-copy">
          <p className="hero3d-kicker">Threadwise / a reading desk</p>
          <h1>A claim is a <em>thread.</em></h1>
          <p className="hero3d-lede">
            It starts somewhere, passes through hands, and picks up tension. Threadwise follows it
            from the first appearance to the evidence — and shows you where the trail stops.
          </p>
          <div className="hero3d-actions">
            <Link to="/analyst" className="hero3d-cta">Bring a source →</Link>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="hero3d-link">Open the IAEA read ↗</Link>
          </div>
          <div className="hero3d-key">
            <span><b>01</b> Read the move</span>
            <span><b>02</b> Compare explanations</span>
            <span><b>03</b> See where evidence stops</span>
          </div>
        </section>

        <SpoolScene />
      </main>

      <footer className="hero3d-foot">
        <span>Evidence first. Verdict later.</span>
        <span className="hero3d-foot__mark" aria-hidden="true">✦</span>
        <span>Read carefully / verify before you act</span>
      </footer>
    </div>
  );
}
