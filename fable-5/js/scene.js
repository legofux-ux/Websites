import * as THREE from 'three';

/* --------------------------------------------------------------------------
   Partikel-Tinte: ein Punktfeld, das zwischen sechs Formen morpht.
   0 Kugel (Gedanke) · 1 Buch (Zuhören) · 2 Knoten (Nachdenken)
   3 Gitter (Handeln) · 4 Band (Erzählen) · 5 Ring (Epilog)
   -------------------------------------------------------------------------- */

const SHAPES = 6;

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sphere(n) {
  const a = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const R = 1.55 + gauss() * 0.025;
    a[i * 3] = Math.cos(t) * r * R;
    a[i * 3 + 1] = y * R;
    a[i * 3 + 2] = Math.sin(t) * r * R;
  }
  return a;
}

function book(n) {
  // aufgefächerte Seiten um einen Buchrücken
  const a = new Float32Array(n * 3);
  const pages = 14;
  for (let i = 0; i < n; i++) {
    const p = i % pages;
    const side = p < pages / 2 ? -1 : 1;
    const k = (p % (pages / 2)) / (pages / 2 - 1);
    const theta = side < 0 ? Math.PI * (0.97 - k * 0.32) : Math.PI * (0.03 + k * 0.32);
    const r = Math.random() * 2.1;
    const bend = Math.sin((r / 2.1) * Math.PI) * 0.18;
    const y = (Math.random() - 0.5) * 2.5;
    a[i * 3] = Math.cos(theta) * r;
    a[i * 3 + 1] = y;
    a[i * 3 + 2] = Math.sin(theta) * r * 0.75 + bend - 0.6;
  }
  return a;
}

function knot(n) {
  const a = new Float32Array(n * 3);
  const p = 2, q = 3;
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = 0.95 + 0.42 * Math.cos(q * t);
    const x = r * Math.cos(p * t);
    const y = r * Math.sin(p * t);
    const z = 0.42 * Math.sin(q * t);
    const s = 0.12 * Math.cbrt(Math.random());
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    a[i * 3] = x * 1.3 + s * Math.sin(ph) * Math.cos(th);
    a[i * 3 + 1] = y * 1.3 + s * Math.sin(ph) * Math.sin(th);
    a[i * 3 + 2] = z * 1.3 + s * Math.cos(ph);
  }
  return a;
}

function lattice(n) {
  const a = new Float32Array(n * 3);
  const g = 4;
  const size = 2.3;
  const step = size / (g - 1);
  for (let i = 0; i < n; i++) {
    const axis = i % 3;
    const c1 = -size / 2 + Math.floor(Math.random() * g) * step;
    const c2 = -size / 2 + Math.floor(Math.random() * g) * step;
    const free = (Math.random() - 0.5) * size;
    const v = axis === 0 ? [free, c1, c2] : axis === 1 ? [c1, free, c2] : [c1, c2, free];
    a[i * 3] = v[0];
    a[i * 3 + 1] = v[1];
    a[i * 3 + 2] = v[2];
  }
  return a;
}

function ribbon(n) {
  // Möbiusband — eine Geschichte, die keine Rückseite hat
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = (Math.random() - 0.5) * 0.9;
    const R = 1.35;
    a[i * 3] = (R + v * Math.cos(u / 2)) * Math.cos(u);
    a[i * 3 + 1] = (R + v * Math.cos(u / 2)) * Math.sin(u);
    a[i * 3 + 2] = v * Math.sin(u / 2);
  }
  return a;
}

function ring(n) {
  const a = new Float32Array(n * 3);
  const tilt = 1.15;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2;
    const outer = Math.random() < 0.28;
    const r = outer ? 1.2 + Math.random() * 2.2 : 2.0 + gauss() * 0.07;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;
    const y = gauss() * (outer ? 0.12 : 0.025);
    a[i * 3] = x;
    a[i * 3 + 1] = y * ct - z * st;
    a[i * 3 + 2] = y * st + z * ct;
  }
  return a;
}

const noiseGLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uSize;
uniform float uPixelRatio;
uniform float uPulse;
uniform float uReveal;
uniform vec3 uMouse;
uniform float uMouseForce;
uniform float uCamZ;

attribute vec3 aS0;
attribute vec3 aS1;
attribute vec3 aS2;
attribute vec3 aS3;
attribute vec3 aS4;
attribute vec3 aS5;
attribute float aRand;

varying float vRand;
varying float vAlpha;

${noiseGLSL}

void main() {
  // gestaffelter Morph: jedes Partikel startet leicht versetzt
  float base = floor(uMorph);
  float f = uMorph - base;
  float fs = smoothstep(aRand * 0.45, 0.55 + aRand * 0.45, f);
  float m = base + fs;

  vec3 pos = aS0 * max(0.0, 1.0 - abs(m - 0.0))
           + aS1 * max(0.0, 1.0 - abs(m - 1.0))
           + aS2 * max(0.0, 1.0 - abs(m - 2.0))
           + aS3 * max(0.0, 1.0 - abs(m - 3.0))
           + aS4 * max(0.0, 1.0 - abs(m - 4.0))
           + aS5 * max(0.0, 1.0 - abs(m - 5.0));

  // Atmen + Verwirbelung während des Übergangs
  float t = uTime * 0.12;
  vec3 n = vec3(
    snoise(pos * 0.7 + vec3(t, 0.0, 0.0)),
    snoise(pos * 0.7 + vec3(0.0, t + 13.1, 0.0)),
    snoise(pos * 0.7 + vec3(0.0, 0.0, t + 37.7))
  );
  float transit = 1.0 - abs(fs * 2.0 - 1.0);
  pos += n * (0.045 + transit * 0.55 + uPulse * 0.35);

  // Auftauchen aus dem Nichts
  pos *= mix(0.0, 1.0, smoothstep(aRand * 0.6, aRand * 0.6 + 0.4, uReveal));

  vec4 world = modelMatrix * vec4(pos, 1.0);

  // Maus schiebt die Tinte sanft beiseite
  vec2 d = world.xy - uMouse.xy;
  float dist = length(d);
  float infl = smoothstep(1.1, 0.0, dist) * uMouseForce;
  world.xy += normalize(d + 1e-5) * infl * 0.38;
  world.z += infl * 0.25;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (0.45 + aRand * 0.9) * (1.0 + infl * 0.8) / -mv.z;

  vRand = aRand;
  float front = smoothstep(uCamZ + 3.0, uCamZ - 3.0, -mv.z);
  vAlpha = 0.35 + 0.65 * front;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uOpacity;
varying float vRand;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.18, d);
  if (a < 0.01) discard;
  vec3 col = mix(uInk, uAccent, step(0.89, vRand));
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
}
`;

export function createScene(canvas) {
  const isSmall = window.matchMedia('(max-width: 720px)').matches;
  const count = isSmall ? 7000 : 14000;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  const pr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 0, 8);

  const geo = new THREE.BufferGeometry();
  const shapes = [sphere, book, knot, lattice, ribbon, ring].map((fn) => fn(count));
  // Positionen durchmischen, damit Übergänge nicht geordnet "wischen"
  for (let s = 1; s < SHAPES; s++) shuffle3(shapes[s]);
  geo.setAttribute('position', new THREE.BufferAttribute(shapes[0], 3));
  shapes.forEach((arr, i) => geo.setAttribute(`aS${i}`, new THREE.BufferAttribute(arr, 3)));
  const rand = new Float32Array(count);
  for (let i = 0; i < count; i++) rand[i] = Math.random();
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uSize: { value: isSmall ? 36 : 44 },
    uPixelRatio: { value: pr },
    uPulse: { value: 0 },
    uReveal: { value: 0 },
    uMouse: { value: new THREE.Vector3(99, 99, 0) },
    uMouseForce: { value: 0 },
    uCamZ: { value: 8 },
    uInk: { value: new THREE.Vector3(0x19 / 255, 0x18 / 255, 0x16 / 255) },
    uAccent: { value: new THREE.Vector3(0xc8 / 255, 0x61 / 255, 0x3f / 255) },
    uOpacity: { value: 0.78 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;

  const group = new THREE.Group(); // Scroll-Position / Offset
  const spin = new THREE.Group(); // Eigenrotation
  spin.add(points);
  group.add(spin);
  scene.add(group);

  // Pointer → Weltkoordinaten auf der z=0-Ebene
  const pointer = new THREE.Vector2(0, 0);
  const smoothPointer = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  let pointerActive = false;

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointerActive = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointerActive = false; });

  const state = { offsetX: 0, offsetY: 0, scrollRot: 0, speed: 1 };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    // auf schmalen Screens etwas weiter weg, damit die Form passt
    camera.position.z = w / h < 0.8 ? 11 : 8;
    uniforms.uCamZ.value = camera.position.z;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let raf = 0;
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value += dt;

    smoothPointer.lerp(pointer, 0.06);
    camera.position.x = smoothPointer.x * 0.35;
    camera.position.y = smoothPointer.y * 0.25;
    camera.lookAt(0, 0, 0);

    spin.rotation.y += dt * 0.07 * state.speed;
    spin.rotation.x = Math.sin(uniforms.uTime.value * 0.15) * 0.12 + state.scrollRot;

    const narrow = window.innerWidth / window.innerHeight < 0.8;
    group.position.x = narrow ? 0 : state.offsetX;
    group.position.y = state.offsetY;

    raycaster.setFromCamera(smoothPointer, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) uniforms.uMouse.value.copy(hit);
    const targetForce = pointerActive ? 1 : 0;
    uniforms.uMouseForce.value += (targetForce - uniforms.uMouseForce.value) * 0.05;

    renderer.render(scene, camera);
  }
  tick();

  return { uniforms, state, group, destroy: () => cancelAnimationFrame(raf) };
}

function shuffle3(arr) {
  const n = arr.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    for (let k = 0; k < 3; k++) {
      const t = arr[i * 3 + k];
      arr[i * 3 + k] = arr[j * 3 + k];
      arr[j * 3 + k] = t;
    }
  }
}
