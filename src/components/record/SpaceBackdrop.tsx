import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const vertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(13.1, 7.7);
    amplitude *= 0.5;
  }
  return value;
}

float starLayer(vec2 uv, float scale, float time, float seed) {
  vec2 p = uv * scale;
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  float h = hash21(id + seed);
  vec2 jitter = vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5;
  float d = length(f - jitter * 0.55);
  float core = exp(-d * d * 260.0);
  float halo = exp(-d * d * 42.0) * 0.12;
  float twinkle = 0.55 + 0.45 * sin(time * (0.5 + h) + h * 21.0);
  return (core * 1.35 + halo) * step(0.952, h) * twinkle;
}

float brightStar(vec2 uv, vec2 at, float tightness, float time, float seed) {
  vec2 d = (uv - at) * vec2(1.777, 1.0);
  float core = exp(-dot(d, d) * tightness);
  float flareX = exp(-abs(d.x) * 760.0) * exp(-abs(d.y) * 24.0);
  float flareY = exp(-abs(d.y) * 760.0) * exp(-abs(d.x) * 24.0);
  float pulse = 0.82 + 0.18 * sin(time * 0.35 + seed);
  return (core + (flareX + flareY) * 0.42) * pulse;
}

void main() {
  vec2 uv = vUv;
  uv += (uMouse - 0.5) * 0.012;

  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * aspect * 2.2 + vec2(0.14, -0.04);
  float t = uTime * 0.006;

  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t),
    fbm(p + vec2(5.2, 1.3) - t * 0.7)
  );
  vec2 r = vec2(
    fbm(p + 1.7 * q + vec2(1.7, 9.2) + t * 0.35),
    fbm(p + 1.7 * q + vec2(8.3, 2.8) - t * 0.25)
  );
  float f = fbm(p + 2.05 * r);
  float filaments = fbm(p * 3.6 + 1.4 * q + vec2(3.1, 8.4) + t * 0.5);
  float ridges = 1.0 - abs(fbm(p * 4.8 - 0.8 * r + vec2(11.0, 2.0)) * 2.0 - 1.0);
  float details = fbm(p * 6.4 + 2.2 * r + vec2(4.2, 12.1) + t * 0.18);
  float dustLane = smoothstep(0.48, 0.72, fbm(p * 3.1 + vec2(8.0, 4.2) - t * 0.12));

  vec3 col = vec3(0.004, 0.006, 0.014);
  float density = smoothstep(0.28, 0.8, f);
  col = mix(col, vec3(0.022, 0.055, 0.16), density * 1.45);
  col = mix(col, vec3(0.14, 0.035, 0.12), smoothstep(0.44, 0.82, r.x) * 0.48);
  col = mix(col, vec3(0.28, 0.065, 0.028), smoothstep(0.58, 0.86, f) * 0.34);
  col += vec3(0.035, 0.10, 0.24) * smoothstep(0.58, 0.82, filaments) * 0.34;
  col += vec3(0.16, 0.035, 0.08) * smoothstep(0.60, 0.86, ridges) * 0.24;
  col += vec3(0.055, 0.12, 0.25) * smoothstep(0.52, 0.75, details) * 0.3;
  col *= 1.0 - dustLane * 0.24;

  float core = exp(-length((uv - vec2(0.64, 0.28)) * aspect * 2.4) * 2.6);
  col += vec3(0.12, 0.06, 0.18) * core * 0.42;

  float plume = smoothstep(0.34, 0.88, fbm(p * 1.35 + vec2(2.4, -1.2) + t * 0.35));
  col += mix(vec3(0.012, 0.035, 0.11), vec3(0.22, 0.05, 0.09), plume) * plume * 0.6;

  float eyeGlow = exp(-length((uv - vec2(0.73, 0.44)) * aspect * 3.1) * 2.2);
  col += vec3(0.03, 0.075, 0.20) * eyeGlow * 1.1;

  float stars =
    starLayer(uv, 760.0, uTime, 0.7) +
    starLayer(uv, 380.0, uTime, 2.3) * 0.95 +
    starLayer(uv, 180.0, uTime, 5.9) * 0.7;
  col += vec3(0.86, 0.9, 1.0) * stars;
  col += vec3(0.9, 0.94, 1.0) * brightStar(uv, vec2(0.18, 0.22), 9000.0, uTime, 1.0) * 0.9;
  col += vec3(1.0, 0.92, 0.82) * brightStar(uv, vec2(0.87, 0.16), 11000.0, uTime, 4.0) * 0.75;
  col += vec3(0.72, 0.82, 1.0) * brightStar(uv, vec2(0.31, 0.76), 13000.0, uTime, 7.0) * 0.6;

  float dustBand = exp(-pow((uv.y - 0.58 + (uv.x - 0.5) * 0.22) / 0.15, 2.0));
  float dust = smoothstep(0.42, 0.7, fbm(p * 2.4 + vec2(7.0, 2.0)));
  col += vec3(0.055, 0.07, 0.13) * dustBand * 0.5;
  col *= 1.0 - dust * 0.12;

  float grain = hash21(uv * uResolution + uTime) - 0.5;
  col += grain * 0.012;

  float vignette = smoothstep(1.3, 0.28, length((uv - 0.5) * vec2(aspect.x, 1.0)));
  col *= mix(0.58, 1.0, vignette);
  col = col / (1.0 + col * 0.35);
  col = pow(col, vec3(0.92));

  gl_FragColor = vec4(col, 1.0);
}
`;

export function SpaceBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      uniforms.uResolution.value.set(rect.width, rect.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const pointer = (event: PointerEvent) => {
      uniforms.uMouse.value.set(event.clientX / window.innerWidth, event.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", pointer, { passive: true });

    let frame = 0;
    const start = performance.now();
    const render = () => {
      const elapsed = reduced ? 8 : (performance.now() - start) / 1000;
      uniforms.uTime.value = elapsed;
      renderer.render(scene, camera);
      if (!reduced) frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", pointer);
      renderer.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden bg-[#05070C]" aria-hidden="true">
      {failed ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_44%,#101a33_0%,#05070C_58%)]" /> : null}
    </div>
  );
}
