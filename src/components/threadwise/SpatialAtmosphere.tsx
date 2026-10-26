import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A deliberately quiet Three.js layer. It gives the board depth and orientation,
 * but never owns pointer events or encodes graph state, so the canvas remains usable
 * on low-end devices and with reduced motion enabled.
 */
export function SpatialAtmosphere({ density = 1 }: { density?: number }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    element.appendChild(renderer.domElement);

    const amount = Math.max(28, Math.min(88, 36 + density * 5));
    const positions = new Float32Array(amount * 3);
    for (let i = 0; i < amount; i++) {
      const angle = i * 2.39996;
      const radius = 0.12 + Math.sqrt(i / amount) * 1.32;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.72;
      positions[i * 3 + 2] = ((i % 7) - 3) * 0.02;
    }
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({ color: 0xb56d38, size: 0.009, transparent: true, opacity: 0.36, sizeAttenuation: false }),
    );
    scene.add(points);

    const orbitGeometry = new THREE.BufferGeometry();
    const orbit = new Float32Array(128 * 3);
    for (let i = 0; i < 128; i++) {
      const angle = (i / 127) * Math.PI * 2;
      orbit[i * 3] = Math.cos(angle) * 0.72;
      orbit[i * 3 + 1] = Math.sin(angle) * 0.28;
      orbit[i * 3 + 2] = -0.02;
    }
    orbitGeometry.setAttribute("position", new THREE.BufferAttribute(orbit, 3));
    const orbitLine = new THREE.Line(
      orbitGeometry,
      new THREE.LineBasicMaterial({ color: 0x9e7859, transparent: true, opacity: 0.18 }),
    );
    scene.add(orbitLine);

    const pointer = new THREE.Vector2();
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth - 0.5;
      pointer.y = event.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    let frame = 0;
    const render = (time: number) => {
      if (!reduceMotion) {
        const t = time * 0.00008;
        points.rotation.z += (pointer.x * 0.0012 - points.rotation.z * 0.002) + 0.00006;
        points.position.x += (pointer.x * 0.06 - points.position.x) * 0.015;
        points.position.y += (-pointer.y * 0.045 - points.position.y) * 0.015;
        orbitLine.rotation.z = t + pointer.x * 0.18;
        points.material.opacity = 0.28 + Math.sin(t * 8) * 0.07;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      pointsGeometry.dispose();
      orbitGeometry.dispose();
      (points.material as THREE.Material).dispose();
      (orbitLine.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [density]);

  return <div className="tw-spatial-atmosphere" aria-hidden ref={host} />;
}
