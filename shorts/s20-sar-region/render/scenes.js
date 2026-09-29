/* s20 — Australia's Search and Rescue Region — MAP EXPLAINER.
 *
 * Layer stack per frame (all driven by renderFrame(t), no timeline framework):
 *   1. <canvas> — NASA world.topo.bathy reprojected every frame onto an orthographic globe
 *      (WebGL fragment shader, inverse orthographic). The camera never stops moving.
 *   2. <svg>    — kinetic cartography: self-drawing SRR outline (thick white glow + parchment),
 *      neighbour zones, halfway arcs, pins, 3D labels, numeric callouts, captions (~70%).
 *
 * Geography (AMSA / NATSAR): SRR western edge 75°E, eastern edge 163°E, maritime to the Antarctic
 * coast, aviation to the South Pole. Northern edge is a simplified trace of the AMSA map along the
 * Indonesian / PNG / Solomon Islands SRRs. Vostok 78.47°S 106.80°E; Concordia 75.10°S 123.33°E.
 */
(function () {
  const W = 1080;
  const H = 1920;
  const DUR = 40.536;
  const CAP_Y = Math.round(H * 0.7); // 1344 — caption band; map labels stay out of 1250–1440
  const D2R = Math.PI / 180;
  const HS = window.HS;
  const { clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, smoothstep } = HS;

  // ---------------------------------------------------------------- geography
  const SRR_NORTH = [
    [75, -6], [85, -6], [96, -6], [104, -10], [110, -12], [117, -12], [123, -11.5], [127, -10],
    [133, -9.6], [138, -9.3], [141, -9.4], [142.6, -9.8], [145, -11], [150, -11.6], [155, -11.2],
    [159, -12], [163, -12.5],
  ];
  function densify(pts, step = 1) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a0, b0] = pts[i];
      const [a1, b1] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(a1 - a0), Math.abs(b1 - b0)) / step));
      for (let k = 0; k < n; k++) out.push([lerp(a0, a1, k / n), lerp(b0, b1, k / n)]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // Clockwise from the NW corner: north edge → east edge (163°E) to the Pole → west edge (75°E) back up.
  // (163,-90)→(75,-90) is the same point on the globe, so it densifies to a zero-length run.
  const SRR_RING = densify([...SRR_NORTH, [163, -90], [75, -90], [75, -6]], 1);
  const ANT_WEDGE = densify([[75, -66], [163, -66], [163, -90], [75, -90], [75, -66]], 1); // aviation SRR over the ice
  const PLACES = {
    canberra: [149.13, -35.28],
    perth: [115.86, -31.95],
    durban: [31.0, -29.86],
    portHedland: [118.6, -20.3],
    bali: [115.2, -8.4],
    sydney: [151.21, -33.87],
    auckland: [174.76, -36.85],
    vostok: [106.8, -78.47],
    concordia: [123.33, -75.1],
    pole: [0, -90],
  };
  // Neighbour-zone bands — only the side that touches our SRR edge, fading outward (no invented far borders).
  const NB = {
    west: { ring: densify([[75, -6], [75, -90], [55, -90], [55, -6], [75, -6]], 1), dir: 'x-' },
    north: { ring: densify([...SRR_NORTH, [163, 2], [75, 2], [75, -6]], 1), dir: 'y-' },
    east: { ring: densify([[163, -12.5], [178, -12.5], [178, -90], [163, -90], [163, -12.5]], 1), dir: 'x+' },
  };

  // ---------------------------------------------------------------- camera
  // [t, lon, lat, R(px), cy]
  const KEYS = [
    [0.0, 128, -36, 760, 820],
    [2.2, 124, -40, 700, 820],
    [4.4, 120, -46, 640, 830],
    [6.8, 116, -58, 660, 840],
    [7.7, 119, -44, 560, 830],
    [10.0, 119, -41, 540, 820],
    [13.8, 118, -42, 520, 820],
    [15.3, 120, -40, 560, 840],
    [17.9, 121, -38, 640, 840],
    [18.7, 88, -28, 640, 820],
    [19.9, 86, -26, 660, 820],
    [20.5, 118, -15, 980, 820],
    [21.3, 120, -14, 1020, 820],
    [21.9, 158, -32, 900, 820],
    [22.7, 160, -34, 880, 820],
    [24.1, 125, -89, 900, 800],
    [24.9, 125, -88.5, 820, 800],
    [25.7, 120, -55, 520, 820],
    [27.4, 88, -45, 640, 820],
    [28.5, 88, -12, 700, 820],
    [29.6, 150, -16, 720, 820],
    [30.6, 125, -48, 560, 820],
    [32.4, 118, -72, 780, 800],
    [34.3, 112, -76, 1100, 800],
    [35.8, 108, -78.3, 2600, 800],
    [37.2, 121, -75.6, 2600, 800],
    [38.8, 115, -77, 1900, 800],
    [40.1, 115, -77, 1750, 800],
    [DUR, 128, -36, 760, 820], // whip back to frame 1
  ];
  function hermiteKeys(t, idx, logv) {
    const n = KEYS.length;
    let i = 0;
    while (i < n - 2 && t > KEYS[i + 1][0]) i++;
    const k0 = KEYS[i];
    const k1 = KEYS[i + 1];
    const v = (k) => (logv ? Math.log(k[idx]) : k[idx]);
    const tan = (j) => {
      const a = KEYS[Math.max(0, j - 1)];
      const b = KEYS[Math.min(n - 1, j + 1)];
      if (j === n - 1 || j === 0) return 0;
      return (v(b) - v(a)) / (b[0] - a[0]);
    };
    const dt = k1[0] - k0[0];
    const s = clamp((t - k0[0]) / dt, 0, 1);
    const s2 = s * s;
    const s3 = s2 * s;
    let m0 = tan(i) * dt;
    let m1 = tan(i + 1) * dt;
    // the final whip is a hard, accelerating move — no tangent carry-over
    if (i === n - 2) {
      const e = s * s * s * (s * (6 * s - 15) + 10);
      const r = lerp(v(k0), v(k1), e);
      return logv ? Math.exp(r) : r;
    }
    const r = (2 * s3 - 3 * s2 + 1) * v(k0) + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * v(k1) + (s3 - s2) * m1;
    return logv ? Math.exp(r) : r;
  }
  function camera(t) {
    const tt = clamp(t, 0, DUR);
    const drift = Math.sin(tt * 0.9) * 0.6; // micro drift so the map never freezes
    return {
      lon: hermiteKeys(tt, 1) + drift,
      lat: clamp(hermiteKeys(tt, 2) + Math.cos(tt * 0.7) * 0.35, -89.6, 89),
      R: hermiteKeys(tt, 3, true) * (1 + 0.012 * Math.sin(tt * 1.3)),
      cx: 540,
      cy: hermiteKeys(tt, 4),
    };
  }
  function camSpeed(t) {
    const a = camera(t - 1 / 60);
    const b = camera(t + 1 / 60);
    const dl = Math.hypot((b.lon - a.lon) * Math.cos(b.lat * D2R), b.lat - a.lat);
    return (dl * 30) + Math.abs(Math.log(b.R / a.R)) * 300; // deg/s-ish
  }

  // ---------------------------------------------------------------- projection
  let CAM = camera(0);
  let SIN0 = 0;
  let COS0 = 1;
  function setCam(c) {
    CAM = c;
    SIN0 = Math.sin(c.lat * D2R);
    COS0 = Math.cos(c.lat * D2R);
  }
  function proj(lon, lat) {
    const l = (lon - CAM.lon) * D2R;
    const p = lat * D2R;
    const cp = Math.cos(p);
    const sp = Math.sin(p);
    const cosc = SIN0 * sp + COS0 * cp * Math.cos(l);
    let x = cp * Math.sin(l);
    let y = COS0 * sp - SIN0 * cp * Math.cos(l);
    if (cosc < 0) {
      const r = Math.hypot(x, y) || 1;
      x /= r;
      y /= r;
    }
    return [CAM.cx + CAM.R * x, CAM.cy - CAM.R * y, cosc];
  }
  const P = (ll) => proj(ll[0], ll[1]);
  const f1 = (v) => v.toFixed(1);
  function ringPath(ring) {
    return 'M' + ring.map((ll) => { const p = P(ll); return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z';
  }
  function linePts(ring) {
    return ring.map((ll) => P(ll));
  }
  function partialPath(pts, u) {
    // polyline cut at fraction u of its projected length; returns {d, head}
    let total = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(L);
      total += L;
    }
    const target = total * clamp(u, 0, 1);
    let acc = 0;
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    let head = pts[0];
    for (let i = 1; i < pts.length; i++) {
      if (acc + seg[i - 1] >= target) {
        const k = seg[i - 1] ? (target - acc) / seg[i - 1] : 0;
        head = [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
        d += `L${f1(head[0])} ${f1(head[1])}`;
        return { d, head };
      }
      acc += seg[i - 1];
      d += `L${f1(pts[i][0])} ${f1(pts[i][1])}`;
      head = pts[i];
    }
    return { d, head };
  }
  function graticule() {
    let d = '';
    for (let lon = 0; lon < 360; lon += 15) {
      let open = false;
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = proj(lon, lat);
        if (p[2] < 0.02) { open = false; continue; }
        d += (open ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]);
        open = true;
      }
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      let open = false;
      for (let lon = 0; lon <= 360; lon += 3) {
        const p = proj(lon, lat);
        if (p[2] < 0.02) { open = false; continue; }
        d += (open ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]);
        open = true;
      }
    }
    return `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.13" stroke-width="1.4"/>`;
  }

  // ---------------------------------------------------------------- WebGL globe
  let gl = null;
  let glProg = null;
  let glU = {};
  let canvas = null;
  const VS = `#version 300 es
    in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const FS = `#version 300 es
    precision highp float;
    uniform sampler2D tex; uniform vec2 res; uniform vec4 cam; uniform float cy; uniform float t;
    out vec4 o;
    float hash(vec2 q){ return fract(sin(dot(q, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 fc = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y);
      float R = cam.z;
      vec2 q = vec2(fc.x - 540., cy - fc.y) / R;
      float rho = length(q);
      // space: deep navy with a faint vignette + sparse stars
      vec2 uv = fc / res;
      vec3 bg = mix(vec3(0.02,0.035,0.07), vec3(0.05,0.08,0.14), smoothstep(1.2,0.0,length(uv-vec2(0.5,0.42))));
      vec2 sc = floor(fc / 3.);
      float st = step(0.9965, hash(sc)) * (0.5 + 0.5*sin(t*2.0 + hash(sc+1.)*20.));
      bg += vec3(st*0.55);
      // atmosphere halo
      float halo = exp(-max(rho-1.,0.)*R/26.) * step(1.,rho);
      bg = mix(bg, vec3(0.45,0.72,1.0), halo*0.55);
      if (rho >= 1.) { o = vec4(bg,1.); return; }
      float z = sqrt(1. - rho*rho);
      float s0 = sin(cam.y), c0 = cos(cam.y);
      float lat = asin(clamp(z*s0 + q.y*c0, -1., 1.));
      float lon = cam.x + atan(q.x, z*c0 - q.y*s0);
      vec2 tuv = vec2(lon/(6.2831853) + 0.5, 0.5 - lat/3.14159265);
      vec3 c = texture(tex, tuv).rgb;
      // grade: a touch more contrast + warmth on land, keep terrain readable under parchment
      c = pow(c, vec3(0.92));
      c = mix(vec3(dot(c, vec3(0.299,0.587,0.114))), c, 1.12);
      // soft sun from upper-left + limb darkening + rim light
      vec3 nrm = vec3(q.x, q.y, z);
      float diff = clamp(dot(nrm, normalize(vec3(-0.45,0.55,0.75))), 0., 1.);
      c *= 0.62 + 0.5*diff;
      c *= mix(0.55, 1.0, pow(z, 0.35));
      c += vec3(0.25,0.45,0.8) * pow(1.-z, 3.5) * 0.55;
      // antialias the disc edge
      float edge = smoothstep(1., 1. - 1.5/R, rho);
      o = vec4(mix(bg, c, edge), 1.);
    }`;
  function initGL(img) {
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.id = 'globe';
    canvas.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;';
    document.body.insertBefore(canvas, document.body.firstChild);
    const root = document.getElementById('root');
    root.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;';
    gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    glProg = gl.createProgram();
    gl.attachShader(glProg, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(glProg, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(glProg);
    gl.useProgram(glProg);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(glProg, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    for (const u of ['tex', 'res', 'cam', 'cy', 't']) glU[u] = gl.getUniformLocation(glProg, u);
    gl.uniform1i(glU.tex, 0);
    gl.uniform2f(glU.res, W, H);
    gl.viewport(0, 0, W, H);
  }
  function drawGlobe(c, t) {
    if (!gl) return;
    gl.uniform4f(glU.cam, c.lon * D2R, c.lat * D2R, c.R, 0);
    gl.uniform1f(glU.cy, c.cy);
    gl.uniform1f(glU.t, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ---------------------------------------------------------------- SVG kit
  const FONT_D = "Anton, 'Montserrat', sans-serif";
  const FONT_B = "Montserrat, 'Liberation Sans', sans-serif";
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(smoothstep(a, a + fi, t), 1 - smoothstep(b - fo, b, t));
  const pop = (t, a, d = 0.35) => easeOutBack(clamp((t - a) / d, 0, 1));

  const DEFS = `
    <defs>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity="0.55"/>
      </filter>
      <filter id="softshadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.45"/>
      </filter>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="9"/>
      </filter>
      <filter id="glowS" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4"/>
      </filter>
      <filter id="parchL" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="11" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.16  0 0 0 1.4 -0.62" result="stain"/>
        <feComposite in="stain" in2="SourceGraphic" operator="in" result="s2"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="s2"/></feMerge>
      </filter>
      <filter id="parch" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="11" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.27  0 0 0 0 0.10  0 0 0 2.2 -0.85" result="stain"/>
        <feComposite in="stain" in2="SourceGraphic" operator="in" result="s2"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="s2"/></feMerge>
      </filter>
      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff6d8"/><stop offset="0.55" stop-color="#ffd166"/><stop offset="1" stop-color="#f39c12"/>
      </linearGradient>
      <linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1e3c2"/>
      </linearGradient>
      <linearGradient id="nbx-" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-opacity="1" stop-color="#8fd3ff"/><stop offset="1" stop-opacity="0" stop-color="#8fd3ff"/></linearGradient>
      <linearGradient id="nbx+" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-opacity="1" stop-color="#b7f0c0"/><stop offset="1" stop-opacity="0" stop-color="#b7f0c0"/></linearGradient>
      <linearGradient id="nby-" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-opacity="1" stop-color="#ffb3c7"/><stop offset="1" stop-opacity="0" stop-color="#ffb3c7"/></linearGradient>
      <radialGradient id="vign" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
      </radialGradient>
    </defs>`;

  // bold extruded label with drop shadow
  function label3d(text, x, y, o = {}) {
    const size = o.size || 64;
    const depth = o.depth != null ? o.depth : Math.max(4, Math.round(size / 11));
    const fill = o.fill || 'url(#ivory)';
    const side = o.side || '#3b2610';
    const font = o.font || FONT_D;
    const anchor = o.anchor || 'middle';
    const ls = o.ls != null ? o.ls : size * 0.02;
    const sc = o.scale != null ? o.scale : 1;
    const op = o.opacity != null ? o.opacity : 1;
    if (op <= 0.001 || sc <= 0.001) return '';
    const t = esc(text);
    let s = '';
    for (let i = depth; i >= 1; i--) {
      s += `<text x="${i * 0.5}" y="${i}" fill="${side}" stroke="${side}" stroke-width="${size * 0.07}" stroke-linejoin="round">${t}</text>`;
    }
    s += `<text x="0" y="0" fill="${fill}" stroke="${o.stroke || '#1c1206'}" stroke-width="${size * 0.07}" stroke-linejoin="round" paint-order="stroke">${t}</text>`;
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})" opacity="${op.toFixed(3)}" filter="url(#shadow)"
      font-family="${font}" font-size="${size}" text-anchor="${anchor}" style="letter-spacing:${ls}px">${s}</g>`;
  }
  // chip: rounded parchment tag with coloured dot
  function chip(text, x, y, o = {}) {
    const size = o.size || 34;
    const w = o.w || text.length * size * 0.74 + size * 1.7;
    const h = size * 1.7;
    const sc = o.scale != null ? o.scale : 1;
    const op = o.opacity != null ? o.opacity : 1;
    if (op <= 0.001 || sc <= 0.001) return '';
    const dot = o.dot || '#e63946';
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})" opacity="${op.toFixed(3)}" filter="url(#softshadow)">
      <rect x="${-w / 2}" y="${-h / 2 + 5}" width="${w}" height="${h}" rx="${h / 2}" fill="#3b2610"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${o.bg || '#f6e7c4'}" stroke="#fff" stroke-width="4"/>
      <circle cx="${-w / 2 + h * 0.5}" cy="0" r="${size * 0.26}" fill="${dot}" stroke="#fff" stroke-width="3"/>
      <text x="${h * 0.22}" y="${size * 0.36}" text-anchor="middle" font-family="${FONT_B}" font-weight="900"
        font-size="${size}" fill="${o.color || '#2a1a08'}" style="letter-spacing:1px">${esc(text)}</text>
    </g>`;
  }
  // teardrop pin that drops in with a bounce + ground shadow + pulse ring
  function pin(x, y, t, t0, o = {}) {
    if (t < t0) return '';
    const u = clamp((t - t0) / 0.45, 0, 1);
    const b = u < 1 ? 1 - Math.abs(Math.cos(u * Math.PI * 1.5)) * (1 - u) : 1;
    const drop = (1 - easeOutCubic(u)) * -220;
    const s = o.size || 1;
    const col = o.color || '#e63946';
    const pr = ((t - t0) % 1.4) / 1.4;
    return `<g transform="translate(${f1(x)} ${f1(y)})">
      <ellipse cx="0" cy="3" rx="${22 * s * (0.4 + 0.6 * u)}" ry="${7 * s * (0.4 + 0.6 * u)}" fill="#000" opacity="${0.4 * u}"/>
      <circle cx="0" cy="0" r="${12 + pr * 70 * s}" fill="none" stroke="${col}" stroke-width="${5 * (1 - pr)}" opacity="${(1 - pr) * 0.9}"/>
      <g transform="translate(0 ${f1(drop)}) scale(${(s * (0.85 + 0.15 * b)).toFixed(3)})" filter="url(#softshadow)">
        <path d="M0 0 C -8 -18 -30 -34 -30 -58 A 30 30 0 1 1 30 -58 C 30 -34 8 -18 0 0 Z" fill="${col}" stroke="#fff" stroke-width="5"/>
        <circle cx="0" cy="-58" r="11" fill="#fff"/>
      </g>
    </g>`;
  }
  // arrowed arc between two lon/lat points (drawn progressively), bowed upward in screen space
  function arcLine(a, b, u, o = {}) {
    if (u <= 0) return { svg: '', mid: null };
    const pa = P(a);
    const pb = P(b);
    const mx = (pa[0] + pb[0]) / 2;
    const my = (pa[1] + pb[1]) / 2;
    const dx = pb[0] - pa[0];
    const dy = pb[1] - pa[1];
    const L = Math.hypot(dx, dy) || 1;
    const bow = o.bow != null ? o.bow : 0.22;
    let nx = -dy / L;
    let ny = dx / L;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const c = [mx + nx * L * bow, my + ny * L * bow];
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const s = i / 40;
      pts.push([
        (1 - s) * (1 - s) * pa[0] + 2 * (1 - s) * s * c[0] + s * s * pb[0],
        (1 - s) * (1 - s) * pa[1] + 2 * (1 - s) * s * c[1] + s * s * pb[1],
      ]);
    }
    const pp = partialPath(pts, u);
    const col = o.color || '#ffd166';
    const mid = pts[20];
    // arrow head at the leading point
    const k = Math.max(1, Math.round(u * 40));
    const hp = pp.head;
    const prev = pts[Math.max(0, k - 2)];
    const ang = Math.atan2(hp[1] - prev[1], hp[0] - prev[0]) * 180 / Math.PI;
    const svg = `
      <path d="${pp.d}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="16" stroke-linecap="round" transform="translate(0 6)"/>
      <path d="${pp.d}" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round"/>
      <path d="${pp.d}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" ${o.dash ? 'stroke-dasharray="2 18"' : ''}/>
      <g transform="translate(${f1(hp[0])} ${f1(hp[1])}) rotate(${ang.toFixed(1)})">
        <path d="M 10 0 L -20 -17 L -12 0 L -20 17 Z" fill="${col}" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
      </g>`;
    return { svg, mid, pts };
  }

  // ---------------------------------------------------------------- captions (~70%)
  let CAPS = null;
  function captions(t) {
    const ep = window.EPISODE;
    if (!CAPS) CAPS = HS.groupCaptions(ep.words || [], 4, 0.45);
    const c = CAPS.find((g) => t >= g.start && t <= g.end);
    if (!c) return '';
    const words = (ep.words || []).filter((w) => w.start >= c.start - 0.001 && w.end <= c.end);
    const s = easeOutBack(clamp((t - c.start) / 0.16, 0, 1));
    const op = t > c.end - 0.08 ? clamp((c.end - t) / 0.08, 0, 1) : 1;
    // one <text> per line, one <tspan> per word, so the browser handles spacing; spoken word glows gold
    const size = 62;
    const lines = [[]];
    let chars = 0;
    for (const w of words) {
      if (chars + w.word.length > 22 && lines[lines.length - 1].length) { lines.push([]); chars = 0; }
      lines[lines.length - 1].push(w);
      chars += w.word.length + 1;
    }
    let out = '';
    lines.forEach((ln, li) => {
      const y = CAP_Y + (li - (lines.length - 1) / 2) * 78 + 22;
      const spans = ln.map((w, i) => {
        const on = t >= w.start - 0.03;
        const cur = on && t < w.end + 0.05;
        return `<tspan fill="${cur ? '#ffd166' : '#ffffff'}" fill-opacity="${on ? 1 : 0.6}">${i ? ' ' : ''}${esc(w.word.toUpperCase())}</tspan>`;
      }).join('');
      out += `<text x="540" y="${y}" text-anchor="middle" font-family="${FONT_B}" font-weight="900" font-size="${size}"
        stroke="#0b0703" stroke-width="13" stroke-linejoin="round" paint-order="stroke" xml:space="preserve">${spans}</text>`;
    });
    return `<g opacity="${op.toFixed(3)}" transform="translate(540 ${CAP_Y}) scale(${s.toFixed(3)}) translate(-540 ${-CAP_Y})" filter="url(#softshadow)">${out}</g>`;
  }

  // ---------------------------------------------------------------- beats
  const T = {
    amsa: 0.55, tenth: 2.22, tease: 4.82, srr: 7.9, srrDone: 10.0, zones: 10.4, icao: 12.85,
    km: 15.3, kmEnd: 18.1, africa: 18.35, indo: 19.95, nz: 21.4, pole: 22.95, poleHit: 24.3,
    borders: 25.3, sa: 27.4, lanka: 28.5, solo: 29.46, ten: 30.0, bases: 30.9, vostok: 35.5,
    conc: 37.1, loop: 38.94, whip: 40.1,
  };

  function srrLayer(t) {
    // outline progress: fully drawn in the hook (frame 1) and again at the loop whip; self-draws at 7.9
    let prog;
    let fill;
    if (t < 4.4) { prog = 1; fill = 1; }
    else if (t < T.srr) { prog = 1; fill = 1 - smoothstep(4.4, 5.6, t); }
    else { prog = easeInOutCubic(clamp((t - T.srr) / (T.srrDone - T.srr), 0, 1)); fill = smoothstep(9.0, 10.6, t); }
    const outlineOp = t < T.srr ? 1 - 0.75 * smoothstep(4.4, 5.6, t) * (1 - smoothstep(7.2, 7.9, t)) : 1;
    const ringD = ringPath(SRR_RING);
    const pts = linePts(SRR_RING);
    const pp = prog >= 1 ? { d: ringD, head: null } : partialPath(pts, prog);
    // pulse the fill on key scale moments
    const pulse = 0.12 * Math.exp(-Math.pow((t - T.tenth - 0.3) / 0.35, 2)) + 0.12 * Math.exp(-Math.pow((t - 16.2) / 0.4, 2))
      + 0.1 * Math.exp(-Math.pow((t - DUR) / 0.25, 2));
    let s = '';
    if (fill > 0.001) {
      s += `<path d="${ringD}" fill="#ecd6a3" fill-opacity="${((CAM.R > 1100 ? 0.22 : 0.30) + pulse) * fill}" filter="url(#${CAM.R > 1100 ? 'parchL' : 'parch'})"/>`;
    }
    if (prog > 0) {
      s += `<g opacity="${outlineOp.toFixed(3)}">
        <path d="${pp.d}" fill="none" stroke="#fff" stroke-width="26" stroke-opacity="0.85" stroke-linejoin="round" filter="url(#glow)"/>
        <path d="${pp.d}" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="${pp.d}" fill="none" stroke="#7a4f1d" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="14 9"/>
      </g>`;
      if (pp.head) {
        s += `<circle cx="${f1(pp.head[0])}" cy="${f1(pp.head[1])}" r="26" fill="#fff" filter="url(#glowS)"/>
              <circle cx="${f1(pp.head[0])}" cy="${f1(pp.head[1])}" r="11" fill="#ffd166" stroke="#fff" stroke-width="4"/>`;
      }
    }
    return s;
  }

  function neighbours(t) {
    // soft mosaic when "zones like this" is spoken, then each neighbour lights on its name
    const base = 0.32 * win(t, T.zones, 14.2, 0.5, 0.6) + 0.22 * win(t, T.borders, 30.8, 0.4, 0.5);
    const hi = {
      west: 0.45 * win(t, T.sa - 0.1, 30.8, 0.2, 0.5),
      north: 0.45 * win(t, T.lanka - 0.1, 30.8, 0.2, 0.5),
      east: 0.45 * win(t, T.solo - 0.1, 30.8, 0.2, 0.5),
    };
    let s = '';
    for (const k of ['west', 'north', 'east']) {
      const op = base + hi[k];
      if (op < 0.01) continue;
      s += `<path d="${ringPath(NB[k].ring)}" fill="url(#nb${NB[k].dir})" opacity="${op.toFixed(3)}"/>`;
    }
    return s;
  }

  function hook(t) {
    // Frame 1: "1/10 OF EARTH" already on screen (unspoken hook). Leaves at ~4.3; slams back in the loop whip.
    let op = 1 - smoothstep(4.1, 4.6, t);
    let sc = 1 + 0.07 * Math.exp(-Math.pow((t - T.tenth - 0.25) / 0.22, 2)) + 0.02 * Math.sin(t * 3);
    let dy = -smoothstep(4.1, 4.6, t) * 160;
    if (t > T.whip) {
      const u = clamp((t - T.whip) / (DUR - T.whip), 0, 1);
      op = smoothstep(0.15, 0.7, u);
      sc = lerp(1.9, 1, easeOutCubic(u));
      dy = 0;
    }
    if (op <= 0.001) return '';
    return `<g opacity="${op.toFixed(3)}" transform="translate(0 ${f1(dy)})">
      ${label3d('1/10', 540, 470, { size: 270, fill: 'url(#gold)', side: '#5a2d05', scale: sc, depth: 16 })}
      ${label3d('OF EARTH', 540, 610, { size: 118, scale: sc, depth: 9, ls: 6 })}
    </g>`;
  }

  function km2(t) {
    if (t < T.km - 0.2 || t > 18.6) return '';
    const op = win(t, T.km - 0.2, 18.6, 0.2, 0.35);
    const n = Math.round(53 * easeOutCubic(clamp((t - T.km) / 1.1, 0, 1)));
    const sc = pop(t, T.km - 0.2, 0.4) * (1 + 0.08 * Math.exp(-Math.pow((t - 16.45) / 0.18, 2)));
    const kmOp = smoothstep(16.1, 16.4, t);
    return `<g opacity="${op.toFixed(3)}">
      ${label3d('~' + n, 540, 440, { size: 250, fill: 'url(#gold)', side: '#5a2d05', scale: sc, depth: 15 })}
      ${label3d('MILLION KM²', 540, 560, { size: 104, scale: sc * (0.8 + 0.2 * kmOp), opacity: kmOp, depth: 8, ls: 4 })}
      ${chip('≈ 1/10 OF EARTH', 540, 650, { size: 32, scale: pop(t, 16.9), opacity: smoothstep(16.8, 17.0, t), dot: '#ffd166' })}
    </g>`;
  }

  function halfway(t) {
    let s = '';
    const legs = [
      { t0: T.africa, a: PLACES.perth, b: PLACES.durban, name: 'AFRICA', at: [36, -22], edgeLon: 75, end: 19.85 },
      { t0: T.indo, a: PLACES.portHedland, b: PLACES.bali, name: 'INDONESIA', at: [111, -6.6], end: 21.3 },
      { t0: T.nz, a: PLACES.sydney, b: PLACES.auckland, name: 'NEW ZEALAND', at: [173, -40.5], end: 23.1 },
    ];
    for (const L of legs) {
      if (t < L.t0 - 0.05 || t > L.end + 0.25) continue;
      const op = win(t, L.t0 - 0.05, L.end + 0.25, 0.1, 0.25);
      const u = easeInOutCubic(clamp((t - L.t0) / 0.9, 0, 1));
      const arc = arcLine(L.a, L.b, u, { color: '#ffd166', bow: 0.18 });
      const pa = P(L.a);
      const pb = P(L.b);
      const hwOp = smoothstep(L.t0 + 0.45, L.t0 + 0.6, t);
      const nameOp = smoothstep(L.t0 + 0.75, L.t0 + 0.9, t);
      const nm = P(L.at);
      s += `<g opacity="${op.toFixed(3)}">
        <circle cx="${f1(pa[0])}" cy="${f1(pa[1])}" r="13" fill="#fff" stroke="#1c1206" stroke-width="4"/>
        ${arc.svg}
        ${u > 0.95 ? `<circle cx="${f1(pb[0])}" cy="${f1(pb[1])}" r="13" fill="#ffd166" stroke="#fff" stroke-width="4"/>` : ''}
        ${arc.mid ? `<g opacity="${hwOp}"><circle cx="${f1(arc.mid[0])}" cy="${f1(arc.mid[1])}" r="${12 + 10 * (1 - hwOp)}" fill="#fff" stroke="#e63946" stroke-width="6"/></g>` : ''}
        ${arc.mid ? chip('HALFWAY', arc.mid[0], clamp(arc.mid[1] - 78, 200, 1180), { size: 34, scale: pop(t, L.t0 + 0.45), opacity: hwOp, dot: '#e63946' }) : ''}
        ${label3d(L.name, clamp(nm[0], 200, 880), clamp(nm[1], 220, 1190), { size: 78, scale: pop(t, L.t0 + 0.75), opacity: nameOp })}
      </g>`;
    }
    return s;
  }

  function southPole(t) {
    if (t < T.pole || t > 25.9) return '';
    const op = win(t, T.pole, 25.9, 0.3, 0.4);
    const wedgeOp = smoothstep(T.pole + 0.2, T.poleHit, t) * (0.55 + 0.25 * Math.sin(t * 9));
    const pp = P(PLACES.pole);
    let s = `<g opacity="${op.toFixed(3)}">
      <path d="${ringPath(ANT_WEDGE)}" fill="#fff4d6" fill-opacity="${(0.28 * wedgeOp).toFixed(3)}" stroke="#fff" stroke-width="5" stroke-opacity="${wedgeOp.toFixed(3)}" stroke-dasharray="18 10"/>
      ${pin(pp[0], pp[1], t, T.poleHit - 0.35, { size: 1.25, color: '#e63946' })}
      ${label3d('SOUTH POLE', 540, clamp(pp[1] - 190, 240, 1100), { size: 96, scale: pop(t, T.poleHit), opacity: smoothstep(T.poleHit - 0.05, T.poleHit + 0.1, t), ls: 3 })}
      ${chip('AVIATION SRR', 540, clamp(pp[1] + 90, 300, 1180), { size: 30, scale: pop(t, T.poleHit + 0.25), opacity: smoothstep(T.poleHit + 0.2, T.poleHit + 0.35, t), dot: '#4cc9f0' })}
    </g>`;
    return s;
  }

  function borderChips(t) {
    if (t < T.borders || t > 30.9) return '';
    const op = win(t, T.borders, 30.9, 0.2, 0.4);
    const list = [
      { name: 'SOUTH AFRICA', t0: T.sa, at: [60, -40], dot: '#8fd3ff' },
      { name: 'SRI LANKA', t0: T.lanka, at: [80, 2], dot: '#ffb3c7' },
      { name: 'SOLOMON ISLANDS', t0: T.solo, at: [160, -7], dot: '#b7f0c0' },
    ];
    let s = '';
    for (const c of list) {
      if (t < c.t0 - 0.05) continue;
      const p = P(c.at);
      const x = clamp(p[0], 250, 830);
      const y = clamp(p[1], 230, 1180);
      s += chip(c.name, x, y, { size: 38, scale: pop(t, c.t0), opacity: smoothstep(c.t0 - 0.05, c.t0 + 0.05, t), dot: c.dot });
    }
    const tenOp = smoothstep(T.ten, T.ten + 0.15, t);
    s += label3d('10 NEIGHBOURING ZONES', 540, 300, { size: 64, scale: pop(t, T.ten), opacity: tenOp, depth: 6, ls: 2 });
    return `<g opacity="${op.toFixed(3)}">${s}</g>`;
  }

  function stations(t) {
    // tease "?" markers in beat 2, full pins in beat 8, SOS rings in the loop line
    let s = '';
    const tease = win(t, T.tease + 0.4, 7.3, 0.3, 0.4);
    if (tease > 0.01) {
      for (const [k, dt] of [['vostok', 0], ['concordia', 0.35]]) {
        const p = P(PLACES[k]);
        const u = ((t - T.tease - dt) % 1.1) / 1.1;
        s += `<g opacity="${(tease * smoothstep(T.tease + 0.4 + dt, T.tease + 0.6 + dt, t)).toFixed(3)}">
          <circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${14 + 50 * u}" fill="none" stroke="#fff" stroke-width="${4 * (1 - u)}"/>
          ${label3d('?', p[0], p[1] + 22, { size: 70, fill: 'url(#gold)', depth: 5, side: '#5a2d05' })}
        </g>`;
      }
    }
    if (t < T.bases - 0.2) return s;
    const op = t > T.whip ? 1 - smoothstep(T.whip, T.whip + 0.2, t) : 1;
    // SRR band edges on the ice — shows both bases sit inside 75°E–163°E
    const bandOp = smoothstep(T.bases, T.bases + 0.8, t) * op;
    let edges = '';
    for (const lon of [75, 163]) {
      const pts = linePts(densify([[lon, -60], [lon, -90]], 0.5));
      edges += `<path d="${partialPath(pts, easeOutCubic(clamp((t - T.bases) / 1.2, 0, 1))).d}" fill="none" stroke="#ffd166" stroke-width="6" stroke-dasharray="20 10"/>`;
    }
    s += `<g opacity="${bandOp.toFixed(3)}">${edges}</g>`;
    const e75 = P([75, -68]);
    const e163 = P([163, -68]);
    s += chip('75°E', clamp(e75[0], 130, 950), clamp(e75[1], 230, 1180), { size: 30, opacity: bandOp * smoothstep(31.6, 31.8, t), scale: pop(t, 31.6), dot: '#ffd166' });
    s += chip('163°E', clamp(e163[0], 130, 950), clamp(e163[1], 230, 1180), { size: 30, opacity: bandOp * smoothstep(31.9, 32.1, t), scale: pop(t, 31.9), dot: '#ffd166' });

    const sos = t > T.loop ? smoothstep(T.loop, T.loop + 0.2, t) : 0;
    for (const st of [
      { k: 'vostok', name: 'VOSTOK', nation: 'RUSSIA', t0: T.vostok, dx: -170, dy: 150, dot: '#e63946' },
      { k: 'concordia', name: 'CONCORDIA', nation: 'FRANCE · ITALY', t0: T.conc, dx: 150, dy: -170, dot: '#4361ee' },
    ]) {
      if (t < st.t0 - 0.3) continue;
      const p = P(PLACES[st.k]);
      const lop = smoothstep(st.t0 - 0.05, st.t0 + 0.1, t) * op;
      let ring = '';
      if (sos > 0) {
        for (let i = 0; i < 3; i++) {
          const u = (((t - T.loop) * 1.6 + i / 3) % 1);
          ring += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${20 + u * 160}" fill="none" stroke="#ff3b3b" stroke-width="${7 * (1 - u)}" opacity="${(sos * (1 - u)).toFixed(3)}"/>`;
        }
      }
      s += `<g opacity="${op.toFixed(3)}">${ring}${pin(p[0], p[1], t, st.t0 - 0.3, { size: 1.1, color: st.dot })}</g>`;
      s += label3d(st.name, clamp(p[0] + st.dx, 230, 850), clamp(p[1] + st.dy, 230, 1150), { size: 84, scale: pop(t, st.t0), opacity: lop, ls: 3 });
      s += chip(st.nation, clamp(p[0] + st.dx, 230, 850), clamp(p[1] + st.dy + 62, 280, 1190), { size: 30, scale: pop(t, st.t0 + 0.15), opacity: lop, dot: st.dot });
    }
    return s;
  }

  function amsa(t) {
    if (t > 4.4) return '';
    const p = P(PLACES.canberra);
    const op = 1 - smoothstep(4.0, 4.4, t);
    return `<g opacity="${op.toFixed(3)}">
      ${pin(p[0], p[1], t, T.amsa - 0.3, { size: 0.9, color: '#e63946' })}
      ${chip('AMSA · CANBERRA', clamp(p[0] - 10, 260, 820), p[1] + 64, { size: 30, scale: pop(t, T.amsa), opacity: smoothstep(T.amsa - 0.05, T.amsa + 0.1, t) })}
    </g>`;
  }

  function srrLabel(t) {
    const op = win(t, 8.4, 14.4, 0.2, 0.4);
    if (op <= 0.001) return '';
    const c = P([119, -46]);
    const icaoOp = smoothstep(T.icao, T.icao + 0.12, t);
    return `<g opacity="${op.toFixed(3)}">
      ${label3d('SRR', c[0], c[1] - 20, { size: 150, scale: pop(t, 8.4, 0.45), fill: 'url(#gold)', side: '#5a2d05', depth: 12, ls: 10 })}
      ${label3d('SEARCH AND RESCUE REGION', 540, 300, { size: 58, scale: pop(t, 8.5), opacity: smoothstep(8.5, 8.7, t), depth: 5, ls: 2 })}
      ${chip('ICAO · IMO', 540, 390, { size: 32, scale: pop(t, T.icao), opacity: icaoOp, dot: '#4cc9f0' })}
    </g>`;
  }

  function whipFX(t, speed) {
    // speed lines during fast camera moves (pole dive, neighbour sweep, loop whip)
    const k = clamp((speed - 70) / 160, 0, 1);
    if (k <= 0.01) return '';
    let s = '';
    for (let i = 0; i < 26; i++) {
      const r = (Math.sin(i * 91.7) * 0.5 + 0.5);
      const x = r * W;
      const y0 = ((i * 347 + t * 4200) % (H + 600)) - 300;
      s += `<line x1="${f1(x)}" y1="${f1(y0)}" x2="${f1(x)}" y2="${f1(y0 + 180 + 240 * k)}" stroke="#fff" stroke-width="${2 + 3 * r}" stroke-opacity="${(0.12 + 0.25 * r) * k}" stroke-linecap="round"/>`;
    }
    return s;
  }

  // ---------------------------------------------------------------- frame
  window.EPISODE = {
    duration: DUR,
    fps: 30,
    images: { world: '/img/s20_01_world_topo_basemap_ref.jpg' },
    words: [],
    scenes: [],
    preload: async function () {
      const fonts = [
        ['Anton', '/img/fonts/anton-latin-400-normal.woff2', '400'],
        ['Montserrat', '/img/fonts/montserrat-latin-800-normal.woff2', '800'],
        ['Montserrat', '/img/fonts/montserrat-latin-900-normal.woff2', '900'],
      ];
      for (const [fam, url, wt] of fonts) {
        const ff = new FontFace(fam, `url(${url})`, { weight: wt });
        await ff.load();
        document.fonts.add(ff);
      }
      const img = new Image();
      img.src = this.images.world;
      await img.decode();
      initGL(img);
    },
  };

  window.renderFrame = function (t) {
    const c = camera(t);
    setCam(c);
    drawGlobe(c, t);
    const speed = camSpeed(t);
    if (canvas) canvas.style.filter = speed > 90 ? `blur(${clamp((speed - 90) / 60, 0, 5).toFixed(2)}px)` : 'none';
    const root = document.getElementById('root');
    const body = [
      graticule(),
      neighbours(t),
      srrLayer(t),
      southPole(t),
      halfway(t),
      stations(t),
      amsa(t),
      srrLabel(t),
      borderChips(t),
      km2(t),
      hook(t),
      whipFX(t, speed),
    ].join('');
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${DEFS}
      ${body}
      <rect width="${W}" height="${H}" fill="url(#vign)"/>
      ${captions(t)}
    </svg>`;
  };
})();
