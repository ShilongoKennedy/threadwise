import { useEffect, useRef, useState } from "react";
import { WORLD_PATH } from "@/components/lab/world";

function drawGridTexture(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(26, 26, 26, 0.1)";
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  return canvas;
}

function mapPoint(
  THREE: typeof import("three"),
  lat: number,
  lon: number,
  lift = 0,
) {
  const x = (((lon + 180) / 360) - 0.5) * 12;
  const z = -((((90 - lat) / 180) * 1000 - 500) / 1000) * 6;
  return new THREE.Vector3(x, lift, z);
}

export function ReliefMap({ onReady }: { onReady?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const THREE = await import("three");
      const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");
      if (disposed) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        31,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        80,
      );
      camera.position.set(5.4, 9.6, 13.6);
      camera.lookAt(1.2, 0, 0);

      const paper = new THREE.Color("#FDFBF7");
      renderer.setClearColor(paper, 0);

      const ambient = new THREE.AmbientLight(0xfffbf2, 0.82);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xfff1d7, 3.2);
      key.position.set(8, 12, 7);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.camera.left = -10;
      key.shadow.camera.right = 10;
      key.shadow.camera.top = 10;
      key.shadow.camera.bottom = -10;
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 40;
      key.shadow.bias = -0.0007;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xcbd8ee, 0.65);
      fill.position.set(-8, 5, -6);
      scene.add(fill);

      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 20),
        new THREE.ShadowMaterial({ color: 0x1a1a1a, opacity: 0.16 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -0.22;
      shadow.receiveShadow = true;
      scene.add(shadow);

      const stage = new THREE.Group();
      stage.position.x = 1.6;
      scene.add(stage);

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(12.6, 0.16, 6.6),
        new THREE.MeshStandardMaterial({
          color: 0xf2ece1,
          roughness: 0.98,
          metalness: 0,
        }),
      );
      board.position.y = -0.08;
      board.receiveShadow = true;
      board.castShadow = true;
      stage.add(board);

      const gridCanvas = drawGridTexture(2048, 1024);
      const gridTexture = new THREE.CanvasTexture(gridCanvas);
      gridTexture.colorSpace = THREE.SRGBColorSpace;
      const grid = new THREE.Mesh(
        new THREE.PlaneGeometry(12.1, 6.1),
        new THREE.MeshBasicMaterial({
          map: gridTexture,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        }),
      );
      grid.rotation.x = -Math.PI / 2;
      grid.position.y = 0.003;
      stage.add(grid);

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1000"><path d="${WORLD_PATH}" fill-rule="evenodd"/></svg>`;
      const svgData = new SVGLoader().parse(svg);
      const shapes = svgData.paths.flatMap((path) => path.toShapes(true));
      const landGeometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 4,
        bevelEnabled: true,
        bevelThickness: 0.7,
        bevelSize: 0.8,
        bevelSegments: 2,
        steps: 1,
        curveSegments: 2,
      });
      landGeometry.rotateX(-Math.PI / 2);
      landGeometry.computeBoundingBox();
      const bounds = landGeometry.boundingBox!;
      landGeometry.translate(
        -(bounds.min.x + bounds.max.x) / 2,
        -bounds.min.y,
        -(bounds.min.z + bounds.max.z) / 2,
      );
      landGeometry.scale(0.006, 0.006, 0.006);
      const land = new THREE.Mesh(
        landGeometry,
        new THREE.MeshStandardMaterial({
          color: 0x282722,
          roughness: 0.94,
          metalness: 0,
        }),
      );
      land.castShadow = true;
      land.receiveShadow = true;
      stage.add(land);

      const vienna = mapPoint(THREE, 48.2082, 16.3738, 0.085);
      const tehran = mapPoint(THREE, 35.6892, 51.389, 0.085);
      const natanz = mapPoint(THREE, 33.724, 51.726, 0.085);

      const routeCurve = new THREE.QuadraticBezierCurve3(
        vienna,
        new THREE.Vector3((vienna.x + tehran.x) / 2, 0.55, (vienna.z + tehran.z) / 2),
        tehran,
      );
      const route = new THREE.Mesh(
        new THREE.TubeGeometry(routeCurve, 72, 0.022, 8, false),
        new THREE.MeshBasicMaterial({ color: 0x1a4bff }),
      );
      stage.add(route);

      const deniedCurve = new THREE.LineCurve3(
        tehran.clone().setY(0.09),
        natanz.clone().setY(0.09),
      );
      const denied = new THREE.Mesh(
        new THREE.TubeGeometry(deniedCurve, 12, 0.012, 6, false),
        new THREE.MeshBasicMaterial({ color: 0xc1121f }),
      );
      stage.add(denied);

      const pin = (position: THREE.Vector3, color: number) => {
        const group = new THREE.Group();
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.009, 0.009, 0.15, 8),
          new THREE.MeshBasicMaterial({ color }),
        );
        stem.position.y = 0.075;
        group.add(stem);
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.058, 16, 16),
          new THREE.MeshBasicMaterial({ color }),
        );
        head.position.y = 0.17;
        group.add(head);
        group.position.copy(position);
        stage.add(group);
      };
      pin(vienna, 0x1a4bff);
      pin(tehran, 0x1a4bff);
      pin(natanz, 0xc1121f);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(12.6, 0.16, 6.6)),
        new THREE.LineBasicMaterial({
          color: 0x1a1a1a,
          transparent: true,
          opacity: 0.2,
        }),
      );
      edges.position.y = -0.08;
      stage.add(edges);

      const pointer = { x: 0, y: 0 };
      const onPointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      const onResize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      window.addEventListener("resize", onResize);

      const startedAt = performance.now();
      const animate = () => {
        frame = requestAnimationFrame(animate);
        const time = (performance.now() - startedAt) / 1000;
        const targetY = 0.06 + pointer.x * 0.035;
        const targetX = -0.02 + pointer.y * 0.02;
        stage.rotation.y += (targetY - stage.rotation.y) * 0.045;
        stage.rotation.x += (targetX - stage.rotation.x) * 0.045;
        stage.position.y = Math.sin(time * 0.45) * 0.025;
        renderer.render(scene, camera);
      };
      animate();
      onReadyRef.current?.();

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", onResize);
        gridTexture.dispose();
        renderer.dispose();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
            object.geometry.dispose();
            const material = object.material;
            if (Array.isArray(material)) material.forEach((item) => item.dispose());
            else material.dispose();
          }
        });
      };
    };

    void boot().catch(() => {
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  if (failed) {
    return (
      <div className="absolute inset-0 bg-[#FDFBF7]">
        <img src="/world-land.svg" alt="" className="absolute right-0 top-0 h-full w-[62%] object-cover opacity-60" />
        <p className="absolute bottom-6 left-6 font-mono text-[8px] uppercase tracking-[0.14em] text-[#1A1A1A]/35">
          This browser could not open the relief plate.
        </p>
      </div>
    );
  }

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Interactive relief map of the world" />;
}
