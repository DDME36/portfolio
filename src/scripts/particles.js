// ═══════════════════════════════════════════════════════
//  Particle field — thousands of points that morph between
//  electrical shapes as the story scrolls (raw WebGL, no library)
// ═══════════════════════════════════════════════════════

const TAU = Math.PI * 2;

// Shape types the vertex shader animates differently
const STATIC = 0, SPIN = 1, WAVE = 2, RIPPLE = 3;

// ─── Shape generators: each returns N xyz triples ─────
const rand = (a = -1, b = 1) => a + Math.random() * (b - a);

function sphere(n) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const s = 1 + rand(-0.04, 0.04) + (Math.random() < 0.08 ? rand(0, 0.5) : 0);
    out.set([Math.cos(t) * r * s, y * s, Math.sin(t) * r * s], i * 3);
  }
  return out;
}

function polygonFill(n, poly) {
  const out = new Float32Array(n * 3);
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  for (let i = 0; i < n; ) {
    const x = rand(), y = rand();
    if (!inside(x, y)) continue;
    out.set([x, y, rand(-0.12, 0.12)], i * 3);
    i++;
  }
  return out;
}

const bolt = (n) => polygonFill(n, [[0.18, 1], [-0.5, -0.08], [-0.02, -0.08], [-0.24, -1], [0.52, 0.16], [0.06, 0.16], [0.4, 1]]);

// Three-phase supply: three sine waves 120° apart (shader animates them)
function waves(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) out.set([rand(-1, 1), rand(-0.02, 0.02), (i % 3) * (TAU / 3)], i * 3);
  return out;
}

// Data lattice: points running along the lines of a cube grid
function lattice(n) {
  const out = new Float32Array(n * 3);
  const steps = [-1, -0.5, 0, 0.5, 1];
  for (let i = 0; i < n; i++) {
    const axis = i % 3;
    const p = [steps[(Math.random() * 5) | 0], steps[(Math.random() * 5) | 0], steps[(Math.random() * 5) | 0]];
    p[axis] = rand();
    out.set(p, i * 3);
  }
  return out;
}

// Tesla coil: a long helix lying on its side
function helix(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const a = t * TAU * 14;
    const r = 0.42 + rand(-0.02, 0.02);
    out.set([(t - 0.5) * 2, Math.cos(a) * r, Math.sin(a) * r], i * 3);
  }
  return out;
}

// Toroidal transformer core
function torus(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rand(0, TAU), v = rand(0, TAU);
    const R = 0.75, r = 0.28 + rand(-0.015, 0.015);
    out.set([(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)], i * 3);
  }
  return out;
}

// Field plane: a grid the shader ripples outward
function plane(n) {
  const out = new Float32Array(n * 3);
  const side = Math.ceil(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    out.set([((i % side) / side) * 2 - 1, 0, (Math.floor(i / side) / side) * 2 - 1], i * 3);
  }
  return out;
}

function ring(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const r = 1 + (Math.random() < 0.85 ? rand(-0.025, 0.025) : rand(-0.3, 0.6));
    out.set([Math.cos(a) * r, Math.sin(a) * r, rand(-0.05, 0.05)], i * 3);
  }
  return out;
}

function scatter(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) out.set([rand(-6, 6), rand(-4, 4), rand(-3, 3)], i * 3);
  return out;
}

// ─── Shaders ──────────────────────────────────────────
const VERT = `
attribute vec3 aA;
attribute vec3 aB;
attribute vec4 aRand;
uniform float uMix, uTime, uAspect, uPixel, uSize;
uniform float uTypeA, uTypeB;
uniform vec4 uXformA, uXformB;   // xy offset, scale, tilt
uniform vec2 uMouse;
varying float vTone;
varying float vAlpha;

vec3 animate(vec3 p, float type, float seed) {
  if (type == 1.0) {
    float a = uTime * 0.18;
    p = vec3(p.x * cos(a) - p.z * sin(a), p.y, p.x * sin(a) + p.z * cos(a));
  } else if (type == 2.0) {
    float phase = p.z;
    p = vec3(p.x * 1.6, 0.32 * sin(p.x * 5.0 + phase - uTime * 1.6) + p.y, 0.0);
  } else if (type == 3.0) {
    float d = length(p.xz);
    p.y = 0.12 * sin(d * 9.0 - uTime * 2.0);
    float a = 0.5;
    p = vec3(p.x * 1.4, p.y * cos(a) - p.z * sin(a), p.y * sin(a) + p.z * cos(a));
  }
  return p;
}

vec3 place(vec3 p, vec4 x) {
  float c = cos(x.w), s = sin(x.w);
  p = vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
  return p * x.z + vec3(x.xy, 0.0);
}

void main() {
  float delay = aRand.y * 0.4;
  float t = clamp((uMix - delay) / 0.6, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);

  vec3 a = place(animate(aA, uTypeA, aRand.x), uXformA);
  vec3 b = place(animate(aB, uTypeB, aRand.x), uXformB);
  vec3 p = mix(a, b, t);
  // Particles burst outward mid-morph, then settle into the next shape
  p += (aRand.xzw - 0.5) * sin(t * 3.14159) * 1.4;
  // A slow shimmer so nothing is ever perfectly still
  p += 0.012 * vec3(sin(uTime * 1.3 + aRand.x * 40.0), cos(uTime * 1.1 + aRand.z * 40.0), 0.0);

  float z = 3.2 - p.z;
  vec4 clip = vec4(p.x * 1.6 / uAspect, p.y * 1.6, 0.0, z);
  vec2 ndc = clip.xy / clip.w;
  // The pointer pushes nearby particles aside
  vec2 away = ndc - uMouse;
  float d = length(away * vec2(uAspect, 1.0));
  ndc += normalize(away + 1e-5) * 0.09 * smoothstep(0.32, 0.0, d);
  gl_Position = vec4(ndc * clip.w, 0.0, clip.w);

  gl_PointSize = uSize * uPixel * (0.6 + aRand.w * 1.1) * (3.2 / z);
  vTone = aRand.z;
  vAlpha = 0.55 + 0.45 * aRand.x;
}
`;

const FRAG = `
precision mediump float;
uniform float uPaper;
uniform float uFade;
varying float vTone;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float glow = smoothstep(0.5, 0.0, d);
  glow *= glow;
  // orange carries current, cyan carries data; deeper tones on paper
  vec3 orange = mix(vec3(1.0, 0.42, 0.21), vec3(0.86, 0.3, 0.08), uPaper);
  vec3 cyan = mix(vec3(0.0, 0.83, 1.0), vec3(0.0, 0.45, 0.62), uPaper);
  vec3 white = mix(vec3(0.92, 0.95, 0.97), vec3(0.06, 0.16, 0.28), uPaper);
  vec3 col = vTone < 0.62 ? orange : (vTone < 0.9 ? cyan : white);
  gl_FragColor = vec4(col, glow * vAlpha * uFade);
}
`;

// ─── Engine ───────────────────────────────────────────
export function createParticles(canvas, { count, maxPixel = 1.5 }) {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) return null;
  // Without a real GPU every frame is drawn on the CPU; skip the field there
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "";
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const loc = (n) => gl.getUniformLocation(prog, n);
  const u = Object.fromEntries(["uMix", "uTime", "uAspect", "uPixel", "uSize", "uTypeA", "uTypeB", "uXformA", "uXformB", "uMouse", "uPaper", "uFade"].map((n) => [n, loc(n)]));
  const aA = gl.getAttribLocation(prog, "aA");
  const aB = gl.getAttribLocation(prog, "aB");
  const aRand = gl.getAttribLocation(prog, "aRand");

  const buffer = (data) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  };
  const randoms = new Float32Array(count * 4).map(() => Math.random());
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer(randoms));
  gl.enableVertexAttribArray(aRand);
  gl.vertexAttribPointer(aRand, 4, gl.FLOAT, false, 0, 0);

  const shapes = {
    scatter: { buf: buffer(scatter(count)), type: STATIC },
    sphere: { buf: buffer(sphere(count)), type: SPIN },
    bolt: { buf: buffer(bolt(count)), type: STATIC },
    waves: { buf: buffer(waves(count)), type: WAVE },
    lattice: { buf: buffer(lattice(count)), type: SPIN },
    helix: { buf: buffer(helix(count)), type: SPIN },
    torus: { buf: buffer(torus(count)), type: SPIN },
    plane: { buf: buffer(plane(count)), type: RIPPLE },
    ring: { buf: buffer(ring(count)), type: SPIN },
  };

  const bind = (attr, shape) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.buf);
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 3, gl.FLOAT, false, 0, 0);
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let pixel = 1;
  const resize = () => {
    pixel = Math.min(window.devicePixelRatio || 1, maxPixel);
    canvas.width = Math.round(canvas.clientWidth * pixel);
    canvas.height = Math.round(canvas.clientHeight * pixel);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  let current = { a: null, b: null };
  return {
    resize,
    get pixel() { return pixel; },
    setMaxPixel(value) { maxPixel = value; resize(); },
    // state: { a, b, mix, xa, xb, paper, fade, time, mouse }
    render(s) {
      if (current.a !== s.a) { bind(aA, shapes[s.a]); current.a = s.a; }
      if (current.b !== s.b) { bind(aB, shapes[s.b]); current.b = s.b; }
      gl.uniform1f(u.uMix, s.mix);
      gl.uniform1f(u.uTime, s.time);
      gl.uniform1f(u.uAspect, canvas.width / canvas.height);
      gl.uniform1f(u.uPixel, pixel);
      gl.uniform1f(u.uSize, s.size);
      gl.uniform1f(u.uTypeA, shapes[s.a].type);
      gl.uniform1f(u.uTypeB, shapes[s.b].type);
      gl.uniform4fv(u.uXformA, s.xa);
      gl.uniform4fv(u.uXformB, s.xb);
      gl.uniform2fv(u.uMouse, s.mouse);
      gl.uniform1f(u.uPaper, s.paper);
      gl.uniform1f(u.uFade, s.fade);
      // Light adds up into a glow on blueprint; on paper it lays down like ink
      if (s.paper < 0.5) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, Math.min(count, s.limit ?? count));
    },
  };
}
