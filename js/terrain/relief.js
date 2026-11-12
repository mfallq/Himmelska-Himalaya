// A small WebGL renderer for the elevation grid: an orbiting camera over a lit
// height field, with helpers to place HTML labels on it. No libraries.
//
// World units are kilometres. x runs east, z runs south, y is up. The grid is
// centred on the origin. "Azimuth" is the compass direction the camera faces.
import { clamp, easeInOut, smoothstep, prefersReducedMotion } from '../util.js';
import { slopeTexture } from './paint.js';

const EDGE = 0.045; // width of the dissolving border, as a fraction of the grid

const VERT = `
attribute vec3 a_pos;            // u, v, height in metres
uniform mat4 u_mvp;
uniform vec2 u_size;             // grid width and depth in km
uniform float u_exag;
uniform vec3 u_eye;
varying vec2 v_uv;
varying float v_edge;
varying float v_dist;
void main() {
  vec2 uv = a_pos.xy;
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float h = a_pos.z * mix(0.6, 1.0, smoothstep(0.0, ${EDGE.toFixed(3)}, edge));
  vec3 world = vec3((uv.x - 0.5) * u_size.x, h * 0.001 * u_exag, (uv.y - 0.5) * u_size.y);
  v_uv = uv;
  v_edge = edge;
  v_dist = distance(world, u_eye);
  gl_Position = u_mvp * vec4(world, 1.0);
}`;

const FRAG = `
precision highp float;
uniform sampler2D u_albedo;
uniform sampler2D u_slope;
uniform vec3 u_light;
uniform vec3 u_sun;
uniform vec3 u_ambient;
uniform vec3 u_fog;
uniform float u_exag;
uniform float u_haze;
uniform float u_camDist;
uniform float u_flat;            // 0 = fully lit, 1 = imagery already carries its own shading
varying vec2 v_uv;
varying float v_edge;
varying float v_dist;
void main() {
  float mask = smoothstep(0.0, ${EDGE.toFixed(3)}, v_edge);
  // ordered noise: dissolve the border instead of cutting it
  float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (mask < n * 0.98 + 0.01) discard;
  vec2 g = (texture2D(u_slope, v_uv).rg - 0.5) * 8.0;
  vec3 nrm = normalize(vec3(-g.x * u_exag, 1.0, -g.y * u_exag));
  float diff = max(dot(nrm, u_light), 0.0);
  float sky = 0.5 + 0.5 * nrm.y;
  vec3 lit = u_ambient * sky + u_sun * diff;
  lit = mix(lit, vec3(0.62) + u_sun * diff * 0.55, u_flat);
  vec3 col = texture2D(u_albedo, v_uv).rgb * lit;
  col = col / (1.0 + 0.22 * col);          // soft shoulder so snow keeps detail
  col = pow(col * 1.22, vec3(0.92));
  float fog = 1.0 - exp(-max(v_dist - u_camDist * 0.95, 0.0) * (0.9 / u_camDist));
  col = mix(col, u_fog, fog * u_haze);
  col = mix(u_fog * 0.55, col, smoothstep(0.0, 0.6, mask));
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- tiny matrix helpers (column-major, like WebGL) ----
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function lookAt(eye, at) {
  let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
  let l = Math.hypot(zx, zy, zz) || 1;
  zx /= l; zy /= l; zz /= l;
  // x = up × z, with up = (0, 1, 0)
  let xx = zz, xy = 0, xz = -zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return [
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1,
  ];
}
function multiply(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

const lerpAngle = (a, b, t) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;

export class Relief {
  constructor(canvas, dem, { coarse = false } = {}) {
    this.canvas = canvas;
    this.dem = dem;
    const attrs = { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' };
    const gl = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs);
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;
    const gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    this.gl2 = gl2;
    this.step = (gl2 || gl.getExtension('OES_element_index_uint')) && !coarse ? 1 : 2;
    while (Math.ceil(dem.width / this.step) * Math.ceil(dem.height / this.step) > 65000 && !(gl2 || gl.getExtension('OES_element_index_uint'))) this.step++;

    this.view = { x: 0, z: 0, az: 340, pitch: 42, dist: 150 };
    this.base = { ...this.view };
    this.exaggeration = 1.4;
    this.haze = 0.9;
    this.flat = 0;
    this.orbit = true;
    this.active = true; // paused while the view is hidden
    this.onFrame = null;
    this.driver = null; // optional function(now) that moves this.view each frame
    this._tween = null;
    this._lastInput = 0;
    this._orbitStart = performance.now();
    this._dirty = true;
    this._raf = 0;

    this._program();
    this._mesh();
    this._textures();
    this._controls();
    this._observer = new ResizeObserver(() => this.invalidate());
    this._observer.observe(canvas);
    // iOS drops the context of apps in the background. Rebuild everything when it returns.
    this._lost = false;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this._lost = true;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this._program();
      this._mesh();
      this._textures();
      if (this._source) this.setTexture(this._source);
      this._lost = false;
      this.invalidate();
    });
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  // ---------- setup ----------
  _program() {
    const gl = this.gl;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    this.program = program;
    this.u = {};
    for (const name of ['u_mvp', 'u_size', 'u_exag', 'u_eye', 'u_albedo', 'u_slope', 'u_light', 'u_sun', 'u_ambient', 'u_fog', 'u_haze', 'u_camDist', 'u_flat']) {
      this.u[name] = gl.getUniformLocation(program, name);
    }
  }

  _mesh() {
    const gl = this.gl, dem = this.dem, s = this.step;
    const cols = Math.floor((dem.width - 1) / s) + 1, rows = Math.floor((dem.height - 1) / s) + 1;
    const verts = new Float32Array(cols * rows * 3);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = Math.min(dem.width - 1, i * s), y = Math.min(dem.height - 1, j * s);
        const o = (j * cols + i) * 3;
        verts[o] = x / (dem.width - 1);
        verts[o + 1] = y / (dem.height - 1);
        verts[o + 2] = dem.data[y * dem.width + x];
      }
    }
    const big = cols * rows > 65535;
    const idx = new (big ? Uint32Array : Uint16Array)((cols - 1) * (rows - 1) * 6);
    let k = 0;
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
        idx[k++] = a; idx[k++] = c; idx[k++] = b;
        idx[k++] = b; idx[k++] = c; idx[k++] = d;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    this.indexCount = idx.length;
    this.indexType = big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  }

  _textures() {
    const gl = this.gl, dem = this.dem;
    const make = (unit) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    this.albedo = make(0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([90, 100, 90, 255]));
    this.slope = make(1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dem.width, dem.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, slopeTexture(dem));
    this.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }

  /** Replace the ground texture with a canvas or image covering the whole grid. */
  setTexture(source) {
    this._source = source;
    if (this._lost) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.albedo);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    const pot = (n) => (n & (n - 1)) === 0;
    if (this.gl2 || (pot(source.width) && pot(source.height))) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    this.invalidate();
  }

  // ---------- geometry ----------
  /** Height of the drawn surface in km at a grid position, as the shader draws it. */
  surface(u, v) {
    const edge = Math.min(u, 1 - u, v, 1 - v);
    if (edge < 0) return 0;
    return (this.dem.sampleUV(u, v) * (0.6 + 0.4 * smoothstep(0, EDGE, edge)) * this.exaggeration) / 1000;
  }
  world(lon, lat, liftKm = 0) {
    const [u, v] = this.dem.uv(lon, lat);
    return [(u - 0.5) * this.dem.widthKm, this.surface(clamp(u, 0, 1), clamp(v, 0, 1)) + liftKm, (v - 0.5) * this.dem.heightKm];
  }
  _target() {
    const { x, z } = this.view;
    const u = x / this.dem.widthKm + 0.5, v = z / this.dem.heightKm + 0.5;
    return [x, this.surface(clamp(u, 0, 1), clamp(v, 0, 1)), z];
  }
  _eye(target = this._target()) {
    const az = (this.view.az * Math.PI) / 180, p = (this.view.pitch * Math.PI) / 180, d = this.view.dist;
    return [target[0] - Math.sin(az) * Math.cos(p) * d, target[1] + Math.sin(p) * d, target[2] + Math.cos(az) * Math.cos(p) * d];
  }

  /** Screen position (CSS pixels) of a place on the surface. */
  project(lon, lat, liftKm = 0) {
    const p = this.world(lon, lat, liftKm);
    const m = this._mvp;
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    const sx = (x / w / 2 + 0.5) * cw, sy = (0.5 - y / w / 2) * ch;
    return { x: sx, y: sy, depth: w, visible: w > 0 && sx > -40 && sx < cw + 40 && sy > -40 && sy < ch + 40, world: p };
  }

  /** True when terrain stands between the camera and a point on the surface. */
  occluded(world) {
    const eye = this._eyeNow;
    const W = this.dem.widthKm, H = this.dem.heightKm;
    for (let i = 3; i < 34; i++) {
      const t = i / 36;
      const x = eye[0] + (world[0] - eye[0]) * t, y = eye[1] + (world[1] - eye[1]) * t, z = eye[2] + (world[2] - eye[2]) * t;
      const u = x / W + 0.5, v = z / H + 0.5;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      if (this.surface(u, v) > y + 0.06) return true;
    }
    return false;
  }

  // ---------- camera ----------
  /** Move the camera. `view` takes lon/lat (or x/z), az, pitch, dist. */
  setView(view, { duration = 2400 } = {}) {
    const to = { ...this.view };
    if (view.lon !== undefined) {
      const [u, v] = this.dem.uv(view.lon, view.lat);
      to.x = (clamp(u, 0, 1) - 0.5) * this.dem.widthKm;
      to.z = (clamp(v, 0, 1) - 0.5) * this.dem.heightKm;
    }
    for (const k of ['x', 'z', 'az', 'pitch', 'dist']) if (view[k] !== undefined) to[k] = view[k];
    to.pitch = clamp(to.pitch, 8, 89);
    to.dist = clamp(to.dist, 5, 320);
    this.base = { ...to };
    this._orbitStart = performance.now();
    if (duration <= 0 || prefersReducedMotion()) {
      this.view = to;
      this._tween = null;
    } else {
      this._tween = { from: { ...this.view }, to, start: performance.now(), duration };
    }
    this.invalidate();
  }
  zoom(factor) {
    this.setView({ dist: this.view.dist * factor }, { duration: 300 });
  }
  setExaggeration(value) {
    this.exaggeration = value;
    this.invalidate();
  }
  invalidate() {
    this._dirty = true;
  }

  _controls() {
    const c = this.canvas;
    const pointers = new Map();
    let pinch = 0;
    const touch = () => {
      this._lastInput = performance.now();
      this._tween = null;
    };
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      c.classList.add('dragging');
      touch();
    });
    c.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      const v = this.view;
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) v.dist = clamp((v.dist * pinch) / d, 5, 320);
        pinch = d;
        this._pan(dx / 2, dy / 2);
      } else if (e.shiftKey || e.buttons === 2) {
        this._pan(dx, dy);
      } else {
        v.az = (v.az + dx * 0.28 + 360) % 360;
        if (e.pointerType !== 'touch') v.pitch = clamp(v.pitch + dy * 0.22, 8, 89);
      }
      this.base = { ...v };
      touch();
      this.invalidate();
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      pinch = 0;
      if (!pointers.size) c.classList.remove('dragging');
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener(
      'wheel',
      (e) => {
        if (!e.ctrlKey && !e.metaKey) return; // plain scrolling belongs to the page
        e.preventDefault();
        this.view.dist = clamp(this.view.dist * Math.exp(e.deltaY * 0.004), 5, 320);
        this.base = { ...this.view };
        touch();
        this.invalidate();
      },
      { passive: false },
    );
    c.tabIndex = 0;
    c.addEventListener('keydown', (e) => {
      const v = this.view;
      const step = { ArrowLeft: ['az', -6], ArrowRight: ['az', 6], ArrowUp: ['pitch', 4], ArrowDown: ['pitch', -4] }[e.key];
      if (step) {
        v[step[0]] += step[1];
        v.pitch = clamp(v.pitch, 8, 89);
      } else if (e.key === '+' || e.key === '=') v.dist = clamp(v.dist * 0.85, 5, 320);
      else if (e.key === '-') v.dist = clamp(v.dist / 0.85, 5, 320);
      else return;
      e.preventDefault();
      this.base = { ...v };
      touch();
      this.invalidate();
    });
  }
  _pan(dx, dy) {
    const v = this.view, az = (v.az * Math.PI) / 180, s = v.dist * 0.0017;
    v.x = clamp(v.x - Math.cos(az) * dx * s + Math.sin(az) * dy * s, -this.dem.widthKm / 2, this.dem.widthKm / 2);
    v.z = clamp(v.z - Math.sin(az) * dx * s - Math.cos(az) * dy * s, -this.dem.heightKm / 2, this.dem.heightKm / 2);
  }

  // ---------- drawing ----------
  _loop(now) {
    this._raf = requestAnimationFrame(this._loop);
    if (!this.active || this._lost) return;
    let moving = false;
    if (this.driver) {
      moving = this.driver(now) !== false;
    } else if (this._tween) {
      const { from, to, start, duration } = this._tween;
      const t = clamp((now - start) / duration, 0, 1), e = easeInOut(t);
      this.view = {
        x: from.x + (to.x - from.x) * e,
        z: from.z + (to.z - from.z) * e,
        az: (lerpAngle(from.az, to.az, e) + 360) % 360,
        pitch: from.pitch + (to.pitch - from.pitch) * e,
        dist: Math.exp(Math.log(from.dist) + (Math.log(to.dist) - Math.log(from.dist)) * e),
      };
      // Rise and pull back in mid-flight when the camera travels far, like a crane shot.
      const travel = Math.hypot(to.x - from.x, to.z - from.z);
      const lift = Math.sin(Math.PI * t) * clamp(travel / Math.max(from.dist, to.dist), 0, 1);
      this.view.dist *= 1 + 0.45 * lift;
      this.view.pitch = clamp(this.view.pitch + 9 * lift, 8, 89);
      moving = true;
      if (t >= 1) {
        this._tween = null;
        this._orbitStart = now;
      }
    } else if (this.orbit && !prefersReducedMotion() && now - this._lastInput > 2600) {
      // A slow drift around the framed direction, with a little breathing in
      // height and distance so the shot never sits still.
      const s = (now - this._orbitStart) * 0.001;
      this.view.az = (this.base.az + 24 * Math.sin(s * 0.075) + 360) % 360;
      this.view.pitch = clamp(this.base.pitch + 2.5 * Math.sin(s * 0.11 + 1), 8, 89);
      this.view.dist = this.base.dist * (1 + 0.05 * Math.sin(s * 0.09 + 2));
      moving = true;
    }
    if (moving || this._dirty) this.render();
  }

  render() {
    const gl = this.gl, c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!this._fixedSize) {
      const w = Math.max(2, Math.round(c.clientWidth * dpr)), h = Math.max(2, Math.round(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    }
    gl.viewport(0, 0, c.width, c.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const target = this._target();
    const eye = this._eye(target);
    this._eyeNow = eye;
    const proj = perspective((36 * Math.PI) / 180, c.width / c.height, Math.max(0.3, this.view.dist * 0.02), this.view.dist * 6 + 400);
    this._mvp = multiply(proj, lookAt(eye, target));

    const u = this.u;
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(u.u_mvp, false, new Float32Array(this._mvp));
    gl.uniform2f(u.u_size, this.dem.widthKm, this.dem.heightKm);
    gl.uniform1f(u.u_exag, this.exaggeration);
    gl.uniform3fv(u.u_eye, eye);
    gl.uniform1i(u.u_albedo, 0);
    gl.uniform1i(u.u_slope, 1);
    gl.uniform3f(u.u_light, 0.752, 0.559, 0.35); // low sun in the east-south-east
    gl.uniform3f(u.u_sun, 1.36, 1.22, 1.04);
    gl.uniform3f(u.u_ambient, 0.3, 0.37, 0.5);
    gl.uniform3f(u.u_fog, 0.1, 0.19, 0.24);
    gl.uniform1f(u.u_haze, this.haze);
    gl.uniform1f(u.u_camDist, this.view.dist);
    gl.uniform1f(u.u_flat, this.flat);
    gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);
    this._dirty = false;
    if (!this._fixedSize) this.onFrame?.(this);
  }

  /**
   * Draw one still of the relief into a 2D canvas, from any camera, without
   * disturbing the live view.
   */
  snapshot(ctx, view, width, height) {
    if (this._lost) return;
    const keep = { view: this.view, tween: this._tween, w: this.canvas.width, h: this.canvas.height };
    this._tween = null;
    this._fixedSize = true;
    this.canvas.width = width;
    this.canvas.height = height;
    const to = { ...this.view, ...view };
    if (view.lon !== undefined) {
      const [u, v] = this.dem.uv(view.lon, view.lat);
      to.x = (clamp(u, 0, 1) - 0.5) * this.dem.widthKm;
      to.z = (clamp(v, 0, 1) - 0.5) * this.dem.heightKm;
    }
    this.view = to;
    this.render();
    ctx.drawImage(this.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
    this.view = keep.view;
    this._tween = keep.tween;
    this.canvas.width = keep.w;
    this.canvas.height = keep.h;
    this._fixedSize = false;
    this.render();
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._observer.disconnect();
  }
}
