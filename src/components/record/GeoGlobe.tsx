import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CITIES = [
  {
    id: "vienna",
    number: "01",
    name: "Vienna",
    country: "Austria",
    lat: 48.2082,
    lon: 16.3738,
    note: "IAEA demand issued",
    tone: "blue",
    offset: { x: -2, y: -10 },
  },
  {
    id: "tehran",
    number: "02",
    name: "Tehran",
    country: "Iran",
    lat: 35.6892,
    lon: 51.389,
    note: "Permission held",
    tone: "blue",
    offset: { x: -16, y: -8 },
  },
  {
    id: "natanz",
    number: "03",
    name: "Natanz",
    country: "Iran",
    lat: 33.7,
    lon: 51.7,
    note: "Access unverified",
    tone: "red",
    offset: { x: 17, y: 12 },
  },
] as const;

export const ATLAS_LOCATIONS = CITIES;

const ARCS = [
  { from: "vienna", to: "tehran", color: 0x1a4bff, opacity: 0.9 },
  { from: "tehran", to: "natanz", color: 0xc1121f, opacity: 0.92 },
] as const;

type Point = { lat: number; lon: number };

function latLonToVector3(lat: number, lon: number, radius = 1): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function city(id: string): Point & { lat: number; lon: number } {
  const found = CITIES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown city ${id}`);
  return found;
}

function drawGeoTexture(data: unknown, width = 2048, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const project = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * width,
    ((90 - lat) / 180) * height,
  ];

  ctx.fillStyle = "#FAF7F0";
  ctx.fillRect(0, 0, width, height);

  // Fine graticule.
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(112, 101, 88, 0.09)";
  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = project(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const features = (data as { features?: Array<{ geometry?: { type: string; coordinates: unknown } }> })
    ?.features ?? [];

  const polygonsOf = (geometry: { type: string; coordinates: unknown } | undefined) => {
    if (!geometry) return [] as number[][][][];
    if (geometry.type === "Polygon") return [geometry.coordinates as number[][][]];
    if (geometry.type === "MultiPolygon") return geometry.coordinates as number[][][][];
    return [];
  };

  // Land masses and the country border linework.
  for (const feature of features) {
    for (const polygon of polygonsOf(feature.geometry)) {
      if (!polygon.length) continue;
      const [outer, ...holes] = polygon;
      ctx.beginPath();
      outer.forEach(([lon, lat], index) => {
        const [x, y] = project(lon, lat);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      holes.forEach((ring) => {
        ring.forEach(([lon, lat], index) => {
          const [x, y] = project(lon, lat);
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      });
      ctx.closePath();
      ctx.fillStyle = "#E7D8C3";
      ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(147, 126, 103, 0.18)";
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = "rgba(110, 91, 72, 0.58)";
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  }

  // A subtle land halo, then a second pass for the coast.
  ctx.globalCompositeOperation = "source-atop";
  const coastGradient = ctx.createLinearGradient(0, 0, width, height);
  coastGradient.addColorStop(0, "rgba(255, 253, 248, 0.42)");
  coastGradient.addColorStop(0.48, "rgba(255, 253, 248, 0)");
  coastGradient.addColorStop(1, "rgba(120, 100, 80, 0.06)");
  ctx.fillStyle = coastGradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  // Fine paper grain.
  for (let i = 0; i < 28000; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = Math.random() * 0.018;
    ctx.fillStyle = `rgba(70, 61, 50, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  return canvas;
}

function makeBumpTexture(width = 1024, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const image = ctx.createImageData(width, height);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 108 + Math.floor(Math.random() * 40);
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function makeArc(start: THREE.Vector3, end: THREE.Vector3, color: number, opacity: number) {
  const distance = start.distanceTo(end);
  const mid = start
    .clone()
    .add(end)
    .normalize()
    .multiplyScalar(1.07 + Math.min(0.2, distance * 0.11));
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const geometry = new THREE.TubeGeometry(curve, 80, 0.0035, 5, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const route = new THREE.Mesh(geometry, material);
  route.renderOrder = 2;
  return route;
}

function GlobeFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="relative aspect-square w-[78%] rounded-full bg-[radial-gradient(circle_at_34%_28%,#fffdf8_0%,#f2e8d9_42%,#ddccb8_76%,#c0ac96_100%)] shadow-[inset_-34px_-26px_70px_rgba(100,84,67,0.14),0_34px_70px_rgba(89,72,55,0.1)]">
        <div className="absolute inset-[5%] rounded-full border border-[#665544]/20" />
        <div className="absolute inset-x-[5%] top-1/2 h-px bg-[#665544]/20" />
        <div className="absolute inset-y-[5%] left-1/2 w-px bg-[#665544]/20" />
        <div className="absolute inset-[24%] rounded-full border border-[#665544]/15" />
        <div className="absolute left-[28%] top-[34%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A4BFF]" />
        <div className="absolute left-[61%] top-[48%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A4BFF]" />
        <div className="absolute left-[63%] top-[52%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C1121F]" />
      </div>
    </div>
  );
}

export function GeoGlobe({
  selectedId = null,
  onSelect,
  theme = "dark",
  mobileScale = 0.42,
  layout = "center",
}: {
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  theme?: "dark" | "light";
  mobileScale?: number;
  layout?: "center" | "right";
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedRef = useRef<string | null>(selectedId);
  const [active, setActive] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.pointerEvents = "none";
    mount.appendChild(renderer.domElement);
    mount.style.touchAction = "none";
    mount.style.cursor = "grab";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, width / Math.max(height, 1), 0.1, 50);
    camera.position.set(0, 0.05, 6.9);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    group.position.set(0.78, -0.08, 0);
    scene.add(group);

    const globeTexture = new THREE.CanvasTexture(document.createElement("canvas"));
    globeTexture.colorSpace = THREE.SRGBColorSpace;
    const bumpTexture = makeBumpTexture();

    const globeMaterial = new THREE.MeshStandardMaterial({
      map: globeTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.008,
      roughness: 0.7,
      metalness: 0.02,
    });

    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), globeMaterial);
    globe.rotation.y = 0;
    group.add(globe);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.018, 64, 48),
      new THREE.MeshBasicMaterial({
        color: 0xfff4e2,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      }),
    );
    group.add(atmosphere);

    const markerObjects: Array<{ id: string; object: THREE.Object3D }> = [];
    for (const item of CITIES) {
      const position = latLonToVector3(item.lat, item.lon, 1.018);
      const anchor = new THREE.Object3D();
      anchor.position.copy(position);
      group.add(anchor);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.021, 0.032, 28),
        new THREE.MeshBasicMaterial({
          color: item.tone === "red" ? 0xc1121f : 0x1a4bff,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.position.copy(position);
      ring.lookAt(position.clone().multiplyScalar(2));
      ring.renderOrder = 3;
      group.add(ring);

      const core = new THREE.Mesh(
        new THREE.CircleGeometry(0.009, 20),
        new THREE.MeshBasicMaterial({
          color: 0xfff8ea,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      core.position.copy(position).multiplyScalar(1.002);
      core.lookAt(core.position.clone().multiplyScalar(2));
      core.renderOrder = 4;
      group.add(core);

      markerObjects.push({ id: item.id, object: anchor });
    }

    for (const arc of ARCS) {
      const from = city(arc.from);
      const to = city(arc.to);
      group.add(
        makeArc(
          latLonToVector3(from.lat, from.lon, 1.012),
          latLonToVector3(to.lat, to.lon, 1.012),
          arc.color,
          arc.opacity,
        ),
      );
    }

    scene.add(new THREE.AmbientLight(0xfff8ec, 0.88));
    const key = new THREE.DirectionalLight(0xfff7e8, 2.0);
    key.position.set(-3.2, 4.2, 4.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe9ff, 0.55);
    fill.position.set(4.5, -1, 2.2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff2dd, 0.7);
    rim.position.set(-4, -2.4, -3.8);
    scene.add(rim);

    const applyLayout = () => {
      const desktop = window.innerWidth >= 768;
      if (desktop) {
        if (layout === "right") {
          group.position.x = 1.55;
          group.position.y = 0.12;
          group.scale.setScalar(1.22);
        } else {
          group.position.x = 0.1;
          group.position.y = 0.34;
          group.scale.setScalar(1.2);
        }
      } else {
        group.position.x = 0;
        group.position.y = -0.48;
        group.scale.setScalar(mobileScale);
      }
    };
    applyLayout();

    let pointerX = 0;
    let pointerY = 0;
    let autoRotation = 0;
    let targetRotationX = -0.04;
    const BASE_Y = (-138 * Math.PI) / 180;
    let targetRotationY = BASE_Y;
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let resumeAt = 0;
    let previousSelected: string | null = null;
    group.rotation.y = targetRotationY;
    group.rotation.x = targetRotationX;

    const stopDragging = () => {
      if (!dragging) return;
      dragging = false;
      mount.style.cursor = "grab";
      resumeAt = Date.now() + 2200;
    };

    const onDragStart = (event: PointerEvent) => {
      dragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      mount.style.cursor = "grabbing";
    };

    const onDragMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      targetRotationY += dx * 0.005;
      targetRotationX = Math.max(-0.55, Math.min(0.55, targetRotationX + dy * 0.0035));
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = Math.max(4.9, Math.min(8.8, camera.position.z + event.deltaY * 0.0016));
      camera.updateProjectionMatrix();
      resumeAt = Date.now() + 2200;
    };

    mount.addEventListener("pointerdown", onDragStart);
    window.addEventListener("pointermove", onDragMove, { passive: true });
    window.addEventListener("pointerup", stopDragging);
    mount.addEventListener("wheel", onWheel, { passive: false });

    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion) return;
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let frame = 0;
    const clock = new THREE.Clock();
    const projected = new THREE.Vector3();

    const updateMarkerLabels = () => {
      const bounds = mount.getBoundingClientRect();
      for (const marker of markerObjects) {
        const el = markerRefs.current[marker.id];
        if (!el) continue;
        marker.object.getWorldPosition(projected);
        const behind = projected.z < -0.04;
        projected.project(camera);
        const cityData = CITIES.find((entry) => entry.id === marker.id);
        const x = (projected.x * 0.5 + 0.5) * bounds.width + (cityData?.offset.x ?? 0);
        const y = (-projected.y * 0.5 + 0.5) * bounds.height + (cityData?.offset.y ?? 0);
        const visible = !behind && projected.z < 1;
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        el.style.opacity = visible ? "1" : "0";
        el.style.pointerEvents = visible ? "auto" : "none";
      }
    };

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const focus = selectedRef.current
        ? CITIES.find((entry) => entry.id === selectedRef.current)
        : undefined;
      if (!reduceMotion && !focus && !dragging && Date.now() > resumeAt) {
        autoRotation += delta * 0.025;
        targetRotationY = BASE_Y + autoRotation + pointerX * 0.1;
        targetRotationX = -0.04 + pointerY * 0.06;
      }
      if (focus) {
        const p = latLonToVector3(focus.lat, focus.lon, 1);
        targetRotationY = Math.atan2(-p.x, p.z);
        targetRotationX = 0;
        previousSelected = focus.id;
      } else if (previousSelected) {
        autoRotation = group.rotation.y - BASE_Y;
        previousSelected = null;
      }
      const layoutMobile = camera.aspect < 1.08;
      const targetGroupY = layoutMobile ? (focus ? 0.34 : -0.48) : layout === "right" ? -0.06 : 0.3;
      group.position.y += (targetGroupY - group.position.y) * 0.055;
      group.rotation.y += (targetRotationY - group.rotation.y) * 0.035;
      group.rotation.x += (targetRotationX - group.rotation.x) * 0.035;
      renderer.render(scene, camera);
      updateMarkerLabels();
    };

    const ro = new ResizeObserver(() => {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      if (!nextWidth || !nextHeight) return;
      renderer.setSize(nextWidth, nextHeight, false);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      applyLayout();
    });
    ro.observe(mount);

    let disposed = false;
    fetch("/geo/countries.geojson")
      .then((response) => response.json())
      .then((data) => {
        if (disposed) return;
        const texture = new THREE.CanvasTexture(drawGeoTexture(data));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        globeMaterial.map = texture;
        globeMaterial.needsUpdate = true;
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setReady(true);
      });

    setReady(false);
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerdown", onDragStart);
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", stopDragging);
      mount.removeEventListener("wheel", onWheel);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
          else material.dispose();
        }
      });
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
      {failed ? <GlobeFallback /> : null}
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready || failed ? "opacity-100" : "opacity-0"}`}>
        {CITIES.map((item) => {
          const isActive = active === item.id || selectedId === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                markerRefs.current[item.id] = el;
              }}
              type="button"
              aria-label={`${item.number} ${item.name}, ${item.country}`}
              onPointerEnter={() => setActive(item.id)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(item.id)}
              onBlur={() => setActive(null)}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setActive(item.id);
                onSelect?.(item.id);
              }}
              className="group absolute left-0 top-0 flex cursor-pointer flex-col items-center opacity-0 transition-opacity duration-300"
              style={{ willChange: "transform" }}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[8px] font-bold tracking-[0.04em] shadow-[0_2px_8px_rgba(40,30,20,0.18)] transition-colors ${
                  item.tone === "red"
                    ? "border-[#C1121F]/32 bg-[#FFFCF7] text-[#C1121F]"
                    : "border-[#1A4BFF]/28 bg-[#FFFCF7] text-[#1A3FCC]"
                } ${isActive ? "scale-110" : ""} ${selectedId === item.id ? "ring-2 ring-[#1A4BFF]/40 ring-offset-2 ring-offset-[#0B0907]" : ""}`}
              >
                {item.number}
              </span>
              <span
                className={`absolute left-8 top-1/2 hidden -translate-y-1/2 whitespace-nowrap border px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] shadow-[0_4px_14px_rgba(0,0,0,0.14)] transition-colors md:block ${
                  theme === "light"
                    ? "border-[#1A1A1A]/15 bg-[#FFFCF7] text-[#1A1A1A]/65"
                    : "border-[#2A2118]/20 bg-[#F2E7D5] text-[#1A1410]/75"
                } ${isActive ? "border-[#1A4BFF]/35 !text-[#1A4BFF]" : ""}`}
              >
                {item.name}
                <span className="hidden">
                  {item.country} · {item.note}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
