import { useEffect, useRef, useState } from "react";
import { WORLD_PATH } from "@/components/lab/world";

export type GlobePlace = {
  key: string;
  label: string;
  lat: number;
  lon: number;
};

type Props = {
  focus: GlobePlace | null;
  onPick?: (lat: number, lon: number) => void;
};

function drawEarthTexture(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");

  const sx = width / 2000;
  const sy = height / 1000;

  // Ocean.
  const sea = ctx.createLinearGradient(0, 0, 0, height);
  sea.addColorStop(0, "#07111a");
  sea.addColorStop(0.5, "#0a1722");
  sea.addColorStop(1, "#061019");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, width, height);

  // Graticule beneath the land.
  ctx.strokeStyle = "rgba(232, 225, 212, 0.065)";
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

  const path = new Path2D(WORLD_PATH);
  ctx.save();
  ctx.scale(sx, sy);

  // Land.
  ctx.fillStyle = "#bdb4a4";
  ctx.fill(path);

  // Hatching gives the land some material instead of a flat fill.
  ctx.save();
  ctx.clip(path);
  ctx.strokeStyle = "rgba(22, 27, 30, 0.16)";
  ctx.lineWidth = 0.7;
  for (let x = -1200; x < 2200; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 1000, 1000);
    ctx.stroke();
  }
  ctx.restore();

  // Coast.
  ctx.strokeStyle = "rgba(244, 237, 224, 0.75)";
  ctx.lineWidth = 0.75;
  ctx.stroke(path);
  ctx.restore();

  // A little warm light on the land, the way a printed globe catches a lamp.
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const warmth = ctx.createRadialGradient(width * 0.62, height * 0.34, 0, width * 0.62, height * 0.34, width * 0.45);
  warmth.addColorStop(0, "rgba(255, 218, 164, 0.26)");
  warmth.addColorStop(1, "rgba(255, 218, 164, 0)");
  ctx.fillStyle = warmth;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  return canvas;
}

function latLonToVector(
  THREE: typeof import("three"),
  lat: number,
  lon: number,
  radius = 1,
) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function LiveGlobe({ focus, onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusRef = useRef<GlobePlace | null>(focus);
  const flyToRef = useRef<((place: GlobePlace) => void) | null>(null);
  const onPickRef = useRef(onPick);
  const pickedRef = useRef<{ lat: number; lon: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (focus) flyToRef.current?.(focus);
  }, [focus]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        33,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        100,
      );
      camera.position.copy(latLonToVector(THREE, 28, 32, 4.05));

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.enablePan = false;
      controls.minDistance = 2.0;
      controls.maxDistance = 5.2;
      controls.rotateSpeed = 0.42;
      controls.zoomSpeed = 0.72;
      controls.autoRotate = !focusRef.current;
      controls.autoRotateSpeed = 0.07;

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const texture = new THREE.CanvasTexture(drawEarthTexture(4096, 2048));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 128, 128),
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.92,
          metalness: 0.015,
          color: 0xffffff,
        }),
      );
      globeGroup.add(earth);

      // Atmosphere rim.
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.025, 64, 64),
        new THREE.ShaderMaterial({
          transparent: true,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: {},
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            void main() {
              float rim = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
              gl_FragColor = vec4(0.32, 0.48, 0.86, 1.0) * rim;
            }
          `,
        }),
      );
      globeGroup.add(atmosphere);

      // The read's route, drawn on the globe rather than floating in the interface.
      const places = {
        vienna: latLonToVector(THREE, 48.2082, 16.3738, 1.008),
        tehran: latLonToVector(THREE, 35.6892, 51.389, 1.008),
        natanz: latLonToVector(THREE, 33.724, 51.726, 1.008),
      };

      const routePoints = new THREE.QuadraticBezierCurve3(
        places.vienna,
        latLonToVector(THREE, 42, 35, 1.22),
        places.tehran,
      ).getPoints(72);
      const route = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(routePoints),
        new THREE.LineBasicMaterial({
          color: 0x5f7dff,
          transparent: true,
          opacity: 0.9,
        }),
      );
      globeGroup.add(route);

      const deniedPoints = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          places.tehran.clone().multiplyScalar(1.002),
          places.natanz.clone().multiplyScalar(1.002),
        ]),
        new THREE.LineBasicMaterial({
          color: 0xd25a4a,
          transparent: true,
          opacity: 0.9,
        }),
      );
      globeGroup.add(deniedPoints);

      const marker = (position: THREE.Vector3, color: number) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.012, 12, 12),
          new THREE.MeshBasicMaterial({ color }),
        );
        dot.position.copy(position);
        globeGroup.add(dot);
        return dot;
      };
      marker(places.vienna, 0x5f7dff);
      marker(places.tehran, 0x5f7dff);
      marker(places.natanz, 0xd25a4a);

      // A quiet constellation of simulated orbital arcs.
      const orbitMaterials = [
        new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.09 }),
        new THREE.LineBasicMaterial({ color: 0xd8d0c1, transparent: true, opacity: 0.055 }),
      ];
      for (let i = 0; i < 18; i += 1) {
        const radius = 1.16 + Math.random() * 0.33;
        const tilt = (Math.random() - 0.5) * 1.6;
        const yaw = Math.random() * Math.PI * 2;
        const orbit = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            Array.from({ length: 128 }, (_, index) => {
              const angle = (index / 128) * Math.PI * 2;
              const point = new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius * Math.sin(tilt),
                Math.sin(angle) * radius * Math.cos(tilt),
              );
              point.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
              return point;
            }),
          ),
          orbitMaterials[i % orbitMaterials.length],
        );
        scene.add(orbit);
      }

      // Simulated satellite field. Positions are orbital decoration, not a live feed.
      const count = 280;
      const satPositions = new Float32Array(count * 3);
      const satData = Array.from({ length: count }, () => ({
        radius: 1.13 + Math.random() * 0.34,
        inclination: (Math.random() - 0.5) * 2.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.035 + Math.random() * 0.055,
        yaw: Math.random() * Math.PI * 2,
      }));
      const satGeometry = new THREE.BufferGeometry();
      satGeometry.setAttribute("position", new THREE.BufferAttribute(satPositions, 3));
      const satellites = new THREE.Points(
        satGeometry,
        new THREE.PointsMaterial({
          color: 0xfff1d6,
          size: 0.024,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      scene.add(satellites);

      // Starfield.
      const starCount = 2200;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i += 1) {
        const radius = 16 + Math.random() * 24;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = radius * Math.cos(phi);
        starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      scene.add(
        new THREE.Points(
          starGeometry,
          new THREE.PointsMaterial({
            color: 0xf3eadc,
            size: 0.02,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          }),
        ),
      );

      const key = new THREE.DirectionalLight(0xffe8c7, 3.4);
      key.position.set(4.2, 2.1, 3.4);
      scene.add(key);
      const ambient = new THREE.AmbientLight(0x91a9ce, 0.36);
      scene.add(ambient);
      const rimLight = new THREE.PointLight(0x3d63bb, 1.7, 7);
      rimLight.position.set(-3.4, -1.5, -2.8);
      scene.add(rimLight);

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let downAt: { x: number; y: number } | null = null;

      const onPointerDown = (event: PointerEvent) => {
        downAt = { x: event.clientX, y: event.clientY };
      };
      const onPointerUp = (event: PointerEvent) => {
        if (!downAt) return;
        const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
        downAt = null;
        if (moved > 6) return;
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(earth, false)[0];
        if (!hit) return;
        const normal = hit.point.clone().normalize();
        const lat = 90 - (Math.acos(normal.y) * 180) / Math.PI;
        let lon = (Math.atan2(normal.z, -normal.x) * 180) / Math.PI - 180;
        while (lon < -180) lon += 360;
        while (lon > 180) lon -= 360;
        pickedRef.current = { lat, lon };
        onPickRef.current?.(lat, lon);
      };
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointerup", onPointerUp);

      const target = new THREE.Vector3();
      let flying = false;
      flyToRef.current = (place) => {
        target.copy(latLonToVector(THREE, place.lat, place.lon, 4.05));
        flying = true;
        controls.autoRotate = false;
      };

      if (focusRef.current) flyToRef.current(focusRef.current);

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
        const elapsed = (performance.now() - startedAt) / 1000;

        for (let i = 0; i < count; i += 1) {
          const sat = satData[i]!;
          const angle = sat.phase + elapsed * sat.speed;
          const x = Math.cos(angle) * sat.radius;
          const y = Math.sin(angle) * sat.radius * Math.sin(sat.inclination);
          const z = Math.sin(angle) * sat.radius * Math.cos(sat.inclination);
          const cos = Math.cos(sat.yaw);
          const sin = Math.sin(sat.yaw);
          satPositions[i * 3] = x * cos - z * sin;
          satPositions[i * 3 + 1] = y;
          satPositions[i * 3 + 2] = x * sin + z * cos;
        }
        (satGeometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

        if (flying) {
          camera.position.lerp(target, 0.055);
          if (camera.position.distanceTo(target) < 0.01) flying = false;
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        controls.dispose();
        texture.dispose();
        renderer.dispose();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_40%,rgba(97,120,178,0.18),transparent_45%)]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('/world-land-dark.svg')",
            backgroundSize: "min(1300px, 150vw) auto",
            backgroundPosition: "70% 40%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <p className="absolute bottom-24 left-5 max-w-[34ch] font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-[#FDFBF7]/35 md:left-8">
          This browser could not open the live plate. The read is still here.
        </p>
      </div>
    );
  }

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Interactive demonstration globe" />;
}
