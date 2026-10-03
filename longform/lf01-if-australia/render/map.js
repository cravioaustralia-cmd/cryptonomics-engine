/* lf01 IF AUSTRALIA — map math (pure; runs in the browser and in Node).
 * World = Web Mercator, normalised x,y in [0,1), Pacific-centred: longitudes west of
 * 30°W are wrapped east (+360) so the seam sits in the Atlantic.
 * Camera = { x, y, z, cx?, cy? }: world point at screen (cx, cy) (default centre),
 * zoom z means the world is 512·2^z px wide.
 */
(function (G) {
  const W = 1920, H = 1080, TS = 512, LON_MIN = -30;
  const D2R = Math.PI / 180;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ease = {
    lin: (t) => t,
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    io2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    out5: (t) => 1 - Math.pow(1 - t, 5),
    in: (t) => t * t * t,
    in2: (t) => t * t,
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    fastIn: (t) => 1 - Math.pow(1 - t, 4), // "zoom fast into the pin"
  };

  function wrapLon(lon) {
    while (lon < LON_MIN) lon += 360;
    while (lon >= LON_MIN + 360) lon -= 360;
    return lon;
  }
  function w(lon, lat) {
    lon = wrapLon(lon);
    const s = Math.sin(clamp(lat, -85, 85) * D2R);
    return [(lon + 180) / 360, 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)];
  }
  function unw(x, y) {
    return [x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) / D2R];
  }
  function cam(lon, lat, z, extra) {
    const [x, y] = w(lon, lat);
    return Object.assign({ x, y, z }, extra || {});
  }
  function scale(c) { return TS * Math.pow(2, c.z); }
  function P(c, lon, lat) {
    const [x, y] = w(lon, lat);
    const k = scale(c);
    return [(x - c.x) * k + (c.cx ?? W / 2), (y - c.y) * k + (c.cy ?? H / 2)];
  }
  function pxPerKm(c, lat) { return scale(c) / (40075.017 * Math.cos(lat * D2R)); }
  function km(lon1, lat1, lon2, lat2) {
    const p1 = lat1 * D2R, p2 = lat2 * D2R, dp = p2 - p1, dl = (lon2 - lon1) * D2R;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 6371.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  /* point on a great circle, f in [0,1] */
  function gc(lon1, lat1, lon2, lat2, f) {
    const toV = (lo, la) => [Math.cos(la * D2R) * Math.cos(lo * D2R), Math.cos(la * D2R) * Math.sin(lo * D2R), Math.sin(la * D2R)];
    const a = toV(lon1, lat1), b = toV(lon2, lat2);
    const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
    const om = Math.acos(dot);
    if (om < 1e-9) return [lon1, lat1];
    const s1 = Math.sin((1 - f) * om) / Math.sin(om), s2 = Math.sin(f * om) / Math.sin(om);
    const v = [s1 * a[0] + s2 * b[0], s1 * a[1] + s2 * b[1], s1 * a[2] + s2 * b[2]];
    return [Math.atan2(v[1], v[0]) / D2R, Math.atan2(v[2], Math.hypot(v[0], v[1])) / D2R];
  }

  /* van Wijk & Nuij smooth zoom/pan (as in d3-interpolate). p = [x, y, viewWidthWorld] */
  function zoomInterp(p0, p1, rho = 1.35) {
    const rho2 = rho * rho, rho4 = rho2 * rho2;
    const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1;
    const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
    if (d2 < 1e-14) {
      const S = Math.log(w1 / w0) / rho;
      return (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
    }
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    const S = (r1 - r0) / rho;
    return (t) => {
      const s = t * S, c0 = Math.cosh(r0);
      const u = (w0 / (rho2 * d1)) * (c0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * c0) / Math.cosh(rho * s + r0)];
    };
  }

  /* Camera track: keys {t, lon, lat, z, ease, mode:'fly'|'glide'}; holds before/after. */
  function camTrack(keys) {
    keys = keys.slice().sort((a, b) => a.t - b.t);
    const segs = [];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      const A = cam(a.lon, a.lat, a.z), B = cam(b.lon, b.lat, b.z);
      // keep the shorter way round the wrap
      if (B.x - A.x > 0.5) B.x -= 1; else if (A.x - B.x > 0.5) B.x += 1;
      const wA = W / scale(A), wB = W / scale(B);
      const mode = b.mode || 'fly';
      const f = mode === 'fly' ? zoomInterp([A.x, A.y, wA], [B.x, B.y, wB], b.rho || 1.35) : null;
      segs.push({ a, b, A, B, f, mode, e: ease[b.ease || 'io'] });
    }
    return function (t) {
      if (!segs.length) { const k = keys[0]; return cam(k.lon, k.lat, k.z); }
      if (t <= segs[0].a.t) return { ...segs[0].A };
      for (const s of segs) {
        if (t <= s.b.t) {
          const u = s.e(clamp((t - s.a.t) / Math.max(1e-6, s.b.t - s.a.t), 0, 1));
          if (s.f) {
            const [x, y, vw] = s.f(u);
            return { x: ((x % 1) + 1) % 1, y, z: Math.log2(W / vw / TS) };
          }
          const x = lerp(s.A.x, s.B.x, u);
          return { x: ((x % 1) + 1) % 1, y: lerp(s.A.y, s.B.y, u), z: lerp(s.A.z, s.B.z, u) };
        }
      }
      return { ...segs[segs.length - 1].B, x: ((segs[segs.length - 1].B.x % 1) + 1) % 1 };
    };
  }

  /* scalar channel track: keys {t, v, ease} */
  function track(keys, def = 0) {
    keys = keys.slice().sort((a, b) => a.t - b.t);
    return function (t) {
      if (!keys.length) return def;
      if (t <= keys[0].t) return keys[0].v;
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i], b = keys[i + 1];
        if (t <= b.t) return lerp(a.v, b.v, ease[b.ease || 'io2'](clamp((t - a.t) / Math.max(1e-6, b.t - a.t), 0, 1)));
      }
      return keys[keys.length - 1].v;
    };
  }

  G.MAP = { W, H, TS, LON_MIN, clamp, lerp, sstep, ease, wrapLon, w, unw, cam, scale, P, pxPerKm, km, gc, zoomInterp, camTrack, track };
})(typeof window !== 'undefined' ? window : globalThis);
