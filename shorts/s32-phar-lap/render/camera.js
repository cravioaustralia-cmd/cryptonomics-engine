/* s32 Phar Lap — the one continuous camera (shared by scenes.js in the page and by tools/dump_spins.mjs in node).
 *
 * Projection: orthographic, km, centred on a plane centre (lon0, lat0) — see tools/geo_common.py.
 *   A (160E, 37S)  Tasman     B (118W, 33N)  California / Baja     M (178W, 4S)  whole Pacific (opening reveal, master map)
 * Static basemap layers exist for each plane. Between planes the centre slerps ("globe spin"); those frames use a
 * per-frame basemap rendered by tools/make_spin.py from the same graded world texture, with this exact camera.
 * Longitudes are unwrapped (east of 180 continues past 180: Tijuana = 243.01) so the keys interpolate smoothly.
 */
(function (root) {
  'use strict';
  const D2R = Math.PI / 180;
  const RE = 6371;
  const FOCAL = 1700;
  const FPS = 30;
  const DUR = 74.76;
  const PLANES = { A: [160, -37], B: [242, 33], M: [182, -4] };

  // --- places (lon unwrapped, lat)
  const P = {
    timaru: [171.25, -44.4], // near Timaru (birth)
    sydney: [151.21, -33.87],
    flem: [144.907, -37.788], // Flemington racecourse
    melb: [144.963, -37.814],
    canb: [149.13, -35.28],
    wlg: [174.78, -41.29],
    agua: [243.01, 32.505], // Agua Caliente racetrack, Tijuana, Mexico
    calif: [237.82, 37.45], // where he died (no town is labelled; the script says California)
    calLab: [240.4, 36.6],
  };

  // --- plane schedule: [t0, t1, from, to] (from === to: static plane)
  const SEG = [
    [0, 1.85, 'A', 'A'],
    [1.85, 3.45, 'A', 'M'],
    [3.45, 3.55, 'M', 'M'],
    [3.55, 5.0, 'M', 'A'],
    [5.0, 36.3, 'A', 'A'],
    [36.3, 38.3, 'A', 'B'],
    [38.3, 54.9, 'B', 'B'],
    [54.9, 56.5, 'B', 'A'],
    [56.5, 68.7, 'A', 'A'],
    [68.7, 70.3, 'A', 'M'],
    [70.3, 73.45, 'M', 'M'],
    [73.45, 74.4, 'M', 'A'],
    [74.4, DUR + 1, 'A', 'A'],
  ];

  // --- camera keys: [t, lookLon, lookLat, zoom px/km, tilt deg, bearing deg (360 = north up), focal y]
  const OPEN = [164.2, -40.6, 0.47, 38, 334, 1010];
  const CAMK = [
    [0.0, ...OPEN],
    [1.75, 160.5, -38.8, 0.42, 34, 340, 1000],
    [3.0, 197, -13, 0.098, 8, 360, 960],
    [3.5, 196, -13, 0.094, 6, 360, 960],
    [4.9, 160.2, -37.6, 0.25, 20, 356, 980],
    [6.7, 160.0, -37.8, 0.265, 22, 358, 990],
    [8.4, 171.0, -44.0, 2.2, 44, 352, 1010],
    [10.9, 171.2, -44.3, 3.4, 48, 350, 1020],
    [12.55, 171.25, -44.38, 7.5, 50, 352, 1030],
    [13.9, 171.25, -44.39, 9.0, 52, 354, 1030],
    [15.3, 171.24, -44.37, 6.0, 48, 356, 1020],
    [17.1, 171.2, -44.3, 4.2, 46, 358, 1010],
    [18.5, 160.8, -39.0, 0.42, 30, 344, 990],
    [19.6, 151.6, -34.1, 1.6, 42, 350, 1010],
    [22.3, 151.4, -34.3, 1.9, 44, 354, 1010],
    [23.6, 149.4, -36.0, 0.95, 38, 358, 1000],
    [27.0, 146.6, -37.3, 1.05, 40, 360, 1000],
    [28.9, 144.95, -37.8, 2.6, 46, 362, 1040],
    [30.6, 144.92, -37.82, 3.8, 50, 364, 1060],
    [32.6, 144.92, -37.84, 4.2, 50, 362, 1110],
    [34.6, 144.93, -37.84, 3.6, 48, 360, 1100],
    [36.2, 165, -15, 0.12, 12, 360, 960],
    [38.2, 238, 30, 0.13, 12, 360, 960],
    [39.4, 243.05, 32.48, 3.2, 44, 358, 1010],
    [41.0, 243.02, 32.5, 4.6, 48, 360, 1020],
    [42.6, 242.6, 33.6, 1.4, 40, 360, 1000],
    [44.6, 240.6, 35.6, 0.85, 36, 358, 990],
    [47.4, 238.6, 36.9, 1.25, 40, 356, 1000],
    [50.5, 238.4, 37.0, 1.35, 40, 354, 1000],
    [53.6, 238.4, 37.0, 1.3, 40, 358, 1000],
    [54.9, 242, 33, 0.13, 10, 360, 960],
    [56.5, 160, -37, 0.14, 10, 360, 960],
    [57.6, 159.4, -37.6, 0.29, 26, 356, 990],
    [60.6, 159.8, -38.0, 0.3, 28, 352, 990],
    [62.2, 151.0, -35.9, 1.15, 40, 350, 1000],
    [64.6, 149.6, -35.5, 1.35, 42, 352, 1010],
    [66.2, 159.8, -38.0, 0.29, 28, 356, 990],
    [68.5, 160.2, -38.1, 0.31, 30, 358, 990],
    [70.3, 182, -12, 0.088, 6, 360, 960],
    [73.3, 180, -10, 0.092, 6, 360, 960],
    [74.4, 163.6, -40.2, 0.4, 32, 338, 1000],
    [DUR, ...OPEN],
  ];

  // ---------------------------------------------------------------- maths
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function mono(keys) {
    const n = keys.length;
    const xs = keys.map((k) => k[0]);
    const ys = keys.map((k) => k[1]);
    const d = [];
    const m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * a * d[i];
        m[i + 1] = tau * b * d[i];
      }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (i < n - 2 && x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i];
      const t = (x - xs[i]) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }
  function fwd(lon, lat, c) {
    const s0 = Math.sin(c[1] * D2R);
    const c0 = Math.cos(c[1] * D2R);
    const lo = (lon - c[0]) * D2R;
    const la = lat * D2R;
    const cl = Math.cos(la);
    const x = RE * cl * Math.sin(lo);
    const y = RE * (c0 * Math.sin(la) - s0 * cl * Math.cos(lo));
    const vis = s0 * Math.sin(la) + c0 * cl * Math.cos(lo);
    return [x, -y, vis];
  }
  const vec = (ll) => [Math.cos(ll[1] * D2R) * Math.cos(ll[0] * D2R), Math.cos(ll[1] * D2R) * Math.sin(ll[0] * D2R), Math.sin(ll[1] * D2R)];
  const unvec = (v) => [Math.atan2(v[1], v[0]) / D2R, Math.asin(clamp(v[2], -1, 1)) / D2R];
  function slerpLL(a, b, u) {
    const va = vec(a);
    const vb = vec(b);
    const dot = clamp(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2], -1, 1);
    const om = Math.acos(dot);
    if (om < 1e-6) return a.slice();
    const sa = Math.sin((1 - u) * om) / Math.sin(om);
    const sb = Math.sin(u * om) / Math.sin(om);
    return unvec([va[0] * sa + vb[0] * sb, va[1] * sa + vb[1] * sb, va[2] * sa + vb[2] * sb]);
  }
  function segAt(t) {
    for (const s of SEG) if (t >= s[0] && t < s[1]) return s;
    return SEG[SEG.length - 1];
  }
  // plane centre at t; spin = true while the centre is moving
  function centreAt(t) {
    const s = segAt(t);
    if (s[2] === s[3]) return { c: PLANES[s[2]], plane: s[2], spin: false };
    const u = easeInOut(clamp((t - s[0]) / (s[1] - s[0]), 0, 1));
    return { c: slerpLL(PLANES[s[2]], PLANES[s[3]], u), plane: null, spin: true, from: s[2], to: s[3], u };
  }
  const CAMI = [1, 2, 3, 4, 5, 6].map((j) => mono(CAMK.map((k) => [k[0], j === 3 ? Math.log(k[3]) : k[j]])));
  function camAt(t, track) {
    const ce = centreAt(t);
    let lon = CAMI[0](t);
    let lat = CAMI[1](t);
    if (track && track.w > 0) {
      lon = lon + (track.ll[0] - lon) * track.w;
      lat = lat + (track.ll[1] - lat) * track.w;
    }
    const p = fwd(lon, lat, ce.c);
    const z = Math.exp(CAMI[2](t));
    // gentle always-on drift in screen px (identical at t = 0 and t = DUR so the loop seam is clean)
    const tt = t >= DUR - 0.5 ? t - DUR : t;
    const dx = 7 * Math.sin(tt * 0.57) + 3 * Math.sin(tt * 1.31 + 1);
    const dy = 5 * Math.sin(tt * 0.79 + 2);
    return { cx: p[0] + dx / z, cy: p[1] + dy / z, z, tilt: CAMI[3](t), bear: CAMI[4](t), fy: CAMI[5](t), fx: 540, c: ce.c, plane: ce.plane, spin: ce.spin, seg: ce };
  }
  function mul(A, B) {
    const R = new Array(9);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) R[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    return R;
  }
  function camMatrix(c) {
    const s = Math.sin(c.tilt * D2R);
    const co = Math.cos(c.tilt * D2R);
    const ph = -c.bear * D2R;
    const T = [1, 0, -c.cx, 0, 1, -c.cy, 0, 0, 1];
    const S = [c.z, 0, 0, 0, c.z, 0, 0, 0, 1];
    const R = [Math.cos(ph), -Math.sin(ph), 0, Math.sin(ph), Math.cos(ph), 0, 0, 0, 1];
    const Pp = [1, (-c.fx * s) / FOCAL, c.fx, 0, co - (c.fy * s) / FOCAL, c.fy, 0, -s / FOCAL, 1];
    return mul(Pp, mul(R, mul(S, T)));
  }
  // frames whose basemap comes from a per-frame spin render
  function spinFrames() {
    const out = [];
    const n = Math.round(DUR * FPS);
    for (let i = 0; i < n; i++) if (centreAt(i / FPS).spin) out.push(i);
    return out;
  }
  const CAM = { D2R, RE, FOCAL, FPS, DUR, PLANES, P, SEG, CAMK, OPEN, mono, fwd, slerpLL, centreAt, camAt, camMatrix, mul, spinFrames, clamp, easeInOut };
  if (typeof module !== 'undefined' && module.exports) module.exports = CAM;
  root.CAMERA = CAM;
})(typeof window !== 'undefined' ? window : globalThis);
