import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/lab/lens")({
  head: () => ({
    meta: [
      { title: "Look again — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LensStudy,
});

function LensStudy() {
  const mountRef = useRef<HTMLDivElement>(null);
  const view = useRef({ yaw: -0.35, pitch: 0.08, dragging: false, x: 0, y: 0, zoom: 1 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let alive = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let cleanup: (() => void) | null = null;
    const mount = mountRef.current;
    if (!mount) return;

    const down = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest("button, a")) return;
      view.current.dragging = true;
      view.current.x = event.clientX;
      view.current.y = event.clientY;
      mount.setPointerCapture?.(event.pointerId);
      mount.classList.add("is-dragging");
    };
    const move = (event: PointerEvent) => {
      if (!view.current.dragging) return;
      view.current.yaw += (event.clientX - view.current.x) * 0.008;
      view.current.pitch = Math.max(-0.6, Math.min(0.6, view.current.pitch + (event.clientY - view.current.y) * 0.006));
      view.current.x = event.clientX;
      view.current.y = event.clientY;
    };
    const up = () => {
      view.current.dragging = false;
      mount.classList.remove("is-dragging");
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      view.current.zoom = Math.max(0.78, Math.min(1.35, view.current.zoom - event.deltaY * 0.0007));
    };
    mount.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    mount.addEventListener("wheel", wheel, { passive: false });

    const boot = async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        if (!alive) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe8ff4f);
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        camera.position.set(0, 0.02, 9.6);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0xe8ff4f, 1);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(renderer.domElement);

        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = new RoomEnvironment();
        const envTarget = pmrem.fromScene(environment, 0.04);
        scene.environment = envTarget.texture;
        pmrem.dispose();

        scene.add(new THREE.AmbientLight(0xffffff, 1.4));
        const key = new THREE.DirectionalLight(0xfff4dc, 3.8);
        key.position.set(-4, 5, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        scene.add(key);
        const rim = new THREE.PointLight(0xffffff, 8, 20, 2);
        rim.position.set(4, 1, 4);
        scene.add(rim);

        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync("/lab/magnifier/magnifying_glass_01_1k.gltf");
        if (!alive) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const max = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(3.5 / max);
        model.updateMatrixWorld(true);
        const scaledCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        model.position.sub(scaledCenter);
        model.rotation.set(0.08, -0.28, -0.18);
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        scene.add(model);

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

        const animate = () => {
          if (!alive || !renderer) return;
          model.rotation.y += (view.current.yaw - model.rotation.y) * 0.06;
          model.rotation.x += (0.08 + view.current.pitch - model.rotation.x) * 0.06;
          camera.position.z += (9.6 / view.current.zoom - camera.position.z) * 0.06;
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(animate);
        };
        animate();
        resetRef.current = () => {
          view.current.yaw = -0.35;
          view.current.pitch = 0.08;
          view.current.zoom = 1;
        };
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
          envTarget.dispose();
          renderer?.dispose();
          if (renderer?.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
          renderer = null;
        };
      } catch {
        if (alive) setFailed(true);
      }
    };
    void boot();

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      mount.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      mount.removeEventListener("wheel", wheel);
      cleanup?.();
      resetRef.current = null;
    };
  }, []);

  return (
    <div className="lens-lab">
      <header className="lens-nav">
        <Link to="/" className="lens-brand">THREADWISE</Link>
        <span className="lens-nav__label">Instrument 01 / the looking glass</span>
        <nav aria-label="The desk">
          <Link to="/analyst">Analyst</Link>
          <Link to="/seminar">Seminar</Link>
          <Link to="/anatomy">Anatomy</Link>
        </nav>
        <Link to="/analyst" className="lens-nav__enter">Enter the desk <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="lens-main">
        <div className="lens-kicker">
          <span>A reading desk / instrument 01</span>
          <span>Model · Poly Haven / CC0</span>
        </div>

        <div
          ref={mountRef}
          className={`lens-object ${ready ? "is-ready" : ""}`}
          aria-label="Interactive 3D magnifying glass. Drag to turn, scroll to zoom."
          role="img"
        >
          {!ready && !failed ? <span className="lens-loading">the glass is arriving</span> : null}
          {failed ? <span className="lens-loading">3D unavailable in this browser.</span> : null}
        </div>

        <div className="lens-copy">
          <h1>Look<br /><em>again.</em></h1>
          <p>A first reading is rarely the whole source. Put something under the glass and stay with it long enough to see the frame.</p>
        </div>

        <div className="lens-instructions">
          <span>Drag to turn</span>
          <span>Scroll to come closer</span>
          <button type="button" onClick={() => resetRef.current?.()}>Reset view</button>
        </div>

        <div className="lens-cta">
          <Link to="/analyst">Put a source under the glass <span aria-hidden="true">↗</span></Link>
          <span>No verdict before the evidence.</span>
        </div>
      </main>

      <footer className="lens-foot">
        <span>Threadwise / a reading desk</span>
        <span>Look closer. Keep the question.</span>
        <span>Lab instrument 01 / 2026</span>
      </footer>
    </div>
  );
}
