// Rysowanie „płynnych” kafli w WebGL (bez bibliotek). Każdy kafel to zaokrąglony prostokąt opisany
// polem odległości (SDF). Kształty łączy „miękkie minimum” (smooth minimum, efekt metaballs): im
// większe k, tym szerzej zlewają się kształty, które są blisko siebie. Opcjonalne koło „mostka”
// łączy dwa kafle przy najechaniu. Kolor w każdym punkcie to średnia kolorów kafli ważona bliskością,
// więc w mostkach kolory płynnie się mieszają. Krawędź jest wygładzana o 1 piksel ekranu.
// Jeden prostokąt na całe płótno, jedno przejście shadera: tanie także na słabszym sprzęcie.

export const MAX_TILES = 8;

export type LiquidFrame = {
  /** Na kafel: środek x, środek y, połowa szerokości, połowa wysokości (px CSS, od lewego górnego rogu). */
  rects: Float32Array;
  /** Na kafel: r, g, b (0–1). */
  colors: Float32Array;
  count: number;
  /** Zaokrąglenie kafli w px CSS. */
  radius: number;
  /** Zasięg zlewania się kafli w px (0 = zwykłe, osobne kształty). */
  k: number;
  /** Koło mostka: środek x, środek y, promień (px CSS; promień 0 = brak). */
  bridge: [number, number, number];
  /** Zasięg zlewania mostka z kaflami w px. */
  kBridge: number;
};

const VERTEX = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
#define MAX_TILES ${MAX_TILES}
uniform vec2 uSize;
uniform float uDpr;
uniform vec4 uRects[MAX_TILES];
uniform vec3 uColors[MAX_TILES];
uniform int uCount;
uniform float uRadius;
uniform float uK;
uniform vec3 uBridge;
uniform float uKBridge;

// Odległość od zaokrąglonego prostokąta (ujemna w środku).
float roundedBox(vec2 p, vec2 halfSize, float r) {
  r = min(r, min(halfSize.x, halfSize.y));
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Miękkie minimum: łączy dwa kształty płynnym przejściem o zasięgu k.
float smoothMin(float a, float b, float k) {
  if (k <= 0.0001) return min(a, b);
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  float dist = 100000.0;
  vec3 color = vec3(0.0);
  float weights = 0.0;
  for (int i = 0; i < MAX_TILES; i++) {
    if (i >= uCount) break;
    vec4 rect = uRects[i];
    if (rect.z <= 0.01 || rect.w <= 0.01) continue;
    float d = roundedBox(p - rect.xy, rect.zw, uRadius);
    // waga koloru: im głębiej w kaflu, tym większa; przejście między kaflami ok. 8 px
    float w = exp(-clamp(d, -60.0, 200.0) * 0.25);
    color += uColors[i] * w;
    weights += w;
    dist = smoothMin(dist, d, uK);
  }
  if (uBridge.z > 0.01) {
    dist = smoothMin(dist, length(p - uBridge.xy) - uBridge.z, uKBridge);
  }
  float alpha = clamp(0.5 - dist * uDpr, 0.0, 1.0);
  if (alpha <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  color /= max(weights, 0.00001);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") console.warn("liquid-bento: shader", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Czy przeglądarka ma WebGL (sprawdzane raz). */
let webglSupport: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglSupport === null) {
    try {
      webglSupport = Boolean(document.createElement("canvas").getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

export type LiquidRenderer = {
  resize(width: number, height: number, dpr: number): void;
  draw(frame: LiquidFrame): void;
  dispose(): void;
};

/** Przygotowuje rysowanie na płótnie. Zwraca null, gdy WebGL jest niedostępny. */
export function createLiquidRenderer(canvas: HTMLCanvasElement): LiquidRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // Jeden prostokąt na całe płótno (dwa trójkąty).
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const at = (name: string) => gl.getUniformLocation(program, name);
  const uniforms = {
    size: at("uSize"),
    dpr: at("uDpr"),
    rects: at("uRects"),
    colors: at("uColors"),
    count: at("uCount"),
    radius: at("uRadius"),
    k: at("uK"),
    bridge: at("uBridge"),
    kBridge: at("uKBridge"),
  };
  const rects = new Float32Array(MAX_TILES * 4);
  const colors = new Float32Array(MAX_TILES * 3);
  let size = { width: 0, height: 0, dpr: 1 };

  return {
    resize(width, height, dpr) {
      size = { width, height, dpr };
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    draw(frame) {
      rects.fill(0);
      colors.fill(0);
      rects.set(frame.rects.subarray(0, MAX_TILES * 4));
      colors.set(frame.colors.subarray(0, MAX_TILES * 3));
      gl.uniform2f(uniforms.size, size.width, size.height);
      gl.uniform1f(uniforms.dpr, size.dpr);
      gl.uniform4fv(uniforms.rects, rects);
      gl.uniform3fv(uniforms.colors, colors);
      gl.uniform1i(uniforms.count, Math.min(frame.count, MAX_TILES));
      gl.uniform1f(uniforms.radius, frame.radius);
      gl.uniform1f(uniforms.k, frame.k);
      gl.uniform3f(uniforms.bridge, ...frame.bridge);
      gl.uniform1f(uniforms.kBridge, frame.kBridge);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}
