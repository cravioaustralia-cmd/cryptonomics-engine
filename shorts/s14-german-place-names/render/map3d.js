/* s14 — 3D textured-satellite map (WebGL2, drawn inside renderFrame(t); no Remotion, no 3D library).
 * Basemap: Sentinel-2 true colour (11 Jan 2024, 10 m, tiles 54HTG + 54HUG), draped over AWS Terrain Tiles
 * elevation with vertical exaggeration, cut as an extruded slab (dirt/rock side walls).
 * Output per frame: a JPEG data URL for an SVG <image>, plus project(u,v) → screen coords for SVG pins.
 * u,v are normalised image coords of the satellite mosaic (u east, v south); see TOWNS in scenes.js.
 */
(function () {
  const W = 1080;
  const H = 1920;
  const KM_X = 49.44; // mosaic width, km
  const KM_Z = 46.56; // mosaic height, km
  const EXAG = 3.2; // vertical exaggeration
  const BASE = -1.35; // slab bottom (km, before exaggeration is irrelevant — world units)

  let gl, canvas, prog, wallProg, meshBuf, idxBuf, idxCount, wallBuf, wallCount, tex;
  let demW, demH, dem; // heights in km (unexaggerated)
  const cache = new Map();

  function loadImg(url) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
  }

  function heightAt(u, v) {
    const x = Math.min(Math.max(u, 0), 1) * (demW - 1);
    const y = Math.min(Math.max(v, 0), 1) * (demH - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, demW - 1), y1 = Math.min(y0 + 1, demH - 1);
    const fx = x - x0, fy = y - y0;
    const a = dem[y0 * demW + x0], b = dem[y0 * demW + x1], c = dem[y1 * demW + x0], d = dem[y1 * demW + x1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  const world = (u, v, hKm) => [u * KM_X, hKm * EXAG, v * KM_Z];

  // ---------- tiny mat4 helpers (column-major) ----------
  function persp(fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0];
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function lookAt(eye, at) {
    const f = norm(sub(at, eye));
    const s = norm(cross(f, [0, 1, 0]));
    const u = cross(s, f);
    return [s[0], u[0], -f[0], 0, s[1], u[1], -f[1], 0, s[2], u[2], -f[2], 0, -dot(s, eye), -dot(u, eye), dot(f, eye), 1];
  }
  function mul(a, b) {
    const o = new Array(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
    return o;
  }
  function xform(m, p) {
    const x = p[0], y = p[1], z = p[2];
    return [
      m[0] * x + m[4] * y + m[8] * z + m[12],
      m[1] * x + m[5] * y + m[9] * z + m[13],
      m[2] * x + m[6] * y + m[10] * z + m[14],
      m[3] * x + m[7] * y + m[11] * z + m[15],
    ];
  }

  /** cam: { u, v (look-at target), dist (km), heading (deg, 0 = looking north, 90 = east), pitch (deg down), fov (deg) } */
  function camMatrix(cam) {
    const h = ((cam.heading || 0) * Math.PI) / 180;
    const p = ((cam.pitch != null ? cam.pitch : 45) * Math.PI) / 180;
    const tgt = world(cam.u, cam.v, cam.th != null ? cam.th : heightAt(cam.u, cam.v));
    const dir = [Math.sin(h) * Math.cos(p), -Math.sin(p), -Math.cos(h) * Math.cos(p)]; // looking direction
    const eye = [tgt[0] - dir[0] * cam.dist, tgt[1] - dir[1] * cam.dist, tgt[2] - dir[2] * cam.dist];
    const P = persp(((cam.fov || 38) * Math.PI) / 180, W / H, 0.1, 400);
    return { m: mul(P, lookAt(eye, tgt)), eye };
  }

  function compile(vs, fs) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  const VS = `#version 300 es
    in vec3 aPos; in vec2 aUv; in vec3 aNrm;
    uniform mat4 uM; uniform vec3 uEye;
    out vec2 vUv; out vec3 vN; out float vDist;
    void main(){ vUv=aUv; vN=aNrm; vDist=distance(aPos,uEye); gl_Position=uM*vec4(aPos,1.0); }`;
  const FS = `#version 300 es
    precision highp float;
    in vec2 vUv; in vec3 vN; in float vDist;
    uniform sampler2D uTex; uniform vec3 uSun; uniform float uSepia; uniform float uDim;
    uniform vec4 uSpot; // u, v, radius (uv), strength
    uniform vec3 uFog; uniform float uFogK;
    out vec4 o;
    void main(){
      vec3 c=texture(uTex,vUv).rgb;
      float l=max(dot(normalize(vN),normalize(uSun)),0.0);
      c*=0.55+0.75*l;
      float g=dot(c,vec3(0.3,0.59,0.11));
      vec3 sep=vec3(g*1.07+0.04,g*0.9+0.02,g*0.68);
      c=mix(c,sep,uSepia);
      float d=distance(vUv*vec2(${KM_X.toFixed(2)},${KM_Z.toFixed(2)}),uSpot.xy*vec2(${KM_X.toFixed(2)},${KM_Z.toFixed(2)}));
      float s=1.0-smoothstep(uSpot.z*0.6,uSpot.z,d);
      c*=mix(1.0-uDim,1.0+0.25*uSpot.w,s*uSpot.w);
      c=mix(c,uFog,clamp(1.0-exp(-vDist*uFogK),0.0,0.7));
      o=vec4(c,1.0);
    }`;
  const WVS = `#version 300 es
    in vec3 aPos; in float aShade;
    uniform mat4 uM; out float vS; out float vY;
    void main(){ vS=aShade; vY=aPos.y; gl_Position=uM*vec4(aPos,1.0); }`;
  const WFS = `#version 300 es
    precision highp float; in float vS; in float vY; uniform float uSepia; out vec4 o;
    void main(){
      float band=0.5+0.5*sin(vY*9.0);
      vec3 top=vec3(0.36,0.25,0.16), bot=vec3(0.12,0.08,0.06);
      float k=clamp((vY-(${BASE.toFixed(2)}))/${(0.25 - BASE).toFixed(2)},0.0,1.0);
      vec3 c=mix(bot,top,k)*(0.85+0.15*band)*vS;
      o=vec4(c,1.0);
    }`;

  async function init(satUrl, demUrl) {
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    const [sat, demImg] = await Promise.all([loadImg(satUrl), loadImg(demUrl)]);

    // heights
    const dc = document.createElement('canvas');
    dc.width = demW = demImg.width;
    dc.height = demH = demImg.height;
    const dx = dc.getContext('2d');
    dx.drawImage(demImg, 0, 0);
    const px = dx.getImageData(0, 0, demW, demH).data;
    dem = new Float32Array(demW * demH);
    for (let i = 0; i < dem.length; i++) dem[i] = (px[i * 4] * 256 + px[i * 4 + 1]) / 10000; // decimetres → km

    // terrain mesh
    const verts = [];
    for (let j = 0; j < demH; j++) {
      for (let i = 0; i < demW; i++) {
        const u = i / (demW - 1), v = j / (demH - 1);
        const h = dem[j * demW + i];
        const hl = dem[j * demW + Math.max(i - 1, 0)], hr = dem[j * demW + Math.min(i + 1, demW - 1)];
        const hu = dem[Math.max(j - 1, 0) * demW + i], hd = dem[Math.min(j + 1, demH - 1) * demW + i];
        const sx = (2 * KM_X) / (demW - 1), sz = (2 * KM_Z) / (demH - 1);
        const n = norm([-(hr - hl) * EXAG / sx, 1, -(hd - hu) * EXAG / sz]);
        const p = world(u, v, h);
        verts.push(p[0], p[1], p[2], u, v, n[0], n[1], n[2]);
      }
    }
    const idx = [];
    for (let j = 0; j < demH - 1; j++)
      for (let i = 0; i < demW - 1; i++) {
        const a = j * demW + i, b = a + 1, c = a + demW, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    prog = compile(VS, FS);
    meshBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
    idxCount = idx.length;

    // extruded side walls (skirt from terrain edge down to BASE)
    const wall = [];
    const edge = (pts, shade) => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [u0, v0] = pts[k], [u1, v1] = pts[k + 1];
        const a = world(u0, v0, heightAt(u0, v0)), b = world(u1, v1, heightAt(u1, v1));
        const a0 = [a[0], BASE, a[2]], b0 = [b[0], BASE, b[2]];
        wall.push(...a, shade, ...a0, shade, ...b, shade, ...b, shade, ...a0, shade, ...b0, shade);
      }
    };
    const N = 260;
    const line = (f) => Array.from({ length: N + 1 }, (_, k) => f(k / N));
    edge(line((s) => [s, 1]), 1.0); // south
    edge(line((s) => [0, s]), 0.75); // west
    edge(line((s) => [1, s]), 0.6); // east
    edge(line((s) => [s, 0]), 0.5); // north
    wallProg = compile(WVS, WFS);
    wallBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wallBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wall), gl.STATIC_DRAW);
    wallCount = wall.length / 4;

    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, sat);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  }

  /** Render the map for camera + look; returns { url, project(u,v[,lift]) }. Cached per identical params. */
  function render(cam, look = {}) {
    const key = JSON.stringify([cam, look]);
    if (cache.has(key)) return cache.get(key);
    const { m, eye } = camMatrix(cam);
    const bg = look.bg || [0.035, 0.04, 0.055];
    gl.viewport(0, 0, W, H);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    gl.disable(gl.CULL_FACE);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    const at = (p, name, n, stride, off) => {
      const l = gl.getAttribLocation(p, name);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, n, gl.FLOAT, false, stride, off);
      return l;
    };
    const l1 = at(prog, 'aPos', 3, 32, 0), l2 = at(prog, 'aUv', 2, 32, 12), l3 = at(prog, 'aNrm', 3, 32, 20);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uM'), false, new Float32Array(m));
    gl.uniform3fv(gl.getUniformLocation(prog, 'uEye'), eye);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uSun'), look.sun || [-0.55, 0.62, -0.35]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uSepia'), look.sepia || 0);
    gl.uniform1f(gl.getUniformLocation(prog, 'uDim'), look.dim || 0);
    gl.uniform4fv(gl.getUniformLocation(prog, 'uSpot'), look.spot || [0, 0, 0.001, 0]);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uFog'), look.fog || [0.62, 0.7, 0.8]);
    gl.uniform1f(gl.getUniformLocation(prog, 'uFogK'), look.fogK != null ? look.fogK : 0.006);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uTex'), 0);
    gl.drawElements(gl.TRIANGLES, idxCount, gl.UNSIGNED_INT, 0);
    [l1, l2, l3].forEach((l) => gl.disableVertexAttribArray(l));

    gl.useProgram(wallProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, wallBuf);
    const w1 = at(wallProg, 'aPos', 3, 16, 0), w2 = at(wallProg, 'aShade', 1, 16, 12);
    gl.uniformMatrix4fv(gl.getUniformLocation(wallProg, 'uM'), false, new Float32Array(m));
    gl.drawArrays(gl.TRIANGLES, 0, wallCount);
    [w1, w2].forEach((l) => gl.disableVertexAttribArray(l));

    const url = canvas.toDataURL('image/jpeg', 0.93);
    const project = (u, v, liftKm = 0) => {
      const c = xform(m, world(u, v, heightAt(u, v) + liftKm / EXAG));
      return [((c[0] / c[3]) * 0.5 + 0.5) * W, (1 - ((c[1] / c[3]) * 0.5 + 0.5)) * H, c[3]];
    };
    const out = { url, project };
    if (cache.size > 6) cache.delete(cache.keys().next().value);
    cache.set(key, out);
    return out;
  }

  window.MAP3D = { init, render, heightAt };
})();
