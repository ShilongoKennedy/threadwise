import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/lab/atmosphere")({
  head: () => ({
    meta: [
      { title: "A clear look — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AtmosphereStudy,
});

function ThreadObject() {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let cleanup: (() => void) | null = null;
    const mount = mountRef.current;
    if (!mount) return;

    const onMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const boot = async () => {
      try {
        const THREE = await import("three");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (!alive) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0, 6.4);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        mount.appendChild(renderer.domElement);

        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = new RoomEnvironment();
        const envTarget = pmrem.fromScene(environment, 0.04);
        scene.environment = envTarget.texture;
        pmrem.dispose();

        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const key = new THREE.DirectionalLight(0xffe6f2, 4.2);
        key.position.set(-4, 4, 5);
        scene.add(key);
        const rim = new THREE.PointLight(0x9fb9ff, 18, 20, 2);
        rim.position.set(3, -1, 3);
        scene.add(rim);
        const low = new THREE.PointLight(0xffb8cd, 10, 18, 2);
        low.position.set(0, -4, 3);
        scene.add(low);

        const glass = new THREE.MeshPhysicalMaterial({
          color: 0xf4e9f7,
          metalness: 0,
          roughness: 0.03,
          transmission: 1,
          thickness: 0.75,
          ior: 1.42,
          iridescence: 1,
          iridescenceIOR: 1.3,
          iridescenceThicknessRange: [100, 520],
          clearcoat: 1,
          clearcoatRoughness: 0.03,
          envMapIntensity: 1.4,
        });
        const silk = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0x9a7dff,
          emissiveIntensity: 0.45,
          roughness: 0.22,
          metalness: 0.1,
          transparent: true,
          opacity: 0.7,
          transmission: 0.4,
        });

        const group = new THREE.Group();
        const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.34, 0.23, 260, 40, 2, 3), glass);
        group.add(knot);
        const core = new THREE.Mesh(new THREE.TorusKnotGeometry(1.34, 0.055, 260, 16, 2, 3), silk);
        core.scale.setScalar(0.975);
        group.add(core);
        group.rotation.set(0.45, 0.2, -0.35);
        scene.add(group);

        // A faint outer halo; the object should feel held in the sky, not pasted on it.
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(2.0, 64, 48),
          new THREE.MeshBasicMaterial({ color: 0xd9c8ff, transparent: true, opacity: 0.025, side: THREE.BackSide, depthWrite: false }),
        );
        scene.add(halo);

        const resize = () => {
          if (!renderer) return;
          const rect = mount.getBoundingClientRect();
          camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
          camera.updateProjectionMatrix();
          renderer.setSize(rect.width, rect.height, false);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);

        const animate = (time: number) => {
          if (!alive || !renderer) return;
          const px = pointer.current.x;
          const py = pointer.current.y;
          group.rotation.y += (0.2 + px * 0.36 + time * 0.00003 - group.rotation.y) * 0.025;
          group.rotation.x += (0.45 + py * 0.2 - group.rotation.x) * 0.025;
          group.position.y = Math.sin(time * 0.00035) * 0.06;
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(animate);
        };
        animate(0);
        setReady(true);

        cleanup = () => {
          ro.disconnect();
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          [glass, silk].forEach((material) => material.dispose());
          envTarget.dispose();
          renderer?.dispose();
          if (renderer?.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
          renderer = null;
        };
      } catch {
        // The atmosphere still works without WebGL.
      }
    };
    void boot();

    return () => {
      alive = false;
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, []);

  return (
    <div className="aura-object" ref={mountRef} aria-hidden="true">
      {!ready ? <span className="aura-object__fallback">the thread is loading</span> : null}
    </div>
  );
}

function AtmosphereStudy() {
  return (
    <div className="aura-lab">
      <div className="aura-sky" aria-hidden="true">
        <span className="aura-sky__haze aura-sky__haze--one" />
        <span className="aura-sky__haze aura-sky__haze--two" />
        <span className="aura-sky__haze aura-sky__haze--three" />
        <span className="aura-sky__star aura-sky__star--one" />
        <span className="aura-sky__star aura-sky__star--two" />
        <span className="aura-sky__star aura-sky__star--three" />
      </div>

      <header className="aura-nav">
        <div className="aura-nav__brand">
          <Link to="/" className="aura-logo">Threadwise<sup>®</sup></Link>
          <span>A reading desk</span>
        </div>
        <span className="aura-nav__clock">Helsinki / evening</span>
        <nav aria-label="Pages">
          <Link to="/analyst">The Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">Anatomy</Link>
        </nav>
        <Link to="/analyst" className="aura-nav__cta">Enter the desk <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="aura-main">
        <div className="aura-orbit aura-orbit--one" aria-hidden="true" />
        <div className="aura-orbit aura-orbit--two" aria-hidden="true" />
        <ThreadObject />

        <div className="aura-title">
          <p className="aura-kicker">A reading desk for the internet</p>
          <h1>the clear<br /><em>look.</em></h1>
          <p className="aura-tagline">Read between the lines.</p>
        </div>

        <div className="aura-side-note">
          <span>01 / the thread</span>
          <p>Every claim has a source. Most stories lose it on the way to the headline.</p>
        </div>
      </main>

      <footer className="aura-foot">
        <Link to="/analyst" className="aura-foot__start">Put a source on the desk <span aria-hidden="true">↗</span></Link>
        <span>Evidence first / verdict later</span>
        <span>Threadwise / 2026</span>
      </footer>
    </div>
  );
}
