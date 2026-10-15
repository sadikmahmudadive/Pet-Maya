/* Maya Halo — procedural 3D collar + scroll-driven scene (three.js, no external assets).
 *
 * Everything on screen is built from code: strap, buckle, D-ring, the halo module and its
 * internals (23 parts that can fly apart and reassemble). `setProgress(p)` (0..1) drives the
 * whole film deterministically, so scrubbing forwards/backwards always shows the same frame.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const smoother = (x) => { x = clamp01(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;

export const COLORS = { bg: 0x050607, accent: 0x5fe0d2, accentDeep: 0x35727d };

/* ── geometry helpers ─────────────────────────────────────────────────────────── */

/** Rounded-rectangle profile in (dr, z) with analytic normals; starts/ends at (hw, 0). */
function roundedProfile(hw, hz, c, n = 4) {
  const pts = [];
  const add = (dr, z, ndr, nz) => pts.push({ dr, z, ndr, nz });
  add(hw, 0, 1, 0);
  const arc = (cx, cz, a0) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      add(cx + c * Math.cos(a), cz + c * Math.sin(a), Math.cos(a), Math.sin(a));
    }
  };
  arc(hw - c, hz - c, 0);
  arc(-hw + c, hz - c, Math.PI / 2);
  arc(-hw + c, -hz + c, Math.PI);
  arc(hw - c, -hz + c, 1.5 * Math.PI);
  add(hw, 0, 1, 0);
  return pts;
}

/** Sweeps a rounded-rectangle cross-section along an arc of radius R in the XY plane. */
function sweepArc({ R, a0, a1, hw, hz, c = 0.016, n = 3, step = 0.03, uvScale = 0.12 }) {
  const prof = roundedProfile(hw, hz, c, n);
  const P = prof.length;
  const cum = [0];
  for (let i = 1; i < P; i++) cum.push(cum[i - 1] + Math.hypot(prof[i].dr - prof[i - 1].dr, prof[i].z - prof[i - 1].z));
  // whole number of weave tiles around the profile, so the texture meets itself at the seam
  const vTiles = Math.max(1, Math.round(cum[P - 1] / uvScale));
  const S = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  const pos = [], nor = [], uv = [], idx = [];
  for (let k = 0; k <= S; k++) {
    const th = a0 + ((a1 - a0) * k) / S;
    const cx = Math.cos(th), sy = Math.sin(th);
    const arcLen = Math.abs(th - a0) * R;
    for (let j = 0; j < P; j++) {
      const p = prof[j];
      const r = R + p.dr;
      pos.push(cx * r, sy * r, p.z);
      nor.push(cx * p.ndr, sy * p.ndr, p.nz);
      uv.push(arcLen / uvScale, (cum[j] / cum[P - 1]) * vTiles);
    }
  }
  for (let k = 0; k < S; k++) {
    for (let j = 0; j < P - 1; j++) {
      const a = k * P + j, b = a + 1, cc = a + P, d = cc + 1;
      idx.push(a, cc, b, b, cc, d);
    }
  }
  fixWinding(pos, nor, idx, 0, idx.length);

  // end caps (profile polygon fanned around its centre)
  const cap = (th, sign) => {
    const cx = Math.cos(th), sy = Math.sin(th);
    const tx = -sy * sign, ty = cx * sign; // outward normal = ±tangent
    const base = pos.length / 3;
    pos.push(cx * R, sy * R, 0); nor.push(tx, ty, 0); uv.push(0.5, 0.5);
    for (let j = 0; j < P - 1; j++) {
      const p = prof[j];
      pos.push(cx * (R + p.dr), sy * (R + p.dr), p.z); nor.push(tx, ty, 0); uv.push(0.5 + p.dr / (hw * 4), 0.5 + p.z / (hz * 4));
    }
    const start = idx.length;
    for (let j = 0; j < P - 1; j++) idx.push(base, base + 1 + j, base + 1 + ((j + 1) % (P - 1)));
    fixWinding(pos, nor, idx, start, idx.length);
  };
  cap(a0, -Math.sign(a1 - a0));
  cap(a1, Math.sign(a1 - a0));

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingBox();
  return g;
}

/** Flips a triangle range so face normals agree with the supplied vertex normals. */
function fixWinding(pos, nor, idx, from, to) {
  const v = (i) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  const a = idx[from], b = idx[from + 1], c = idx[from + 2];
  const face = new THREE.Vector3().subVectors(v(b), v(a)).cross(new THREE.Vector3().subVectors(v(c), v(a)));
  const n = new THREE.Vector3(nor[a * 3], nor[a * 3 + 1], nor[a * 3 + 2]);
  if (face.dot(n) < 0) for (let i = from; i < to; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
}

function weaveTexture() {
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const cell = 8;
  for (let y = 0; y < s / cell; y++) {
    for (let x = 0; x < s / cell; x++) {
      const up = (x + y) % 4 < 2;
      const v = (up ? 178 : 112) + ((x * 7 + y * 13) % 5) * 3;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x * cell, y * cell, cell, cell);
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(x * cell, y * cell + cell - 1, cell, 1);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function glowTexture(size = 256) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── the product ──────────────────────────────────────────────────────────────── */

const R = 1.0;            // collar radius (strap centre line)
const STRAP_HW = 0.025;   // half thickness
const STRAP_HZ = 0.25;    // half width
const PS = 1.1;           // module scale
const PUCK_Y = 1.052;     // base of the halo module (on top of the mount)

function mulberry(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function buildCollar() {
  const root = new THREE.Group();   // turntable
  const parts = [];                 // {group, base, exp:{pos,rot}, delay, bob}
  const mats = {};
  const weave = weaveTexture();

  mats.strap = new THREE.MeshStandardMaterial({ color: 0x4a545b, roughness: 0.78, metalness: 0.05, bumpMap: weave, bumpScale: 0.9, map: weave });
  mats.strap.map.colorSpace = THREE.SRGBColorSpace;
  mats.keeper = new THREE.MeshStandardMaterial({ color: 0x3d474e, roughness: 0.7, metalness: 0.05, bumpMap: weave, bumpScale: 0.8 });
  mats.graphite = new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.42, metalness: 0.5 });
  mats.titanium = new THREE.MeshStandardMaterial({ color: 0x9ea5a9, roughness: 0.38, metalness: 1, envMapIntensity: 0.8 });
  mats.dark = new THREE.MeshStandardMaterial({ color: 0x07090a, roughness: 0.5, metalness: 0.2 });
  mats.glass = new THREE.MeshPhysicalMaterial({ color: 0x03080a, roughness: 0.28, metalness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.22, envMapIntensity: 0.3 });
  mats.halo = new THREE.MeshStandardMaterial({ color: 0x0a2b29, emissive: COLORS.accent, emissiveIntensity: 0.0, roughness: 0.4 });
  mats.led = new THREE.MeshStandardMaterial({ color: 0x0a2b29, emissive: COLORS.accent, emissiveIntensity: 0.0 });
  mats.battery = new THREE.MeshStandardMaterial({ color: 0x9db4bb, roughness: 0.35, metalness: 0.85 });
  mats.pcb = new THREE.MeshStandardMaterial({ color: 0x0d4a45, roughness: 0.5, metalness: 0.2 });
  mats.chip = new THREE.MeshStandardMaterial({ color: 0x101214, roughness: 0.4, metalness: 0.3 });
  mats.stitch = new THREE.MeshStandardMaterial({ color: 0x2f9a93, emissive: 0x1a6f6b, emissiveIntensity: 0.4, roughness: 0.6 });

  const rnd = mulberry(7);
  const add = (id, geom, mat, exp, delay, opts = {}) => {
    geom.computeBoundingBox();
    const centre = geom.boundingBox.getCenter(new THREE.Vector3());
    geom.translate(-centre.x, -centre.y, -centre.z);
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);
    group.position.copy(centre);
    root.add(group);
    const rot = exp.rot || [(rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6];
    parts.push({
      id, group, mesh, centre, delay,
      expPos: new THREE.Vector3(...exp.pos),
      expRot: new THREE.Euler(...rot),
      bob: opts.bob ?? 0.05, phase: rnd() * TAU,
    });
    return group;
  };

  // — strap (three segments) with stitching —
  const stitches = (group, a0, a1, centre) => {
    const step = 0.075, count = Math.floor((a1 - a0) / step);
    const g = new THREE.BoxGeometry(0.05, 0.004, 0.008);
    const im = new THREE.InstancedMesh(g, mats.stitch, count * 2);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    let i = 0;
    for (const z of [STRAP_HZ - 0.05, -(STRAP_HZ - 0.05)]) {
      for (let k = 0; k < count; k++) {
        const th = a0 + step * (k + 0.5);
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), th + Math.PI / 2);
        p.set(Math.cos(th) * (R + STRAP_HW + 0.0012), Math.sin(th) * (R + STRAP_HW + 0.0012), z).sub(centre);
        m.compose(p, q, s);
        im.setMatrixAt(i++, m);
      }
    }
    group.add(im);
  };
  const strapSeg = (id, a0, a1, exp, delay) => {
    const g = sweepArc({ R, a0, a1, hw: STRAP_HW, hz: STRAP_HZ, c: 0.018, uvScale: 0.5 });
    const grp = add(id, g, mats.strap, exp, delay, { bob: 0.07 });
    stitches(grp, a0, a1, parts[parts.length - 1].centre);
  };
  const top = Math.PI / 2, bottom = -Math.PI / 2;
  strapSeg('strap-right', bottom + 0.17, top - 0.36, { pos: [2.6, -0.4, -0.8], rot: [0.5, 1.1, -0.5] }, 0.0);
  strapSeg('strap-left', top + 0.36, 3 * Math.PI / 2 - 0.17, { pos: [-2.6, -0.4, -0.8], rot: [0.4, -1.2, 0.6] }, 0.04);
  strapSeg('strap-mid', top - 0.36, top + 0.36, { pos: [0, -0.2, -2.2], rot: [0.9, 0.2, 0.2] }, 0.08);

  // — keepers (two small loops around the strap near the buckle) —
  for (const [i, s] of [[0, 1], [1, -1]]) {
    const a = bottom + s * 0.55;
    const g = sweepArc({ R, a0: a - 0.07, a1: a + 0.07, hw: 0.034, hz: STRAP_HZ + 0.014, c: 0.02, uvScale: 0.5 });
    add(`keeper-${i}`, g, mats.keeper, { pos: [s * 1.7, -1.1, 0.9] }, 0.14);
  }

  // — buckle + slot + D-ring —
  const buckleR = R + STRAP_HW + 0.02;
  const bg = sweepArc({ R: buckleR, a0: bottom - 0.19, a1: bottom + 0.19, hw: 0.02, hz: STRAP_HZ + 0.018, c: 0.02, uvScale: 0.5 });
  const buckle = add('buckle', bg, mats.titanium, { pos: [0.9, -1.1, 0.8], rot: [0.5, 0.6, 0.2] }, 0.18);
  const slot = sweepArc({ R: buckleR + 0.021, a0: bottom - 0.12, a1: bottom + 0.12, hw: 0.004, hz: 0.06, c: 0.003 });
  const bc = parts[parts.length - 1].centre;
  slot.translate(-bc.x, -bc.y, -bc.z);
  buckle.add(new THREE.Mesh(slot, mats.dark));
  const ringG = new THREE.TorusGeometry(0.09, 0.018, 16, 48);
  ringG.translate(0, -(buckleR + 0.04 + 0.09), 0);
  add('d-ring', ringG, mats.titanium, { pos: [-1.0, -1.4, 0.9], rot: [1.0, 0.4, 0.3] }, 0.2, { bob: 0.09 });

  // — mount + screws —
  const mountR = R + STRAP_HW + 0.02;
  add('mount', sweepArc({ R: mountR, a0: top - 0.34, a1: top + 0.34, hw: 0.02, hz: STRAP_HZ - 0.015, c: 0.016, uvScale: 0.5 }), mats.graphite, { pos: [0, 0.65, 0], rot: [0.1, 0.0, 0.0] }, 0.26);
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sa, sz], i) => {
    const th = top + sa * 0.27;
    const g = new THREE.CylinderGeometry(0.014, 0.014, 0.022, 14);
    g.rotateZ(th - Math.PI / 2);
    g.translate(Math.cos(th) * (mountR + 0.03), Math.sin(th) * (mountR + 0.03), sz * 0.16);
    add(`screw-${i}`, g, mats.titanium, { pos: [sa * 0.95 + (i % 2) * 0.1, 1.15 + i * 0.1, sz * 0.9] }, 0.6, { bob: 0.08 });
  });

  // — the halo module (stack along +Y), scaled by PS —
  const lathe = (pts, seg = 72) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  // scale about the module axis, then lift to its place on the mount
  const place = (g, x = 0, y = 0, z = 0) => { g.scale(PS, PS, PS); g.translate(x * PS, PUCK_Y + y * PS, z * PS); return g; };
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.42, metalness: 0.5, side: THREE.DoubleSide });
  const cupPts = [[0.0, 0], [0.205, 0], [0.222, 0.006], [0.23, 0.02], [0.23, 0.085], [0.214, 0.085], [0.214, 0.022], [0.0, 0.022]];
  add('housing', place(lathe(cupPts)), shellMat, { pos: [0.5, 1.0, 0], rot: [0.5, 0.2, 0.15] }, 0.32);

  add('battery', place(new THREE.CylinderGeometry(0.19, 0.19, 0.034, 56), 0, 0.04), mats.battery, { pos: [-0.5, 1.4, 0.2], rot: [0.6, 0.0, -0.3] }, 0.38);
  add('circuit-board', place(new THREE.CylinderGeometry(0.2, 0.2, 0.011, 56), 0, 0.066), mats.pcb, { pos: [0.55, 1.75, -0.2], rot: [-0.5, 0.2, 0.25] }, 0.44);
  [[-0.07, 0.04, 0.07, 0.045], [0.06, -0.05, 0.06, 0.04], [0.0, 0.1, 0.05, 0.05]].forEach(([x, z, sx, sz], i) => {
    const g = new THREE.BoxGeometry(sx * 1.6, 0.012, sz * 1.6);
    add(`chip-${['gps', 'lora', 'mcu'][i]}`, place(g, x, 0.078, z), mats.chip, { pos: [(i - 1) * 0.7 - 0.4, 2.1 + i * 0.12, 0.6 - i * 0.5] }, 0.5 + i * 0.03, { bob: 0.09 });
  });
  const capPts = [[0.0, 0.0], [0.23, 0.0], [0.23, 0.026], [0.218, 0.044], [0.2, 0.05], [0.172, 0.05], [0.172, 0.046], [0.0, 0.046]];
  add('cap', place(lathe(capPts), 0, 0.085), shellMat, { pos: [-0.5, 2.5, 0], rot: [0.5, -0.2, -0.2] }, 0.58);
  add('glass', place(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 64), 0, 0.085 + 0.043), mats.glass, { pos: [0.45, 2.85, 0.2], rot: [0.55, 0.1, 0.1] }, 0.64);
  const halo = new THREE.TorusGeometry(0.186, 0.0105, 16, 96); halo.rotateX(Math.PI / 2);
  add('halo-ring', place(halo, 0, 0.085 + 0.05), mats.halo, { pos: [0, 3.25, 0], rot: [0.5, 0.0, 0.1] }, 0.72, { bob: 0.1 });
  add('status-led', place(new THREE.SphereGeometry(0.014, 16, 12), 0, 0.085 + 0.052), mats.led, { pos: [0.55, 3.55, 0.3] }, 0.78, { bob: 0.1 });
  const ant = new THREE.CapsuleGeometry(0.02, 0.1, 6, 14); ant.rotateZ(Math.PI / 2);
  add('antenna', place(ant, 0.3, 0.07), mats.graphite, { pos: [1.7, 1.2, 0.4], rot: [0.4, 0.3, 1.0] }, 0.66);

  // soft light that the lit halo throws onto the module and strap
  const haloLight = new THREE.PointLight(COLORS.accent, 0, 2.6, 1.6);
  haloLight.position.set(0, PUCK_Y + 0.4, 0.25);
  root.add(haloLight);

  return { root, parts, mats, haloLight };
}

/* ── scene ────────────────────────────────────────────────────────────────────── */

export function createHalo(canvas, { onReady } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(COLORS.bg, 1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);

  // lights: cool key from upper-left, teal rim from behind-right, faint warm fill
  const key = new THREE.DirectionalLight(0xeaf2ff, 3.2); key.position.set(-3.5, 4.5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(COLORS.accent, 1.8); rim.position.set(4, 1.5, -4.5); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x6fb8ff, 1.2); rim2.position.set(-4, -1, -3); scene.add(rim2);
  const fill = new THREE.DirectionalLight(0xffe9d6, 0.9); fill.position.set(3, -2, 4); scene.add(fill);

  const { root, parts, mats, haloLight } = buildCollar();
  scene.add(root);

  // glow pool under the collar + radar floor
  const glowTex = glowTexture();
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: glowTex, color: COLORS.accentDeep, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -1.62; scene.add(pool);

  const floorMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0 }, uPhase: { value: 0 }, uColor: { value: new THREE.Color(COLORS.accent) } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      varying vec2 vP; uniform float uOpacity; uniform float uPhase; uniform vec3 uColor;
      float grid(vec2 p, float s){ vec2 g = abs(fract(p/s - 0.5) - 0.5) / fwidth(p/s); return 1.0 - min(min(g.x, g.y), 1.0); }
      void main(){
        float d = length(vP);
        float fade = smoothstep(11.0, 1.5, d);
        float g = grid(vP, 0.8) * 0.5 + grid(vP, 4.0) * 0.5;
        float rings = 0.0;
        for (int i = 0; i < 4; i++) {
          float r = fract(uPhase + float(i) * 0.25) * 10.0;
          rings += exp(-pow((d - r) / 0.16, 2.0)) * (1.0 - r / 10.0);
        }
        float a = (g * 0.22 * fade + rings * 0.9 + exp(-d * 0.9) * 0.25) * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.6; floor.frustumCulled = false; scene.add(floor);

  // beacon + LoRa links to gateways
  const beaconMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(COLORS.accent) } },
    vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float vY; uniform float uOpacity; uniform vec3 uColor; void main(){ float a = smoothstep(3.5, -3.5, vY) * uOpacity; gl_FragColor = vec4(uColor * a, a); }',
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.05, 7, 16, 1, true), beaconMat);
  scene.add(beacon);
  const gateways = [[-4.2, -1.6, -2.4], [3.8, -1.6, -3.4], [1.6, -1.6, 4.6], [-2.4, -1.6, 4.0]];
  const gwGroup = new THREE.Group(); scene.add(gwGroup);
  const gwMat = new THREE.MeshBasicMaterial({ color: COLORS.accent, transparent: true, opacity: 0 });
  const linkMats = [];
  const links = gateways.map(([x, y, z]) => {
    const tower = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.9, 8), gwMat);
    pole.position.y = 0.45; tower.add(pole);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), gwMat); tip.position.y = 0.93; tower.add(tip);
    tower.position.set(x, y, z); gwGroup.add(tower);
    const lm = new THREE.LineDashedMaterial({ color: COLORS.accent, dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0 });
    linkMats.push(lm);
    const line = new THREE.Line(new THREE.BufferGeometry(), lm); line.frustumCulled = false; scene.add(line);
    return { line, tower: new THREE.Vector3(x, y + 0.93, z), curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()) };
  });

  // dust / starfield for depth
  const dust = (() => {
    const n = 520, pos = new Float32Array(n * 3), r = mulberry(11);
    for (let i = 0; i < n; i++) {
      const rad = 3 + r() * 11, th = r() * TAU, ph = Math.acos(2 * r() - 1);
      pos[i * 3] = rad * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = (rad * Math.cos(ph)) * 0.7; pos[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: 0xbfeee8, size: 0.028, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
    const pts = new THREE.Points(g, m); scene.add(pts); return pts;
  })();

  // post: bloom makes the lit halo glow
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.4, 0.65, 0.78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  /* camera path — keys at chapter boundaries (dist, target Y, azimuth, elevation) */
  const KEYS = [
    { p: 0.00, d: 12.8, ty: 0.75, az: 0.45, el: 0.14 },
    { p: 0.12, d: 11.0, ty: 0.7, az: 0.25, el: 0.18 },
    { p: 0.27, d: 5.8, ty: 0.15, az: 0.05, el: 0.16 },
    { p: 0.31, d: 5.6, ty: 0.15, az: 0.0, el: 0.14 },
    { p: 0.385, d: 2.9, ty: 1.06, az: -0.12, el: 0.34 },
    { p: 0.47, d: 3.1, ty: 1.0, az: 0.1, el: 0.3 },
    { p: 0.52, d: 5.5, ty: 0.05, az: 0.0, el: 0.12 },
    { p: 0.66, d: 5.5, ty: 0.05, az: 0.0, el: 0.12 },
    { p: 0.74, d: 7.4, ty: -0.3, az: 0.2, el: 0.42 },
    { p: 0.88, d: 9.4, ty: -0.55, az: -0.25, el: 0.58 },
    { p: 0.945, d: 4.6, ty: 0.55, az: 0.0, el: 0.24, tx: -0.2 },
    { p: 1.00, d: 3.4, ty: 0.7, az: 0.12, el: 0.26, tx: -1.15 },
  ];
  const cam = { d: 6, ty: 0, az: 0, el: 0.1, tx: 0 };
  function sampleCamera(p) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = smoother((p - a.p) / (b.p - a.p));
    cam.d = lerp(a.d, b.d, t); cam.ty = lerp(a.ty, b.ty, t); cam.az = lerp(a.az, b.az, t); cam.el = lerp(a.el, b.el, t);
    cam.tx = lerp(a.tx ?? 0, b.tx ?? 0, t);
  }

  const state = { p: 0, time: 0, aspect: 1.6, mx: 0, my: 0, override: null, reduced: false };
  const puckTop = new THREE.Vector3(), mid = new THREE.Vector3();

  function apply(p, time) {
    // 1 — assembly (reverse-explosion): the parts fly together between p=.035 and p=.255
    const a = smoother((p - 0.035) / 0.22);
    for (const part of parts) {
      const ai = smoother((a - part.delay * 0.42) / 0.58);
      const k = 1 - ai;
      const bob = state.reduced ? 0 : Math.sin(time * 0.9 + part.phase) * part.bob * k;
      part.group.position.set(part.centre.x + part.expPos.x * k, part.centre.y + part.expPos.y * k + bob, part.centre.z + part.expPos.z * k);
      part.group.rotation.set(part.expRot.x * k, part.expRot.y * k, part.expRot.z * k);
    }

    // 2 — ignition: halo lights up (with a flash) at p≈.37
    const ramp = smooth((p - 0.315) / 0.06);
    const flash = Math.exp(-Math.pow((p - 0.372) / 0.012, 2));
    const breathe = state.reduced ? 0 : 0.16 * Math.sin(time * 2.1) * ramp;
    mats.halo.emissiveIntensity = 0.04 + ramp * 2.3 + flash * 2.6 + breathe;
    mats.led.emissiveIntensity = ramp > 0.6 ? 2.2 + 0.6 * Math.sin(time * 5) * (state.reduced ? 0 : 1) : 0;
    haloLight.intensity = ramp * 0.9 + flash * 3;
    const finale = smooth((p - 0.9) / 0.1);

    // 3 — turntable: one full turn
    const turn = smoother((p - 0.5) / 0.19) * TAU;
    const settle = smooth((p - 0.7) / 0.2);
    root.rotation.y = 0.55 + (1 - a) * 0.9 + turn + settle * 0.35 - finale * 0.55;

    // 4 — signal: radar floor, pulses, beacon and gateway links
    const sig = smooth((p - 0.655) / 0.065) * (1 - smooth((p - 0.9) / 0.04));
    // radar floor, beacon and links are only built/drawn while they are visible
    const sigOn = sig > 0.002;
    floor.visible = beacon.visible = gwGroup.visible = sigOn;
    links.forEach((L) => { L.line.visible = sigOn; });
    if (sigOn) {
      floorMat.uniforms.uOpacity.value = sig;
      floorMat.uniforms.uPhase.value = (p - 0.68) * 13.0;
      beaconMat.uniforms.uOpacity.value = sig * 0.6;
      gwMat.opacity = sig * 0.85;
      root.updateMatrixWorld();
      puckTop.set(0, PUCK_Y + 0.14, 0).applyMatrix4(root.matrixWorld);
      beacon.position.set(puckTop.x, puckTop.y + 3.4, puckTop.z);
      links.forEach((L, i) => {
        mid.copy(puckTop).add(L.tower).multiplyScalar(0.5); mid.y += 1.2 + i * 0.15;
        L.curve.v0.copy(puckTop); L.curve.v1.copy(mid); L.curve.v2.copy(L.tower);
        L.line.geometry.setFromPoints(L.curve.getPoints(40));
        L.line.computeLineDistances();
        linkMats[i].opacity = sig * (0.55 + 0.35 * Math.sin(time * 3 + i));
        linkMats[i].dashOffset = -(p - 0.7) * 30;
      });
    }

    // atmosphere
    pool.material.opacity = 0.16 + ramp * 0.28 + flash * 0.3;
    dust.rotation.y = p * 1.4 + (state.reduced ? 0 : time * 0.01);
    dust.material.opacity = 0.35 + sig * 0.25;
    bloom.strength = 0.3 + ramp * 0.26 + flash * 0.45 + finale * 0.2 + sig * 0.1;
    bloom.threshold = 0.78;

    // camera
    if (state.override) {
      const o = state.override;
      cam.d = o.d; cam.ty = o.ty; cam.az = o.az ?? 0; cam.el = o.el ?? 0.15; cam.tx = o.tx ?? 0;
      if (o.rotY !== undefined) root.rotation.y = o.rotY;
    } else sampleCamera(p);
    const fit = state.aspect >= 1.6 ? 1 : Math.min(2.4, Math.pow(1.6 / state.aspect, 0.82));
    const d = cam.d * fit;
    const az = cam.az + state.mx * 0.14, el = cam.el + state.my * 0.08;
    // sideways offset only when there is room for it (landscape); portrait keeps the product centred
    const tx = cam.tx * clamp01((state.aspect - 0.9) / 0.7);
    camera.position.set(tx + Math.sin(az) * Math.cos(el) * d, cam.ty + Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
    camera.lookAt(tx, cam.ty, 0);
  }

  function resize(w, h, dpr) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    state.aspect = w / h;
    // portrait: lift the product above the caption area
    if (state.aspect < 0.9) camera.setViewOffset(w, h, 0, h * 0.14, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function render(p, time) {
    state.p = p; state.time = time;
    apply(p, time);
    composer.render();
  }

  return {
    render, resize, partsCount: parts.length,
    parts: parts.map((p) => p.id),
    setPointer(x, y) { state.mx = x; state.my = y; },
    setReduced(v) { state.reduced = v; },
    setOverride(o) { state.override = o; },
    renderer,
    dispose() { renderer.dispose(); },
  };
}
