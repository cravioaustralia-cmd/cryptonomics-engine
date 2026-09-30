/* s25-cliff-young — Skylab photo-underlay + premium SVG motion graphics.
 * SVG + renderFrame(t) + Playwright + ffmpeg (shared/render). No Remotion. Not map-explainer primary.
 * Every seam is keyed to Whisper word timings in ../transcript.json (held Atlas VO, 87.336 s).
 * On-screen text = names / places / key facts / prop text only (no VO-echo titles).
 * Cliff Young is shown as a gold race token / pictogram: no free-licence photo of him exists to use,
 * and we never fake a likeness.
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic } = HS;
  const DUR = 87.336;
  const CAP_Y = HS.CAPTION_Y; // 1344 — lower-middle band (~70%)

  // ---------- palette ----------
  const C = {
    ink: '#0b0a08',
    gold: '#f2c14e',
    goldHi: '#ffe39a',
    goldLo: '#9a6a1c',
    cream: '#fff5e3',
    paper: '#f3e9d2',
    teal: '#35c6c0',
    tealLo: '#11625f',
    blue: '#4aa3ff',
    red: '#e2463a',
    stamp: '#c8372d',
    boot: '#1f3b2a',
    bootHi: '#3f6b4c',
    night: '#0b1630',
    grass: '#6fae4a',
  };
  const F = {
    anton: "'Anton', 'Arial Black', sans-serif",
    mont: "'Montserrat', 'Arial Black', sans-serif",
    play: "'Playfair Display', Georgia, serif",
  };

  // ---------- assets (../images; licences in images/SOURCES.md) ----------
  const IMG = {
    boots: { u: '/img/s25_01_rubber_boots.jpg', w: 1536, h: 2048, fx: 0.62, fy: 0.62 },
    farm: { u: '/img/s25_02_apollo_bay_otways.jpg', w: 1600, h: 1200, fx: 0.5, fy: 0.45 },
    sheep: { u: '/img/s25_03_apollo_bay_sheep.jpg', w: 1632, h: 1224, fx: 0.48, fy: 0.6 },
    road: { u: '/img/s25_05_nsw_country_road.jpg', w: 2304, h: 1728, fx: 0.16, fy: 0.5 },
    crowd: { u: '/img/s25_06_australia_day_crowd.jpg', w: 1472, h: 1443, fx: 0.45, fy: 0.5 },
    sydney: { u: '/img/s25_07_sydney_harbour.jpg', w: 2400, h: 1585, fx: 0.5, fy: 0.5 },
    melb: { u: '/img/s25_08_melbourne_flinders_st.jpg', w: 1920, h: 1280, fx: 0.5, fy: 0.5 },
  };
  // night / dawn / shoes beats re-grade the road and boots stills (no extra photos)
  IMG.night = IMG.road;
  IMG.dawn = IMG.road;
  IMG.shoes = IMG.boots;
  const MAP = { u: '/ep/assets/basemap_se.jpg', w: 1200, h: 1120 };

  const FONT_CSS = `
    @font-face{font-family:'Anton';src:url(/ep/fonts/Anton-Regular.ttf) format('truetype');font-weight:400;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-800.ttf) format('truetype');font-weight:800;}
    @font-face{font-family:'Montserrat';src:url(/ep/fonts/Montserrat-900.ttf) format('truetype');font-weight:900;}
    @font-face{font-family:'Playfair Display';src:url(/ep/fonts/PlayfairDisplay-900.ttf) format('truetype');font-weight:900;}
    @font-face{font-family:'Playfair Display';src:url(/ep/fonts/PlayfairDisplay-700i.ttf) format('truetype');font-weight:700;font-style:italic;}`;
  const st = document.createElement('style');
  st.textContent = FONT_CSS;
  document.head.appendChild(st);
  const GRAIN = '/ep/assets/grain.png';
  window.EPISODE_READY = Promise.all([
    document.fonts.load("400 100px 'Anton'"),
    document.fonts.load("800 40px 'Montserrat'"),
    document.fonts.load("900 40px 'Montserrat'"),
    document.fonts.load("900 40px 'Playfair Display'"),
    document.fonts.load("italic 700 40px 'Playfair Display'"),
    ...[...Object.values(IMG).map((im) => im.u), MAP.u, GRAIN].map((u) => {
      const i = new Image();
      i.src = u;
      return i.decode().catch(() => {});
    }),
  ]);

  // ---------- utils ----------
  const cl01 = (v) => clamp(v, 0, 1);
  const prog = (t, a, d) => cl01((t - a) / d);
  const rand = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const easeInCubic = (x) => x * x * x;
  const fmt = (n) => (Math.round(n * 100) / 100).toString();
  const D2R = Math.PI / 180;
  const pulse = (t, a, d) => (t < a || t > a + d ? 0 : Math.sin((Math.PI * (t - a)) / d));
  const popS = (t, a, d = 0.35) => (t < a ? 0 : easeOutBack(prog(t, a, d)));

  /** Full-bleed photo with focal point, zoom and drift; always covers the frame. */
  function photo(key, o = {}) {
    const im = IMG[key];
    const dim = o.dim != null ? o.dim : 0.45;
    if (!im) {
      return `<rect width="${W}" height="${H}" fill="url(#fallbackG)"/><rect width="${W}" height="${H}" fill="#000" opacity="${dim}"/>`;
    }
    const zoom = o.zoom || 1;
    const s = Math.max(W / im.w, H / im.h) * zoom;
    const iw = im.w * s;
    const ih = im.h * s;
    const fx = o.fx != null ? o.fx : im.fx != null ? im.fx : 0.5;
    const fy = o.fy != null ? o.fy : im.fy != null ? im.fy : 0.5;
    const x = clamp(W / 2 - fx * iw + (o.dx || 0), W - iw, 0);
    const y = clamp(H / 2 - fy * ih + (o.dy || 0), H - ih, 0);
    const filt = o.grade ? ` filter="url(#${o.grade})"` : '';
    return `<image href="${im.u}" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(iw)}" height="${fmt(ih)}" preserveAspectRatio="none"${filt}/>
      <rect width="${W}" height="${H}" fill="${o.tint || '#000'}" opacity="${dim}"/>`;
  }

  // ---------- shared defs ----------
  function defs() {
    return `<defs>
      <filter id="gWarm" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.1 0.06 0 0 0.02  0.02 1.0 0 0 0.01  0 0 0.82 0 0  0 0 0 1 0"/></filter>
      <filter id="gPop" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="1.25"/><feComponentTransfer><feFuncR type="linear" slope="1.12" intercept="0.01"/><feFuncG type="linear" slope="1.1" intercept="0.01"/><feFuncB type="linear" slope="1.02" intercept="0"/></feComponentTransfer></filter>
      <filter id="gNight" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.22 0.2 0.08 0 0  0.18 0.3 0.12 0 0.01  0.2 0.35 0.45 0 0.06  0 0 0 1 0"/></filter>
      <filter id="gDawn" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.15 0.12 0 0 0.05  0.05 0.92 0.02 0 0.02  0 0.05 0.72 0 0.02  0 0 0 1 0"/></filter>
      <filter id="gSoftBW" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.5 0.5 0.12 0 0.03  0.36 0.62 0.12 0 0.02  0.3 0.52 0.2 0 0.02  0 0 0 1 0"/></filter>
      <filter id="bgBlur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="blurX" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation="46 0"/></filter>
      <filter id="speedBlur" x="-30%" y="-5%" width="160%" height="110%"><feGaussianBlur stdDeviation="14 0"/></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glowS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.6"/></filter>
      <filter id="shadowS" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.55"/></filter>
      <filter id="whiteGlow" x="-30%" y="-60%" width="160%" height="220%"><feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d"/><feGaussianBlur in="d" stdDeviation="4" result="b"/><feFlood flood-color="#fff" flood-opacity="0.95"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter>
      <linearGradient id="fallbackG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a2a"/><stop offset="1" stop-color="#0c100c"/></linearGradient>
      <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset="0.45" stop-color="${C.gold}"/><stop offset="1" stop-color="#b07a22"/></linearGradient>
      <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b07a2a" stop-opacity="0"/><stop offset="0.5" stop-color="${C.goldHi}"/><stop offset="1" stop-color="#b07a2a" stop-opacity="0"/></linearGradient>
      <linearGradient id="creamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1e2c2"/></linearGradient>
      <linearGradient id="tealG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ff0e6"/><stop offset="0.5" stop-color="${C.teal}"/><stop offset="1" stop-color="${C.tealLo}"/></linearGradient>
      <linearGradient id="bootG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#16291d"/><stop offset="0.35" stop-color="${C.bootHi}"/><stop offset="0.55" stop-color="${C.boot}"/><stop offset="1" stop-color="#0f1c13"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a14" stop-opacity="0.92"/><stop offset="1" stop-color="#0a0907" stop-opacity="0.9"/></linearGradient>
      <linearGradient id="nightGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101d3c" stop-opacity="0.92"/><stop offset="1" stop-color="#070d1e" stop-opacity="0.9"/></linearGradient>
      <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.72"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.78"/></linearGradient>
      <linearGradient id="roadG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3a38"/><stop offset="1" stop-color="#1b1a19"/></linearGradient>
      <linearGradient id="podG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf4e6"/><stop offset="1" stop-color="#cdbf9f"/></linearGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset="0.35" stop-color="${C.gold}"/><stop offset="0.7" stop-color="#a86e1f"/><stop offset="1" stop-color="#ffe29a"/></linearGradient>
      <linearGradient id="clockG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b5c"/><stop offset="1" stop-color="#b8231a"/></linearGradient>
      <linearGradient id="oceanTint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d4a6e" stop-opacity="0"/><stop offset="0.65" stop-color="#0d4a6e" stop-opacity="0.18"/><stop offset="1" stop-color="#1a7aa0" stop-opacity="0.32"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient>
      <radialGradient id="spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff2cf" stop-opacity="0.55"/><stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></radialGradient>
      <radialGradient id="spotW" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe7b0" stop-opacity="0.75"/><stop offset="0.6" stop-color="#ffd27a" stop-opacity="0.2"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="mapLight" cx="0.25" cy="0.15" r="0.9"><stop offset="0" stop-color="#fff6e0" stop-opacity="0.16"/><stop offset="0.6" stop-color="#fff6e0" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient>
      <radialGradient id="sunG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6d8"/><stop offset="0.35" stop-color="#ffd27a" stop-opacity="0.95"/><stop offset="0.7" stop-color="#e9853a" stop-opacity="0.35"/><stop offset="1" stop-color="#e9853a" stop-opacity="0"/></radialGradient>
      <radialGradient id="moonG" cx="0.4" cy="0.4" r="0.6"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#d6d2bd"/></radialGradient>
      <radialGradient id="beamG" cx="0" cy="0.5" r="1"><stop offset="0" stop-color="#fff3c2" stop-opacity="0.55"/><stop offset="1" stop-color="#fff3c2" stop-opacity="0"/></radialGradient>
      <pattern id="grainP" patternUnits="userSpaceOnUse" width="384" height="384"><image href="${GRAIN}" width="384" height="384"/></pattern>
    </defs>`;
  }

  // ======================================================================
  // DESIGN KIT — props & pictograms (hand-built)
  // ======================================================================

  /** Gumboot, side view, toe to the right; sole at y≈16, top rim at y≈-80. */
  function gumboot(o = {}) {
    const f = o.fill || 'url(#bootG)';
    return `<g>
      <path d="M-26,-74 L20,-74 L17,-18 C17,-12 22,-9 32,-7 C48,-4 58,1 58,10 L58,14 L-28,14 L-28,-6 C-28,-30 -27,-52 -26,-74 Z" fill="${f}" stroke="#08110b" stroke-width="3" stroke-linejoin="round"/>
      <rect x="-30" y="-84" width="54" height="14" rx="5" fill="#2b4d37" stroke="#08110b" stroke-width="3"/>
      <path d="M-14,-66 L-13,-14" stroke="#ffffff" stroke-opacity="0.22" stroke-width="7" stroke-linecap="round"/>
      <path d="M-30,12 L60,12 L60,20 C60,23 58,24 55,24 L-27,24 C-30,24 -31,22 -31,20 Z" fill="#0d0d0c"/>
      <path d="M-22,24 L-18,19 M-8,24 L-4,19 M6,24 L10,19 M20,24 L24,19 M34,24 L38,19 M48,24 L52,19" stroke="#3a3a36" stroke-width="3"/>
      <path d="M22,-4 C34,-3 46,1 52,7" stroke="#ffffff" stroke-opacity="0.18" stroke-width="4" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  function gumbootPair(x, y, s, o = {}) {
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})"${o.filter === false ? '' : ' filter="url(#shadow)"'}>
      <g transform="translate(-34 -2) scale(0.96)" opacity="0.92">${gumboot()}</g>
      <g transform="translate(26 6)">${gumboot()}</g>
    </g>`;
  }
  /** Running shoe, side view, toe to the right. */
  function runShoe(o = {}) {
    const a = o.color || '#2ec4b6';
    const b = o.color2 || '#ff8a3d';
    return `<g>
      <path d="M-56,-10 C-58,-26 -50,-38 -36,-40 L-18,-42 C-10,-30 4,-24 22,-22 C40,-20 56,-14 62,-2 L64,6 L-56,6 Z" fill="${a}" stroke="#062a28" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-40,-40 C-42,-50 -36,-56 -26,-56 L-16,-54 L-18,-42 Z" fill="${a}" stroke="#062a28" stroke-width="3"/>
      <path d="M-30,-14 C-10,-22 18,-22 40,-8" stroke="${b}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M-12,-36 L-4,-30 M-4,-40 L4,-33 M4,-43 L12,-35" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M-60,4 L66,4 C68,4 70,8 68,12 C66,16 60,18 54,18 L-54,18 C-60,18 -62,14 -62,10 Z" fill="#fbfbf7" stroke="#062a28" stroke-width="3"/>
      <path d="M-58,15 L66,15" stroke="#1d1d1d" stroke-width="5"/>
    </g>`;
  }
  /** Fluffy sheep, facing right. */
  function sheep(o = {}) {
    const wool = o.wool || '#f6f1e4';
    const puffs = [[-26, -8, 20], [-6, -16, 22], [16, -10, 20], [-18, 8, 18], [6, 6, 20], [24, 4, 15], [-34, 2, 14]];
    return `<g>
      <path d="M-20,16 L-20,34 M-6,18 L-6,36 M12,18 L12,36 M24,14 L24,32" stroke="#2a2420" stroke-width="7" stroke-linecap="round"/>
      ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${wool}" stroke="#cfc6b0" stroke-width="2"/>`).join('')}
      <ellipse cx="40" cy="-8" rx="15" ry="12" fill="#2a2420" transform="rotate(12 40 -8)"/>
      <ellipse cx="33" cy="-20" rx="9" ry="4.5" fill="#2a2420" transform="rotate(-30 33 -20)"/>
      <circle cx="44" cy="-11" r="3" fill="#fff"/><circle cx="45" cy="-11" r="1.6" fill="#000"/>
      <circle cx="30" cy="-22" r="10" fill="${wool}" stroke="#cfc6b0" stroke-width="2"/>
    </g>`;
  }
  /** Stroke pictogram figure (Olympic-style). ph = gait phase, amp = stride (0 = standing), lean in deg. */
  function figure(ph, o = {}) {
    const amp = o.amp != null ? o.amp : 1;
    const lean = (o.lean || 0) * D2R;
    const col = o.color || C.cream;
    const sw = o.sw || 11;
    const hip = [0, 0];
    const sh = [hip[0] + 40 * Math.sin(lean), hip[1] - 40 * Math.cos(lean)];
    const hd = [sh[0] + 17 * Math.sin(lean * 1.2), sh[1] - 17 * Math.cos(lean * 1.2)];
    const seg = (p, ang, len) => [p[0] + len * Math.sin(ang), p[1] + len * Math.cos(ang)];
    let limbs = '';
    let feet = '';
    for (const s of [0, Math.PI]) {
      const th = amp * 40 * D2R * Math.sin(ph + s) + (o.legBias || 0) * D2R;
      const flex = amp * 75 * D2R * (0.5 + 0.5 * Math.sin(ph + s - Math.PI / 2)) + (o.knee || 0) * D2R;
      const knee = seg(hip, th, 23);
      const foot = seg(knee, th - flex, 23);
      limbs += `<path d="M${fmt(hip[0])},${fmt(hip[1])} L${fmt(knee[0])},${fmt(knee[1])} L${fmt(foot[0])},${fmt(foot[1])}" />`;
      if (o.boots) {
        feet += `<g transform="translate(${fmt(foot[0])} ${fmt(foot[1])}) rotate(${fmt(((th - flex) / D2R) * -0.4)}) scale(0.2)">${gumboot()}</g>`;
      }
      const ua = o.arms === 'shoulders' ? (s ? 1 : -1) * 105 * D2R : -amp * 48 * D2R * Math.sin(ph + s) + (o.armBias || 0) * D2R;
      const el = seg(sh, ua, 17);
      const fa = o.arms === 'shoulders' ? ua + (s ? 1 : -1) * 60 * D2R : ua + (o.armBend != null ? o.armBend : 20 + 70 * amp) * D2R;
      const hand = seg(el, fa, 15);
      limbs += `<path d="M${fmt(sh[0])},${fmt(sh[1])} L${fmt(el[0])},${fmt(el[1])} L${fmt(hand[0])},${fmt(hand[1])}" />`;
    }
    return `<g stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none">
      ${limbs}
      <path d="M${fmt(hip[0])},${fmt(hip[1])} L${fmt(sh[0])},${fmt(sh[1])}" stroke-width="${sw + 3}"/>
      <circle cx="${fmt(hd[0])}" cy="${fmt(hd[1] - 2)}" r="${fmt(sw * 0.95)}" fill="${col}" stroke="none"/>
      ${o.cap ? `<path d="M${fmt(hd[0] - 11)},${fmt(hd[1] - 6)} Q${fmt(hd[0])},${fmt(hd[1] - 22)} ${fmt(hd[0] + 11)},${fmt(hd[1] - 6)} L${fmt(hd[0] + 22)},${fmt(hd[1] - 4)}" stroke="${o.capColor || C.gold}" stroke-width="6" fill="${o.capColor || C.gold}"/>` : ''}
    </g>${feet}`;
  }
  /** Figure placed with feet on ground y, scale s. */
  function figAt(x, y, s, ph, o = {}) {
    const flip = o.flip ? -1 : 1;
    return `<g transform="translate(${fmt(x)} ${fmt(y - 46 * s + (o.bob || 0))}) scale(${fmt(s * flip)} ${fmt(s)})" opacity="${fmt(o.a != null ? o.a : 1)}"${o.filter ? ` filter="url(#${o.filter})"` : ''}>${figure(ph, o)}</g>`;
  }

  // generic sponsor stickers (invented marks, no real brands)
  const LOGOS = [
    (c) => `<circle r="22" fill="${c}"/><path d="M-12,4 L0,-12 L12,4 L4,4 L4,12 L-4,12 L-4,4 Z" fill="#fff"/>`,
    (c) => `<rect x="-26" y="-16" width="52" height="32" rx="7" fill="${c}"/><path d="M-16,8 L-4,-8 L4,2 L16,-10" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    (c) => `<path d="M0,-24 L6,-7 L24,-7 L10,4 L15,22 L0,11 L-15,22 L-10,4 L-24,-7 L-6,-7 Z" fill="${c}" stroke="#fff" stroke-width="3"/>`,
    (c) => `<circle r="21" fill="#fff"/><circle r="15" fill="${c}"/><path d="M-9,0 A9,9 0 0 1 9,0" stroke="#fff" stroke-width="4" fill="none"/>`,
    (c) => `<path d="M-24,12 L0,-20 L24,12 Z" fill="${c}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M-8,12 L2,-2 L10,12" fill="#fff"/>`,
    (c) => `<rect x="-22" y="-22" width="44" height="44" rx="10" fill="${c}" transform="rotate(45)"/><path d="M-6,-12 L6,-2 L-4,2 L6,12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    (c) => `<ellipse rx="28" ry="16" fill="${c}"/><path d="M-18,4 C-8,-10 8,-10 18,4" stroke="#fff" stroke-width="4" fill="none"/><circle cx="0" cy="-2" r="4" fill="#fff"/>`,
    (c) => `<path d="M-6,-24 L10,-24 L2,-4 L14,-4 L-8,24 L-2,2 L-14,2 Z" fill="${c}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`,
  ];
  const LOGO_COL = ['#e2463a', '#2f7df6', '#ffb000', '#8a4dff', '#12b886', '#ff5fa2', '#00a3c4', '#f76707'];
  function sticker(i, x, y, s, rot, p) {
    if (p <= 0) return '';
    const e = p < 1 ? lerp(2.2, 1, easeOutCubic(cl01(p))) : 1;
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rot)}) scale(${fmt(s * e)})" opacity="${fmt(cl01(p * 4))}" filter="url(#shadowS)">
      <g stroke="#fff" stroke-width="0">${LOGOS[i % LOGOS.length](LOGO_COL[i % LOGO_COL.length])}</g></g>`;
  }
  function sheepSticker(x, y, s, rot, p) {
    if (p <= 0) return '';
    const e = p < 1 ? lerp(2.4, 1, easeOutCubic(cl01(p))) : 1;
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rot)}) scale(${fmt(s * e)})" opacity="${fmt(cl01(p * 4))}" filter="url(#shadowS)">
      <circle r="44" fill="#fff"/><circle r="39" fill="#bfe3a3"/>
      <g transform="translate(-4 -2) scale(0.62)">${sheep()}</g></g>`;
  }

  /** Race token: pro (teal, runner) or cliff (gold, gumboot). */
  function token(x, y, r, kind, o = {}) {
    const a = o.a != null ? o.a : 1;
    if (a <= 0) return '';
    const cliff = kind === 'cliff';
    const ring = cliff ? 'url(#ringG)' : 'url(#tealG)';
    const face = cliff ? '#2a1d08' : '#0b2322';
    const icon = cliff
      ? `<g transform="translate(-4 ${fmt(r * 0.1)}) scale(${fmt(r / 95)})">${gumboot()}</g>`
      : `<g transform="translate(${fmt(-r * 0.05)} ${fmt(r * 0.34)}) scale(${fmt(r / 92)})">${figure(o.ph || 0.8, { amp: 1, lean: 14, color: '#e9fffd', sw: 10 })}</g>`;
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(o.s != null ? o.s : 1)})" opacity="${fmt(a)}">
      <circle r="${fmt(r * 1.25)}" fill="url(#spot)" opacity="${cliff ? 0.55 : 0.25}"/>
      <circle r="${r}" fill="${face}" stroke="${ring}" stroke-width="${fmt(r * 0.13)}" filter="url(#shadow)"/>
      <circle r="${fmt(r * 0.8)}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="2"/>
      ${icon}
      ${o.extra || ''}
    </g>`;
  }
  /** Small map marker (pin head disc). */
  function marker(x, y, kind, s = 1, o = {}) {
    const cliff = kind === 'cliff';
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})" opacity="${fmt(o.a != null ? o.a : 1)}">
      <ellipse cx="0" cy="3" rx="16" ry="6" fill="#000" opacity="0.4"/>
      <circle r="${cliff ? 20 : 15}" fill="${cliff ? C.gold : C.teal}" stroke="#fff" stroke-width="4" filter="url(#shadowS)"/>
      ${cliff ? `<g transform="translate(-1 3) scale(0.2)">${gumboot()}</g>` : `<circle r="5" fill="#073634"/>`}
    </g>`;
  }

  function chip(label, x, y, p, o = {}) {
    if (p <= 0) return '';
    const e = easeOutBack(cl01(p));
    const fs = o.fs || 32;
    const w = o.w || label.length * (fs * 0.7 + 3) + 70;
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(e * (o.scale || 1))})" opacity="${fmt(cl01(p * 3) * (o.a != null ? o.a : 1))}" filter="url(#shadow)">
      <rect x="${-w / 2}" y="-38" width="${w}" height="76" rx="38" fill="url(#${o.night ? 'nightGlass' : 'glass'})" stroke="${o.accent || C.gold}" stroke-width="3"/>
      <text x="0" y="${fmt(fs * 0.36)}" text-anchor="middle" font-family="${o.italic ? F.play : F.mont}" font-weight="${o.italic ? 700 : 900}" ${o.italic ? 'font-style="italic"' : ''} font-size="${fs}"
        fill="${o.color || C.cream}" letter-spacing="${o.italic ? 1 : 3}">${esc(label)}</text>
    </g>`;
  }
  /** Big 3D-extruded Anton type. */
  function slabText(txt, x, y, size, o = {}) {
    const depth = o.depth || 10;
    let ext = '';
    for (let d = depth; d > 0; d--) {
      ext += `<text x="${x + d * 0.9}" y="${y + d * 1.1}" text-anchor="${o.anchor || 'middle'}" font-family="${F.anton}" font-size="${size}" fill="${o.ext || '#3b2508'}" letter-spacing="${o.ls || 0}">${esc(txt)}</text>`;
    }
    return `<g>${ext}<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${F.anton}" font-size="${size}" fill="${o.fill || 'url(#goldG)'}" stroke="${o.stroke || '#1a0f02'}" stroke-width="${o.sw || 3}" paint-order="stroke" letter-spacing="${o.ls || 0}">${esc(txt)}</text></g>`;
  }
  function tag(txt, x, y, a, col, o = {}) {
    if (a <= 0) return '';
    return `<text x="${fmt(x)}" y="${fmt(y)}" text-anchor="${o.anchor || 'middle'}" font-family="${F.mont}" font-weight="900" font-size="${o.fs || 30}" letter-spacing="${o.ls != null ? o.ls : 3}"
      fill="${col || C.cream}" stroke="#000" stroke-width="${o.sw || 8}" paint-order="stroke" opacity="${fmt(a)}">${esc(txt)}</text>`;
  }
  function shock(cx, cy, p, o = {}) {
    if (p <= 0 || p >= 1) return '';
    const e = easeOutCubic(p);
    return `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt((o.r || 400) * e)}" fill="none" stroke="${o.color || '#fff'}" stroke-width="${fmt((o.w || 14) * (1 - p))}" opacity="${fmt(1 - p)}"/>`;
  }
  function burst(cx, cy, p, n, o = {}) {
    if (p <= 0 || p >= 1) return '';
    let s = '';
    const e = easeOutCubic(p);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rand(i + (o.seed || 0)) * 0.4;
      const d = (o.r || 220) * e * (0.6 + 0.4 * rand(i * 2 + (o.seed || 0)));
      const x = cx + Math.cos(ang) * d * (o.sx || 1);
      const y = cy + Math.sin(ang) * d * (o.sy || 1) + (o.grav || 0) * p * p;
      s += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt((o.size || 6) * (1 - p) + 1)}" fill="${o.color || C.goldHi}" opacity="${fmt(1 - p)}"/>`;
    }
    return s;
  }
  function dust(t, n, seed, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const r1 = rand(i + seed);
      const r2 = rand(i * 3.7 + seed);
      const r3 = rand(i * 7.1 + seed);
      const sp = o.speed || 30;
      const x = (((r1 * W + Math.sin(t * 0.6 + i) * 20 + (o.dx || 0) * t) % W) + W) % W;
      const y = (((r2 * H - t * sp * (0.5 + r3)) % H) + H) % H;
      s += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(1.5 + r3 * (o.size || 3))}" fill="${o.color || C.goldHi}" opacity="${fmt((o.alpha || 0.5) * (0.4 + 0.6 * r2))}"/>`;
    }
    return s;
  }
  /** Confetti: paper strips with flutter + gravity. p 0..1 over ~2 s. */
  function confetti(cx, cy, p, n, o = {}) {
    if (p <= 0 || p >= 1) return '';
    const cols = ['#ffd23f', '#ff4d6d', '#3ec9ff', '#7cff6b', '#ffffff', '#b37bff', '#ff9f1c'];
    let s = '';
    for (let i = 0; i < n; i++) {
      const r1 = rand(i * 1.7 + (o.seed || 0));
      const r2 = rand(i * 3.1 + 7);
      const r3 = rand(i * 5.3 + 3);
      const ang = -Math.PI / 2 + (r1 - 0.5) * (o.spread || 2.6);
      const v = (o.v || 1300) * (0.45 + 0.75 * r2);
      const tt = p * (o.T || 2.2);
      const drag = (1 - Math.exp(-2.2 * tt)) / 2.2;
      const x = cx + Math.cos(ang) * v * drag + Math.sin(tt * 6 + i) * 18;
      const y = cy + Math.sin(ang) * v * drag + 420 * tt * tt * 0.5;
      const rot = tt * 600 * (r3 - 0.5) + i * 37;
      const sx = Math.cos(tt * 9 + i);
      s += `<rect x="-9" y="-5" width="18" height="10" rx="2" fill="${cols[i % cols.length]}" transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(rot)}) scale(${fmt(sx)} 1)" opacity="${fmt(cl01((1 - p) * 3))}"/>`;
    }
    return s;
  }
  /** Floating Z glyphs (sleep gag). */
  function zzz(x, y, t, a, s = 1) {
    if (a <= 0) return '';
    let out = '';
    for (let k = 0; k < 3; k++) {
      const ph = (t * 0.55 + k / 3) % 1;
      const zx = x + ph * 60 * s + Math.sin((t + k) * 3) * 8;
      const zy = y - ph * 150 * s;
      const zs = (26 + ph * 26) * s;
      out += `<text x="${fmt(zx)}" y="${fmt(zy)}" font-family="${F.anton}" font-size="${fmt(zs)}" fill="#dfe9ff" stroke="#0b1630" stroke-width="5" paint-order="stroke" opacity="${fmt(a * Math.sin(Math.PI * ph))}">Z</text>`;
    }
    return out;
  }
  /** Tent (sleeping pros). */
  function tent(x, y, s, glowA) {
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})" filter="url(#shadowS)">
      <path d="M-70,0 L0,-86 L70,0 Z" fill="#1d5f7a" stroke="#0a2230" stroke-width="4" stroke-linejoin="round"/>
      <path d="M0,-86 L-18,0 L18,0 Z" fill="#0c2d3c"/>
      <path d="M-70,0 L0,-86" stroke="#6fd3f5" stroke-opacity="0.45" stroke-width="4"/>
      <ellipse cx="0" cy="-10" rx="${fmt(10 + glowA * 6)}" ry="${fmt(6 + glowA * 3)}" fill="#ffd27a" opacity="${fmt(0.25 * glowA)}"/>
    </g>`;
  }
  /** Analogue clock dial (becomes the guilty cartoon alarm at p.face > 0). */
  function alarmClock(x, y, r, o = {}) {
    const face = o.face || 0; // 0..1 cartoon-ness (bells, legs, eyes)
    const hr = o.hour != null ? o.hour : 10;
    const mn = o.min != null ? o.min : 0;
    const wob = o.wob || 0;
    const sleepArc = o.arc || 0; // 0..1 of the 2-hour wedge
    const ang = (h) => (h / 12) * Math.PI * 2 - Math.PI / 2;
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r1 = r * 0.8;
      const r2 = i % 3 === 0 ? r * 0.66 : r * 0.72;
      ticks += `<line x1="${fmt(Math.cos(a) * r1)}" y1="${fmt(Math.sin(a) * r1)}" x2="${fmt(Math.cos(a) * r2)}" y2="${fmt(Math.sin(a) * r2)}" stroke="#2a2a2a" stroke-width="${i % 3 === 0 ? 8 : 4}" stroke-linecap="round" opacity="${fmt(1 - face * 0.6)}"/>`;
    }
    const a0 = ang(o.arcFrom != null ? o.arcFrom : 12);
    const a1 = a0 + (Math.PI * 2 * (2 / 12)) * sleepArc;
    const wedge = sleepArc > 0
      ? `<path d="M0,0 L${fmt(Math.cos(a0) * r * 0.62)},${fmt(Math.sin(a0) * r * 0.62)} A${r * 0.62},${r * 0.62} 0 0 1 ${fmt(Math.cos(a1) * r * 0.62)},${fmt(Math.sin(a1) * r * 0.62)} Z" fill="#6c8cff" opacity="0.55"/>`
      : '';
    const ha = ang(hr + mn / 60);
    const ma = ((mn / 60) * Math.PI * 2) - Math.PI / 2;
    const hands = `<g opacity="${fmt(1 - face * 0.85)}">
      <line x1="0" y1="0" x2="${fmt(Math.cos(ha) * r * 0.42)}" y2="${fmt(Math.sin(ha) * r * 0.42)}" stroke="#1b1b1b" stroke-width="12" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="${fmt(Math.cos(ma) * r * 0.6)}" y2="${fmt(Math.sin(ma) * r * 0.6)}" stroke="#1b1b1b" stroke-width="7" stroke-linecap="round"/>
      <circle r="10" fill="${C.red}"/></g>`;
    const bells = face > 0
      ? `<g opacity="${fmt(cl01(face * 2))}">
          <g transform="rotate(${fmt(-32 + wob * 8)}) translate(0 ${-r - 18})"><path d="M-44,20 A44,40 0 0 1 44,20 Z" fill="url(#clockG)" stroke="#5a0f0a" stroke-width="5"/><circle cy="-44" r="9" fill="#5a0f0a"/></g>
          <g transform="rotate(${fmt(32 - wob * 8)}) translate(0 ${-r - 18})"><path d="M-44,20 A44,40 0 0 1 44,20 Z" fill="url(#clockG)" stroke="#5a0f0a" stroke-width="5"/><circle cy="-44" r="9" fill="#5a0f0a"/></g>
          <path d="M0,${-r - 8} L${fmt(wob * 26)},${-r - 44}" stroke="#5a0f0a" stroke-width="9" stroke-linecap="round"/>
          <path d="M${fmt(-r * 0.62)},${fmt(r * 0.72)} L${fmt(-r * 0.86)},${fmt(r * 1.08)} M${fmt(r * 0.62)},${fmt(r * 0.72)} L${fmt(r * 0.86)},${fmt(r * 1.08)}" stroke="#5a0f0a" stroke-width="16" stroke-linecap="round"/>
        </g>`
      : '';
    // guilty face: eyes glance down-left, brows tilted up at the middle, wobbly mouth, sweat drop, blush
    const eyes = face > 0
      ? `<g opacity="${fmt(cl01(face * 1.5))}">
          <ellipse cx="${-r * 0.3}" cy="${-r * 0.1}" rx="${r * 0.17}" ry="${r * 0.22}" fill="#fff" stroke="#1b1b1b" stroke-width="5"/>
          <ellipse cx="${r * 0.3}" cy="${-r * 0.1}" rx="${r * 0.17}" ry="${r * 0.22}" fill="#fff" stroke="#1b1b1b" stroke-width="5"/>
          <circle cx="${fmt(-r * 0.37 + (o.look || 0) * 6)}" cy="${fmt(-r * 0.02)}" r="${r * 0.08}" fill="#1b1b1b"/>
          <circle cx="${fmt(r * 0.23 + (o.look || 0) * 6)}" cy="${fmt(-r * 0.02)}" r="${r * 0.08}" fill="#1b1b1b"/>
          <path d="M${-r * 0.5},${-r * 0.34} L${-r * 0.16},${-r * 0.44}" stroke="#1b1b1b" stroke-width="8" stroke-linecap="round"/>
          <path d="M${r * 0.5},${-r * 0.34} L${r * 0.16},${-r * 0.44}" stroke="#1b1b1b" stroke-width="8" stroke-linecap="round"/>
          <path d="M${-r * 0.24},${r * 0.34} q${r * 0.08},${-r * 0.08} ${r * 0.16},0 t${r * 0.16},0 t${r * 0.16},0" stroke="#1b1b1b" stroke-width="7" fill="none" stroke-linecap="round"/>
          <ellipse cx="${-r * 0.55}" cy="${r * 0.2}" rx="${r * 0.12}" ry="${r * 0.06}" fill="#ff7a8a" opacity="0.7"/>
          <ellipse cx="${r * 0.55}" cy="${r * 0.2}" rx="${r * 0.12}" ry="${r * 0.06}" fill="#ff7a8a" opacity="0.7"/>
          <path transform="translate(${r * 0.62} ${fmt(-r * 0.46 + (o.sweat || 0) * 30)})" d="M0,-16 C8,-4 12,2 12,8 C12,15 6,20 0,20 C-6,20 -12,15 -12,8 C-12,2 -8,-4 0,-16 Z" fill="#8fd8ff" stroke="#1b5f8a" stroke-width="3" opacity="${fmt(cl01(face * 2 - 0.5))}"/>
        </g>`
      : '';
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(wob * 7)}) scale(${fmt(o.s || 1)})" filter="url(#shadow)">
      ${bells}
      <circle r="${r + 16}" fill="url(#clockG)" stroke="#5a0f0a" stroke-width="6"/>
      <circle r="${r}" fill="#fff9ec" stroke="#5a0f0a" stroke-width="4"/>
      ${wedge}${ticks}${hands}${eyes}
      <path d="M${-r * 0.7},${-r * 0.55} A${r * 0.9},${r * 0.9} 0 0 1 ${-r * 0.1},${-r * 0.88}" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.55"/>
    </g>`;
  }

  // ======================================================================
  // ROUTE MAP (NASA Blue Marble, public domain; see images/SOURCES.md)
  // asset px coordinates in render/assets/basemap_se.jpg (1200×1120)
  // ======================================================================
  const CITY = { syd: [912, 390], mel: [330, 792] };
  // approximate race corridor (Hume Highway line: Goulburn · Yass · Gundagai · Albury · Wangaratta · Seymour)
  const ROUTE = [[912, 390], [850, 418], [784, 470], [706, 494], [640, 526], [590, 578], [540, 632], [484, 668], [430, 702], [376, 744], [330, 792]];
  const RLEN = (() => {
    const acc = [0];
    for (let i = 1; i < ROUTE.length; i++) acc.push(acc[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]));
    return acc;
  })();
  function routeAt(f) {
    const L = RLEN[RLEN.length - 1] * cl01(f);
    let i = 1;
    while (i < RLEN.length - 1 && RLEN[i] < L) i++;
    const u = (L - RLEN[i - 1]) / (RLEN[i] - RLEN[i - 1] || 1);
    return [lerp(ROUTE[i - 1][0], ROUTE[i][0], u), lerp(ROUTE[i - 1][1], ROUTE[i][1], u)];
  }
  /** View: map card showing asset centre (cx,cy) at zoom z inside card rect. Returns {svg, P(ax,ay)}. */
  function mapView(v) {
    const card = v.card || { x: 60, y: 300, w: 960, h: 900 };
    const k = (card.w / 900) * (v.z || 1);
    const ox = card.x + card.w / 2 - v.cx * k;
    const oy = card.y + card.h / 2 - v.cy * k;
    const P = (ax, ay) => [ox + ax * k, oy + ay * k];
    const id = 'mc' + (v.id || 0);
    const a = v.a != null ? v.a : 1;
    const svg = `<g opacity="${fmt(a)}">
      <rect x="${card.x - 10}" y="${card.y - 10}" width="${card.w + 20}" height="${card.h + 20}" rx="34" fill="#0a0907" opacity="0.6" filter="url(#shadow)"/>
      <clipPath id="${id}"><rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="26"/></clipPath>
      <g clip-path="url(#${id})">
        <image href="${MAP.u}" x="${fmt(ox)}" y="${fmt(oy)}" width="${fmt(MAP.w * k)}" height="${fmt(MAP.h * k)}" preserveAspectRatio="none" filter="${v.night ? 'url(#gNight)' : 'url(#gPop)'}"/>
        <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" fill="url(#oceanTint)"/>
        <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" fill="url(#mapLight)"/>
        ${v.night ? `<rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" fill="#050b1f" opacity="0.35"/>` : ''}
        ${v.inner ? v.inner(P, k) : ''}
      </g>
      <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="26" fill="none" stroke="url(#ringG)" stroke-width="5"/>
    </g>`;
    return { svg, P, k };
  }
  function routePath(P, f, o = {}) {
    if (f <= 0) return '';
    const pts = ROUTE.map(([x, y]) => P(x, y));
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${fmt(x)},${fmt(y)}`).join(' ');
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const off = L * (1 - cl01(f));
    return `<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="${o.w ? o.w + 10 : 20}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${fmt(L)}" stroke-dashoffset="${fmt(off)}"/>
      <path d="${d}" fill="none" stroke="${o.color || C.goldHi}" stroke-width="${o.w || 10}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${fmt(L)}" stroke-dashoffset="${fmt(off)}" filter="url(#glowS)"/>`;
  }
  function cityPin(x, y, label, p, o = {}) {
    if (p <= 0) return '';
    const dy = lerp(-200, 0, easeOutElastic(cl01(p * 1.1)));
    const lx = o.lx || 0;
    const ly = o.ly || -110;
    return `<g opacity="${fmt(cl01(p * 4))}">
      <g transform="translate(${fmt(x)} ${fmt(y + dy)})">
        <ellipse cx="0" cy="4" rx="${fmt(20 * cl01(p * 2))}" ry="7" fill="#000" opacity="0.45"/>
        <path d="M0,0 C-7,-14 -28,-34 -28,-56 C-28,-74 -14,-86 0,-86 C14,-86 28,-74 28,-56 C28,-34 7,-14 0,0 Z" fill="${o.fill || C.gold}" stroke="#5a3a0a" stroke-width="3"/>
        <circle cx="0" cy="-56" r="11" fill="${C.ink}"/>
      </g>
      <g transform="translate(${fmt(x + lx)} ${fmt(y + ly)}) scale(${fmt(easeOutBack(cl01(p * 1.4)))})" filter="url(#whiteGlow)">
        ${slabText(label, 0, 0, o.fs || 58, { depth: 5, fill: '#1b1307', ext: '#8a6a3a', stroke: '#1b1307', sw: 0, ls: 3, anchor: o.anchor || 'middle' })}
      </g>
    </g>`;
  }

  // ======================================================================
  // SCENES — every time below is a Whisper word time from transcript.json
  // ======================================================================

  /** Frame-1 hook card: 61 · GUMBOOTS (never spoken). */
  function hookCard(s, a, shimmer, y0 = 520) {
    if (a <= 0) return '';
    const sh = shimmer || 0;
    return `<g opacity="${fmt(a)}" transform="translate(540 ${y0}) scale(${fmt(s)}) translate(-540 ${-y0})">
      <rect x="0" y="${y0 - 420}" width="${W}" height="900" fill="url(#topShade)"/>
      ${slabText('61', 540, y0 + 40, 380, { depth: 16, ls: 4 })}
      <circle cx="540" cy="${y0 + 110}" r="16" fill="${C.goldHi}" filter="url(#glowS)"/>
      <rect x="250" y="${y0 + 106}" width="240" height="7" rx="3" fill="url(#goldH)"/>
      <rect x="590" y="${y0 + 106}" width="240" height="7" rx="3" fill="url(#goldH)"/>
      ${slabText('GUMBOOTS', 540, y0 + 310, 190, { depth: 11, ls: 8, fill: 'url(#creamG)', ext: '#161616' })}
      <rect x="${fmt(140 + sh * 800)}" y="${y0 - 280}" width="70" height="610" fill="#fff" opacity="${fmt(0.26 * Math.sin(Math.PI * sh))}" transform="skewX(-18)"/>
    </g>`;
  }

  // S1 0.00–8.60 · hook slam → 1983 → toughest-race gauge → overalls + gumboots
  function sHook(t, l) {
    const settle = 1.06 - 0.06 * easeOutCubic(prog(l, 0, 0.45));
    const up = easeInOutCubic(prog(t, 2.72, 0.5)); // hook card moves up out of the way on "potato farmer"
    const hs = lerp(settle, 0.42, up);
    const hy = lerp(0, -330, up);
    const gauge = prog(t, 4.6, 0.25);
    const needle = lerp(-120, 118, easeOutElastic(prog(t, 4.82, 0.9))) + (t > 5.4 ? Math.sin(t * 40) * 2 : 0);
    const gOut = easeInCubic(prog(t, 6.0, 0.35));
    const over = prog(t, 6.18, 0.5);
    const boots = prog(t, 7.78, 0.45);
    const bootY = lerp(-700, 0, easeOutCubic(boots));
    const potato = popS(t, 2.8, 0.4);
    return (
      photo('boots', { zoom: 1.02 + l * 0.01, dim: 0.3 + 0.28 * up, grade: 'gWarm' }) +
      `<rect width="${W}" height="${H}" fill="url(#spot)" opacity="0.28" transform="translate(0 -260)"/>` +
      dust(l, 34, 3, { speed: 18, alpha: 0.4 }) +
      shock(540, 560, prog(l, 0.0, 0.7), { r: 720, color: C.goldHi, w: 18 }) +
      `<g transform="translate(0 ${fmt(hy)})">${hookCard(hs, 1, prog(t, 1.96, 0.7))}</g>` +
      chip('1983', 540, 1150, prog(t, 0.26, 0.3) * (1 - prog(t, 2.6, 0.25)), { fs: 44 }) +
      // potato sticker (potato farmer)
      (potato > 0
        ? `<g transform="translate(830 ${fmt(250 + 0)}) rotate(${fmt(12 + Math.sin(t * 3) * 3)}) scale(${fmt(potato * (1 - gOut * 0))})" filter="url(#shadow)">
            <ellipse rx="86" ry="62" fill="#fff"/><ellipse rx="76" ry="52" fill="#c89b5a"/>
            <ellipse cx="-20" cy="-16" rx="30" ry="14" fill="#e0b979" opacity="0.7"/>
            ${[[-34, 6], [10, -20], [30, 16], [-6, 24], [44, -8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="#8a6230"/>`).join('')}
          </g>`
        : '') +
      // toughest-race gauge
      (gauge > 0
        ? `<g transform="translate(540 820) scale(${fmt(easeOutBack(gauge) * (1 - gOut))})" opacity="${fmt(1 - gOut)}" filter="url(#shadow)">
            <path d="M-230,0 A230,230 0 0 1 230,0" fill="none" stroke="#1a1a1a" stroke-width="58" stroke-linecap="round" opacity="0.8"/>
            <path d="M-230,0 A230,230 0 0 1 -115,-199" fill="none" stroke="#3ecf72" stroke-width="42" stroke-linecap="round"/>
            <path d="M-100,-207 A230,230 0 0 1 100,-207" fill="none" stroke="#ffb020" stroke-width="42"/>
            <path d="M115,-199 A230,230 0 0 1 230,0" fill="none" stroke="${C.red}" stroke-width="42" stroke-linecap="round"/>
            <g transform="rotate(${fmt(needle * 0.75)})"><path d="M-12,0 L0,-210 L12,0 Z" fill="${C.cream}" stroke="#111" stroke-width="3"/></g>
            <circle r="26" fill="${C.gold}" stroke="#111" stroke-width="4"/>
          </g>`
        : '') +
      // outfit: overalls then gumboots drop in
      (over > 0
        ? `<g transform="translate(540 ${fmt(830 + (1 - easeOutBack(over)) * 60)}) scale(${fmt(easeOutBack(over))})" opacity="${fmt(cl01(over * 3))}" filter="url(#shadow)">
            <path d="M-120,-230 L-80,-230 L-80,-150 L80,-150 L80,-230 L120,-230 L120,-120 L140,40 L150,210 L30,210 L0,40 L-30,210 L-150,210 L-140,40 L-120,-120 Z" fill="#3b5f8a" stroke="#142438" stroke-width="6" stroke-linejoin="round"/>
            <rect x="-70" y="-120" width="140" height="90" rx="8" fill="#4a73a3" stroke="#142438" stroke-width="5"/>
            <circle cx="-86" cy="-150" r="11" fill="${C.gold}"/><circle cx="86" cy="-150" r="11" fill="${C.gold}"/>
            <path d="M-130,40 L-10,40 M10,40 L130,40" stroke="#284566" stroke-width="5" stroke-dasharray="10 8"/>
          </g>`
        : '') +
      (boots > 0 ? gumbootPair(560, 1150 + bootY, 2.2) : '') +
      burst(560, 1190, prog(t, 8.05, 0.8), 26, { r: 260, color: '#d9c4a0', size: 9, sy: 0.35, seed: 5 }) +
      shock(560, 1170, prog(t, 8.02, 0.6), { r: 420, color: C.goldHi, w: 14 })
    );
  }

  // S2 8.60–13.20 · CLIFF YOUNG nameplate + age line (late fifties → 61)
  function sName(t, l) {
    const med = popS(t, 8.9, 0.5);
    const name = prog(t, 9.52, 0.4);
    const line = prog(t, 10.6, 0.6);
    const run = prog(t, 12.02, 0.9);
    const X0 = 150;
    const X1 = 930;
    const ax = (age) => lerp(X0, X1, age / 61);
    const LY = 1110;
    const jog = ax(lerp(56.5, 61, easeInOutCubic(run)));
    let ticks = '';
    for (let a = 0; a <= 60; a += 10) ticks += `<line x1="${fmt(ax(a))}" y1="${LY - 14}" x2="${fmt(ax(a))}" y2="${LY + 14}" stroke="${C.cream}" stroke-width="4" opacity="0.7"/>`;
    return (
      photo('farm', { zoom: 1.04 + l * 0.012, dim: 0.42, grade: 'gWarm' }) +
      token(540, 540, 170 * (med > 0 ? 1 : 0), 'cliff', { s: med, extra: '' }) +
      shock(540, 540, prog(t, 8.95, 0.7), { r: 380, color: C.goldHi }) +
      (name > 0
        ? `<g transform="translate(540 850) scale(${fmt(lerp(1.35, 1, easeOutCubic(name)))})" opacity="${fmt(cl01(name * 3))}">
            ${slabText('CLIFF YOUNG', 0, 0, 148, { depth: 10, ls: 6 })}
            <rect x="${fmt(-380 + prog(t, 9.8, 0.8) * 760)}" y="-130" width="60" height="150" fill="#fff" opacity="${fmt(0.3 * Math.sin(Math.PI * prog(t, 9.8, 0.8)))}" transform="skewX(-18)"/>
          </g>`
        : '') +
      (line > 0
        ? `<g opacity="${fmt(cl01(line * 2))}">
            <line x1="${X0}" y1="${LY}" x2="${fmt(lerp(X0, X1, easeOutCubic(line)))}" y2="${LY}" stroke="${C.cream}" stroke-width="8" stroke-linecap="round" opacity="0.85"/>
            ${ticks}
            <line x1="${fmt(ax(56.5))}" y1="${LY}" x2="${fmt(jog)}" y2="${LY}" stroke="${C.gold}" stroke-width="16" stroke-linecap="round" opacity="${fmt(cl01(run * 4))}" filter="url(#glowS)"/>
            ${tag('0', X0, LY + 62, 1, C.cream, { fs: 30 })}
            ${chip('~61', X1 - 10, LY - 80, prog(t, 12.4, 0.35), { fs: 30, w: 150 })}
            ${run > 0 ? figAt(jog, LY - 12, 1.25, t * 12, { amp: 0.55, lean: 8, color: C.goldHi, filter: 'shadowS' }) : ''}
          </g>`
        : '')
    );
  }

  // S3 13.20–21.40 · route map: SYDNEY → MELBOURNE, on foot, 875 KM, pros at the start
  function sRoute(t, l) {
    const fly = easeOutCubic(prog(t, 13.3, 0.6));
    const z = lerp(0.95, 1.12, easeInOutCubic(prog(t, 13.3, 7.8)));
    const cx = lerp(640, 600, prog(t, 13.3, 7.8));
    const draw = easeInOutCubic(prog(t, 14.55, 1.2));
    const km = prog(t, 17.06, 0.75);
    const pros = prog(t, 18.9, 0.6);
    const v = mapView({
      cx, cy: 590, z, id: 3, a: cl01(fly * 2),
      card: { x: 60, y: lerp(420, 250, fly), w: 960, h: 900 },
      inner: (P) => {
        let s = routePath(P, draw);
        // footprints along the route (on foot)
        const fp = prog(t, 15.6, 1.4);
        for (let i = 0; i < 18; i++) {
          const f = (i + 0.5) / 18;
          if (f > fp) break;
          const [ax, ay] = routeAt(f);
          const [px, py] = P(ax, ay);
          const side = i % 2 ? 1 : -1;
          s += `<ellipse cx="${fmt(px + side * 9)}" cy="${fmt(py + side * 9)}" rx="6" ry="9" fill="#fff" stroke="#000" stroke-opacity="0.4" stroke-width="2" opacity="0.95" transform="rotate(40 ${fmt(px + side * 9)} ${fmt(py + side * 9)})"/>`;
        }
        const [sx, sy] = P(...CITY.syd);
        const [mx, my] = P(...CITY.mel);
        s += cityPin(sx, sy, 'SYDNEY', prog(t, 14.18, 0.6), { lx: -40, ly: -120, anchor: 'end' });
        s += cityPin(mx, my, 'MELBOURNE', prog(t, 14.86, 0.6), { lx: 30, ly: 130, anchor: 'start', fill: C.goldHi });
        // pros line up at the start next to Cliff
        if (pros > 0) {
          for (let i = 0; i < 6; i++) {
            const pp = prog(t, 18.9 + i * 0.1, 0.4);
            const ang = (-150 + i * 34) * D2R;
            s += marker(sx + Math.cos(ang) * 95, sy + 20 + Math.sin(ang) * 70, 'pro', easeOutBack(pp) * 1.2, { a: cl01(pp * 3) });
          }
          s += marker(sx - 10, sy + 85, 'cliff', easeOutBack(prog(t, 19.5, 0.4)) * 1.35);
        }
        return s;
      },
    });
    const kmVal = Math.round(875 * easeOutCubic(km));
    return (
      photo('sydney', { zoom: 1.05 + l * 0.01, dim: 0.62, grade: 'gWarm' }) +
      v.svg +
      (km > 0
        ? `<g transform="translate(540 1212) scale(${fmt(easeOutBack(cl01(km * 1.6)))})" filter="url(#shadow)">
            <rect x="-230" y="-70" width="460" height="130" rx="30" fill="url(#glass)" stroke="url(#ringG)" stroke-width="5"/>
            ${slabText(`${kmVal} KM`, 0, 38, 104, { depth: 6, ls: 4 })}
          </g>`
        : '') +
      shock(540, 1210, prog(t, 17.1, 0.6), { r: 380, color: C.goldHi })
    );
  }

  // S4 21.40–26.80 · GAG 1 — pros covered in sponsor logos + coaches + fancy shoes; Cliff: one sheep sticker, gumboots
  function sSponsors(t, l) {
    const px = 320;
    const py = 640;
    const cx = 790;
    const cy = 700;
    const inA = prog(t, 21.45, 0.4);
    const spotC = prog(t, 24.9, 0.3);
    let stickers = '';
    const spots = [[-80, -90, -18], [70, -100, 16], [-115, 10, 8], [110, 5, -12], [-60, 105, 20], [60, 110, -8], [0, -135, 4], [-5, 130, 10], [-135, -60, 30], [130, -55, -25], [-130, 75, -14], [130, 80, 22]];
    spots.forEach(([dx, dy, r], i) => {
      stickers += sticker(i, px + dx, py + dy, 1.35, r, prog(t, 22.08 + i * 0.07, 0.18));
    });
    const coachA = prog(t, 22.98, 0.35);
    const shoeA = prog(t, 23.62, 0.4);
    const bootA = prog(t, 25.5, 0.4);
    const dimPro = 0.55 * spotC;
    return (
      photo('road', { zoom: 1.06 + l * 0.01, dim: 0.5, grade: 'gWarm' }) +
      `<ellipse cx="${fmt(lerp(px, cx, spotC))}" cy="700" rx="420" ry="620" fill="url(#spotW)" opacity="0.55"/>` +
      `<g opacity="${fmt(1 - dimPro)}">` +
      token(px, py, 165, 'pro', { s: easeOutBack(inA), ph: 0.6 }) +
      stickers +
      // coaches: two clipboard pictograms behind the pro
      (coachA > 0
        ? [[-200, 400], [200, 400]].map(([dx, dy], k) => `<g transform="translate(${px + dx} ${py + dy}) scale(${fmt(easeOutBack(prog(t, 22.98 + k * 0.12, 0.35)))})">
              ${figAt(0, 60, 2.3, 0, { amp: 0, armBias: k ? -40 : 40, armBend: 80, color: '#bff5f1', filter: 'shadowS' })}
              <rect x="${k ? -80 : 36}" y="-40" width="48" height="62" rx="4" fill="#f3e9d2" stroke="#123" stroke-width="3" transform="rotate(${k ? 10 : -10})"/>
              <path d="M${k ? -12 : 30},-6 l0,-10 l16,0 l0,10" stroke="#fff" stroke-width="4" fill="none" transform="translate(${k ? -32 : 0} 0)"/>
            </g>`).join('')
        : '') +
      // fancy shoe with sparkles
      (shoeA > 0
        ? `<g transform="translate(${px} ${py + 330}) scale(${fmt(easeOutBack(shoeA) * 1.5)}) rotate(${fmt(-6 + Math.sin(t * 4) * 3)})" filter="url(#shadow)">${runShoe()}
            ${[[-50, -60], [58, -40], [10, -78]].map(([x, y], k) => {
              const s = 0.6 + 0.4 * Math.sin(t * 9 + k * 2);
              return `<path transform="translate(${x} ${y}) scale(${fmt(s)})" d="M0,-14 L3,-3 L14,0 L3,3 L0,14 L-3,3 L-14,0 L-3,-3 Z" fill="#fff" filter="url(#glowS)"/>`;
            }).join('')}</g>`
        : '') +
      `</g>` +
      // Cliff token: one sheep sticker, lands on the "Cliff has…" pause
      token(cx, cy, 140, 'cliff', { s: easeOutBack(prog(t, 21.7, 0.4)) }) +
      sheepSticker(cx + 92, cy - 96, 1.05, 14, prog(t, 25.12, 0.22)) +
      (bootA > 0 ? gumbootPair(cx, cy + 330 + lerp(-500, 0, easeOutCubic(bootA)), 1.8) : '') +
      burst(cx, cy + 370, prog(t, 25.75, 0.7), 18, { r: 200, color: '#d9c4a0', size: 8, sy: 0.35, seed: 9 })
    );
  }

  // S5 26.80–30.45 · people laugh; some think he's just there to watch (SPECTATOR pass + camp chair)
  function sLaugh(t, l) {
    let bubbles = '';
    const B = [[210, 420, -8], [820, 380, 10], [140, 760, 6], [900, 700, -10], [330, 250, 4], [700, 230, -6], [880, 1010, 8], [180, 1060, -4]];
    B.forEach(([x, y, r], i) => {
      const p = prog(t, 26.9 + i * 0.09, 0.3);
      if (p <= 0) return;
      const shake = Math.sin(t * 22 + i) * 4;
      bubbles += `<g transform="translate(${x} ${fmt(y + shake)}) rotate(${r}) scale(${fmt(easeOutBack(p) * 0.95)})" filter="url(#shadowS)">
        <path d="M-66,-48 H66 A20,20 0 0 1 86,-28 V28 A20,20 0 0 1 66,48 H-10 L-34,72 L-30,48 H-66 A20,20 0 0 1 -86,28 V-28 A20,20 0 0 1 -66,-48 Z" fill="#fff" stroke="#1b1b1b" stroke-width="4"/>
        <circle cx="0" cy="0" r="34" fill="#ffd23f" stroke="#1b1b1b" stroke-width="3"/>
        <path d="M-18,-8 q6,-8 12,0 M6,-8 q6,-8 12,0" stroke="#1b1b1b" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-18,6 Q0,30 18,6 Z" fill="#7a1f1f" stroke="#1b1b1b" stroke-width="3"/>
        <path d="M-28,-2 q-6,8 -2,14" stroke="#5ec8ff" stroke-width="4" fill="none" opacity="0.9"/>
      </g>`;
    });
    const chair = prog(t, 28.6, 0.35);
    const pass = prog(t, 29.24, 0.35);
    const sw = Math.sin(t * 5) * 12 * (1 - prog(t, 29.3, 1.2));
    return (
      photo('crowd', { zoom: 1.05 + l * 0.015, dim: 0.46, grade: 'gWarm' }) +
      bubbles +
      // camp chair slides under Cliff
      (chair > 0
        ? `<g transform="translate(${fmt(lerp(1300, 540, easeOutBack(chair)))} 1010)" filter="url(#shadow)">
            <path d="M-100,0 L100,0 M-80,0 L60,150 M80,0 L-60,150 M-110,-130 L-100,0 M110,-130 L100,0" stroke="#d6d6d6" stroke-width="12" stroke-linecap="round"/>
            <path d="M-110,-130 C-40,-100 40,-100 110,-130 L100,0 C40,20 -40,20 -100,0 Z" fill="#2f6fb5" stroke="#173b63" stroke-width="5"/>
          </g>`
        : '') +
      token(540, 760, 150, 'cliff', { s: easeOutBack(prog(t, 27.9, 0.35)) }) +
      (pass > 0
        ? `<g transform="translate(540 610) rotate(${fmt(sw)})">
            <path d="M-80,0 L0,210 L80,0" stroke="#e2463a" stroke-width="10" fill="none" opacity="${fmt(cl01(pass * 3))}"/>
            <g transform="translate(0 ${fmt(210 + lerp(-120, 0, easeOutBack(pass)))}) scale(${fmt(easeOutBack(pass))})" filter="url(#shadow)">
              <rect x="-150" y="0" width="300" height="140" rx="16" fill="#fff" stroke="#1b1b1b" stroke-width="4"/>
              <rect x="-150" y="0" width="300" height="40" rx="16" fill="#e2463a"/><rect x="-150" y="24" width="300" height="16" fill="#e2463a"/>
              <rect x="-30" y="10" width="60" height="12" rx="6" fill="#fff"/>
              <text x="0" y="104" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="36" letter-spacing="3" fill="#1b1b1b">SPECTATOR</text>
            </g></g>`
        : '')
    );
  }

  // S6 30.45–38.10 · start banner, pros speed off, Cliff's slow shuffle (car-keys search)
  function sStart(t, l) {
    const GY = 1150;
    const gun = prog(t, 30.66, 0.4);
    const off = easeInCubic(prog(t, 31.84, 1.1));
    let pros = '';
    for (let i = 0; i < 4; i++) {
      const bx = 330 + i * 90;
      const x = bx + off * (1700 + i * 200);
      const run = t > 31.84;
      pros += figAt(x, GY - (i % 2) * 16, 2.7, t * (run ? 22 : 0) + i, { amp: run ? 1 : 0.15, lean: run ? 18 : 2, color: '#bff5f1', filter: off > 0.05 ? 'speedBlur' : 'shadowS' });
      if (off > 0) {
        for (let k = 0; k < 4; k++) pros += `<line x1="${fmt(x - 90 - k * 40)}" y1="${fmt(GY - 90 + k * 22 - (i % 2) * 16)}" x2="${fmt(x - 180 - k * 60 - off * 120)}" y2="${fmt(GY - 90 + k * 22 - (i % 2) * 16)}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${fmt(0.5 * (1 - off))}"/>`;
      }
    }
    const sh = t >= 33.46;
    const cxp = 200 + (sh ? (t - 33.46) * 38 : 0);
    const keysA = prog(t, 35.5, 0.4);
    const hunch = 10 * prog(t, 35.4, 0.5);
    const magX = cxp + 170 + Math.sin(t * 3.2) * 60;
    return (
      photo('road', { zoom: 1.03 + l * 0.01, dim: 0.42, grade: 'gWarm', dx: -l * 6 }) +
      // start banner
      `<g transform="translate(0 ${fmt(lerp(-400, 0, easeOutBack(prog(t, 30.5, 0.5))))})" filter="url(#shadow)">
        <rect x="70" y="330" width="22" height="760" fill="#d7d7d7"/><rect x="988" y="330" width="22" height="760" fill="#d7d7d7"/>
        <rect x="60" y="300" width="960" height="140" rx="14" fill="#fff" stroke="#1b1b1b" stroke-width="5"/>
        ${Array.from({ length: 12 }, (_, i) => `<rect x="${60 + i * 80}" y="300" width="40" height="22" fill="#1b1b1b"/><rect x="${100 + i * 80}" y="418" width="40" height="22" fill="#1b1b1b"/>`).join('')}
        <text x="540" y="405" text-anchor="middle" font-family="${F.anton}" font-size="92" letter-spacing="18" fill="#1b1b1b">START</text>
      </g>` +
      `<rect x="0" y="${GY + 4}" width="${W}" height="6" fill="#fff" opacity="0.35"/>` +
      // starter flash
      (gun > 0 && gun < 1 ? `<circle cx="920" cy="600" r="${fmt(40 + 160 * gun)}" fill="#fff4c2" opacity="${fmt(0.8 * (1 - gun))}"/>` : '') +
      pros +
      burst(560, GY, prog(t, 31.9, 0.9), 26, { r: 300, color: '#d9c4a0', size: 10, sy: 0.25, seed: 14 }) +
      // Cliff shuffles: short, quick, low steps, upright
      figAt(cxp, GY, 2.9, t * 13, { amp: sh ? 0.28 : 0.05, lean: sh ? 3 + hunch : 0, knee: 8, armBias: 10, armBend: 40, color: C.goldHi, boots: false, filter: 'shadowS', bob: sh ? Math.abs(Math.sin(t * 13)) * -5 : 0 }) +
      (sh ? `<ellipse cx="${fmt(cxp)}" cy="${GY + 6}" rx="70" ry="12" fill="#000" opacity="0.35"/>` : '') +
      // car-keys thought bubble + magnifier sweep
      (keysA > 0
        ? `<g transform="translate(${fmt(cxp + 150)} 760) scale(${fmt(easeOutBack(keysA))})" filter="url(#shadow)">
            <circle cx="-120" cy="160" r="12" fill="#fff"/><circle cx="-90" cy="120" r="18" fill="#fff"/>
            <ellipse cx="0" cy="0" rx="140" ry="100" fill="#fff" stroke="#1b1b1b" stroke-width="4"/>
            <g transform="rotate(${fmt(Math.sin(t * 6) * 10)})">
              <circle cx="-30" cy="-10" r="30" fill="none" stroke="#b8860b" stroke-width="12"/>
              <path d="M0,-10 L80,-10 L80,10 M58,-10 L58,6 M40,-10 L40,4" stroke="#c9a227" stroke-width="12" stroke-linecap="round" fill="none"/>
            </g>
            <text x="92" y="-36" font-family="${F.anton}" font-size="64" fill="#e2463a">?</text>
          </g>
          <g transform="translate(${fmt(magX)} ${GY - 30}) rotate(-30)" opacity="${fmt(cl01(keysA * 2))}">
            <circle r="42" fill="#bfe8ff" fill-opacity="0.25" stroke="#e8e8e8" stroke-width="9"/>
            <line x1="0" y1="42" x2="0" y2="110" stroke="#8a5a2a" stroke-width="16" stroke-linecap="round"/>
          </g>`
        : '')
    );
  }

  // S7 38.10–42.00 · GAG 2 — night: pros asleep (zzz) while Cliff quietly shuffles past
  function sNight(t, l) {
    const GY = 1130;
    const tents = [[250, 0], [520, 1], [790, 2]];
    const zA = prog(t, 39.3, 0.4);
    const cIn = t >= 39.9;
    const cx = lerp(-120, 1180, prog(t, 39.9, 4.2));
    let stars = '';
    for (let i = 0; i < 60; i++) {
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
      stars += `<circle cx="${fmt(rand(i + 3) * W)}" cy="${fmt(rand(i * 2.3) * 900)}" r="${fmt(1 + rand(i * 5) * 2.2)}" fill="#fff" opacity="${fmt(0.25 + 0.6 * tw * rand(i * 7))}"/>`;
    }
    const moonA = prog(t, 38.2, 0.6);
    return (
      photo('night', { zoom: 1.04 + l * 0.01, dim: 0.35, grade: IMG.night && IMG.night.isNight ? 'gWarm' : 'gNight' }) +
      `<rect width="${W}" height="${H}" fill="${C.night}" opacity="0.35"/>` +
      stars +
      `<g opacity="${fmt(moonA)}" transform="translate(820 ${fmt(330 - 40 * easeOutCubic(moonA))})"><circle r="120" fill="url(#spot)" opacity="0.6"/><circle r="66" fill="url(#moonG)"/><circle cx="26" cy="-12" r="58" fill="${C.night}" opacity="0.92"/></g>` +
      `<rect x="0" y="${GY}" width="${W}" height="6" fill="#9fb7ff" opacity="0.25"/>` +
      tents.map(([x, k]) => {
        const p = prog(t, 38.84 + k * 0.12, 0.4);
        return p > 0 ? `<g transform="translate(0 ${fmt((1 - easeOutBack(p)) * 60)})" opacity="${fmt(cl01(p * 3))}">${tent(x, GY, 1.7, 0.5 + 0.5 * Math.sin(t * 2 + k))}${token(x, GY - 210, 46, 'pro', { a: 0.95 })}</g>` : '';
      }).join('') +
      tents.map(([x, k]) => zzz(x + 40, GY - 250, t + k * 0.4, zA)).join('') +
      // Cliff shuffles past with a head-torch beam
      (cIn
        ? `<g>
            <path d="M${fmt(cx + 30)},${GY - 210} L${fmt(cx + 420)},${GY - 80} L${fmt(cx + 420)},${GY + 20} Z" fill="url(#beamG)" opacity="0.8"/>
            ${figAt(cx, GY, 2.4, t * 13, { amp: 0.28, lean: 4, knee: 8, armBias: 10, armBend: 40, color: C.goldHi, filter: 'glowS', bob: Math.abs(Math.sin(t * 13)) * -4 })}
          </g>`
        : '')
    );
  }

  // S8 42.00–49.30 · alarm set wrong → ~2 H of sleep → GAG 3: the dial turns into a guilty cartoon alarm clock
  function sAlarm(t, l) {
    const inA = popS(t, 42.2, 0.5);
    const twist = prog(t, 43.96, 0.9); // "sets his alarm wrong"
    const hour = lerp(10, 12, easeInOutCubic(twist)) + (t > 44.84 ? Math.sin((t - 44.84) * 30) * 0.08 * (1 - prog(t, 44.84, 0.5)) : 0);
    const arc = prog(t, 46.2, 1.0); // 2-hour wedge
    const face = prog(t, 48.0, 0.3);
    const wob = t > 48.0 ? Math.sin((t - 48.0) * 34) * (1 - prog(t, 48.0, 0.9)) : 0;
    const look = t > 48.7 ? -1 : 0;
    const s = 1 + 0.25 * easeOutBack(face);
    const twoH = prog(t, 46.82, 0.4) * (1 - prog(t, 47.9, 0.2));
    const wrongX = prog(t, 44.84, 0.3) * (1 - prog(t, 45.7, 0.3));
    return (
      photo('night', { zoom: 1.08 + l * 0.008, dim: 0.5, grade: 'gNight' }) +
      `<rect width="${W}" height="${H}" fill="${C.night}" opacity="0.45"/>` +
      `<circle cx="540" cy="700" r="${fmt(430 + 20 * Math.sin(t * 2))}" fill="url(#spotW)" opacity="${fmt(0.35 + 0.35 * face)}"/>` +
      (inA > 0 ? `<g transform="translate(540 700) scale(${fmt(inA)}) translate(-540 -700)">${alarmClock(540, 700, 250, { hour, min: 0, arc, arcFrom: 12, face, wob, look, s, sweat: prog(t, 48.4, 0.8) })}</g>` : '') +
      // team member's hand twisting the knob
      (twist > 0 && twist < 1
        ? `<g transform="translate(860 ${fmt(430 - 20 * Math.sin(twist * Math.PI))}) rotate(${fmt(-20 + twist * 50)})" opacity="${fmt(Math.sin(twist * Math.PI))}">
            <path d="M0,0 C30,-10 60,-6 80,10 L70,40 C50,30 20,30 0,36 Z" fill="#e0b48a" stroke="#6b4423" stroke-width="4"/>
            <rect x="-26" y="-6" width="30" height="48" rx="6" fill="#3b5f8a"/>
          </g>`
        : '') +
      (wrongX > 0 ? `<g transform="translate(780 480) scale(${fmt(easeOutBack(wrongX))}) rotate(-8)"><circle r="46" fill="${C.red}" stroke="#fff" stroke-width="6" filter="url(#shadow)"/><path d="M-18,-18 L18,18 M18,-18 L-18,18" stroke="#fff" stroke-width="10" stroke-linecap="round"/></g>` : '') +
      chip('~2 H', 540, 1110, twoH, { fs: 44, w: 220, night: true }) +
      shock(540, 700, prog(t, 48.02, 0.55), { r: 520, color: '#fff' }) +
      // ringing lines
      (face > 0
        ? [-1, 1].map((sgn) => [0, 1, 2].map((k) => {
            const ph = (t * 2.4 + k / 3) % 1;
            return `<path d="M${540 + sgn * (330 + ph * 70)},${fmt(430 - 40 + k * 0)} q${sgn * 30},40 0,80" stroke="#ffe39a" stroke-width="8" fill="none" stroke-linecap="round" opacity="${fmt(face * (1 - ph) * (1 - prog(t, 48.9, 0.4)))}"/>`;
          }).join('')).join('')
        : '')
    );
  }

  // S9 49.30–53.40 · morning — news spreads from Cliff's marker; the old farmer is still going (map lead)
  function sNews(t, l) {
    const sun = prog(t, 49.4, 1.2);
    const cf = 0.34;
    const v = mapView({
      cx: 700, cy: 520, z: lerp(1.35, 1.5, prog(t, 49.3, 4)), id: 9,
      card: { x: 60, y: 300, w: 960, h: 880 },
      inner: (P) => {
        let s = routePath(P, 1, { w: 8 });
        const [sx, sy] = P(...CITY.syd);
        s += cityPin(sx, sy, 'SYDNEY', 1, { lx: -40, ly: -120, anchor: 'end', fs: 50 });
        const [cx, cy] = P(...routeAt(cf + 0.01 * prog(t, 51.6, 1.5)));
        for (let k = 0; k < 4; k++) {
          const ph = ((t - 50.3) * 0.7 + k / 4) % 1;
          if (t > 50.3) s += `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(40 + ph * 520)}" fill="none" stroke="${C.goldHi}" stroke-width="${fmt(8 * (1 - ph))}" opacity="${fmt(0.8 * (1 - ph))}"/>`;
        }
        [0.22, 0.2, 0.18, 0.16].forEach((f, i) => {
          const [x, y] = P(...routeAt(f));
          s += marker(x + (i % 2 ? 10 : -10), y, 'pro', 1.25);
        });
        s += marker(cx, cy, 'cliff', 1.7 * (1 + 0.12 * pulse(t, 51.62, 0.6)));
        // radio + newspaper icons flying out on the rings
        const items = [[-1.0, 'radio'], [-2.3, 'paper'], [0.4, 'radio'], [-0.2, 'paper'], [2.4, 'paper']];
        items.forEach(([ang, kind], i) => {
          const p = prog(t, 50.4 + i * 0.18, 1.6);
          if (p <= 0 || p >= 1) return;
          const d = 80 + p * 380;
          const x = cx + Math.cos(ang) * d;
          const y = cy + Math.sin(ang) * d * 0.8;
          const a = Math.sin(Math.PI * p);
          s += kind === 'radio'
            ? `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(1.1)" opacity="${fmt(a)}" filter="url(#shadowS)"><rect x="-38" y="-24" width="76" height="50" rx="10" fill="#8a5a2a" stroke="#2b1a0a" stroke-width="3"/><circle cx="-14" cy="2" r="14" fill="#2b1a0a"/><rect x="8" y="-10" width="20" height="6" fill="${C.goldHi}"/><rect x="8" y="4" width="20" height="6" fill="${C.goldHi}"/><path d="M20,-24 L34,-48" stroke="#2b1a0a" stroke-width="4"/></g>`
            : `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(-10 + i * 7)}) scale(1.1)" opacity="${fmt(a)}" filter="url(#shadowS)"><rect x="-40" y="-30" width="80" height="60" fill="#f3efe4" stroke="#333" stroke-width="2"/><rect x="-32" y="-22" width="64" height="10" fill="#333"/><rect x="-32" y="-6" width="28" height="26" fill="#9a9a9a"/>${[0, 8, 16].map((dy) => `<rect x="2" y="${-6 + dy}" width="30" height="4" fill="#777"/>`).join('')}</g>`;
        });
        return s;
      },
    });
    return (
      photo('dawn', { zoom: 1.04 + l * 0.01, dim: 0.4, grade: 'gDawn' }) +
      `<circle cx="540" cy="${fmt(lerp(420, 190, easeOutCubic(sun)))}" r="${fmt(200 + 10 * Math.sin(t * 2))}" fill="url(#sunG)" opacity="${fmt(0.85 * sun)}"/>` +
      v.svg
    );
  }

  // S10 53.40–58.85 · secret training: rounding up sheep on foot… for days
  function sSheep(t, l) {
    const lock = popS(t, 53.6, 0.4);
    const open = prog(t, 54.1, 0.4);
    const lockOut = easeInCubic(prog(t, 54.75, 0.3));
    const herd = prog(t, 54.9, 3.1);
    const days = prog(t, 58.0, 0.8);
    const loopPt = (u) => [540 + Math.cos(u * Math.PI * 2 - Math.PI / 2) * 330, 820 + Math.sin(u * Math.PI * 2 - Math.PI / 2) * 250];
    let flock = '';
    for (let i = 0; i < 7; i++) {
      const u = (herd * 1.1 + i * 0.045) % 1;
      const [x, y] = loopPt(u);
      const hop = Math.abs(Math.sin(t * 9 + i)) * -8;
      const dir = Math.cos(u * Math.PI * 2) < 0 ? -1 : 1;
      flock += `<g transform="translate(${fmt(x)} ${fmt(y + hop)}) scale(${fmt(1.2 * dir)} 1.2)" filter="url(#shadowS)" opacity="${fmt(cl01(herd * 8))}">${sheep()}</g>`;
    }
    const cu = (herd * 1.1 - 0.08 + 1) % 1;
    const [fx, fy] = loopPt(cu);
    const fdir = Math.cos(cu * Math.PI * 2) < 0;
    let tally = '';
    for (let k = 0; k < 5; k++) {
      const p = prog(t, 58.0 + k * 0.12, 0.2);
      if (p > 0) tally += k < 4
        ? `<line x1="${400 + k * 40}" y1="1160" x2="${400 + k * 40}" y2="${fmt(1160 - 90 * easeOutCubic(p))}" stroke="${C.cream}" stroke-width="12" stroke-linecap="round"/>`
        : `<line x1="380" y1="1150" x2="${fmt(380 + 180 * easeOutCubic(p))}" y2="${fmt(1150 - 70 * easeOutCubic(p))}" stroke="${C.gold}" stroke-width="12" stroke-linecap="round"/>`;
    }
    return (
      photo('sheep', { zoom: 1.04 + l * 0.012, dim: 0.46, grade: 'gWarm' }) +
      // paddock loop path
      (herd > 0 ? `<ellipse cx="540" cy="820" rx="330" ry="250" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 16" opacity="${fmt(0.45 * cl01(herd * 5))}"/>` : '') +
      flock +
      (herd > 0 ? figAt(fx, fy + 40, 1.9, t * 11, { amp: 0.6, lean: 6, color: C.goldHi, flip: fdir, filter: 'shadowS' }) : '') +
      // padlock opening (secret training)
      (lock > 0 && lockOut < 1
        ? `<g transform="translate(540 ${fmt(560 - lockOut * 500)}) scale(${fmt(lock * 1.2)})" opacity="${fmt(1 - lockOut)}" filter="url(#shadow)">
            <path d="M-50,-10 L-50,-60 A50,50 0 0 1 50,-60 L50,${fmt(-10 - 40 * open)}" stroke="#cfcfcf" stroke-width="20" fill="none" transform="translate(${fmt(open * 0)} ${fmt(-open * 30)})"/>
            <rect x="-80" y="-14" width="160" height="130" rx="18" fill="url(#goldG)" stroke="#5a3a0a" stroke-width="5"/>
            <circle cy="38" r="16" fill="#3b2508"/><rect x="-6" y="44" width="12" height="36" rx="4" fill="#3b2508"/>
          </g>`
        : '') +
      // days: sun ↔ moon wheel + tally marks
      (days > 0
        ? `<g transform="translate(760 1110) scale(${fmt(easeOutBack(cl01(days * 2)))})">
            <g transform="rotate(${fmt((t - 58.0) * 720)})"><circle cx="0" cy="-52" r="26" fill="#ffd23f" filter="url(#glowS)"/><circle cx="0" cy="52" r="22" fill="url(#moonG)"/></g>
          </g>${tally}`
        : '')
    );
  }

  // S11 58.85–63.35 · GAG 4 — gumboots swap to running shoes; shoe counter 1 → 10 with a ding each tick
  const SHOE_T0 = 61.78; // == mix.mjs DING0
  const SHOE_DT = 0.16;
  function sShoes(t, l) {
    const flip = prog(t, 59.9, 0.8);
    const fsx = Math.cos(flip * Math.PI);
    const showShoe = flip > 0.5;
    const n = t < SHOE_T0 ? 0 : Math.min(10, 1 + Math.floor((t - SHOE_T0) / SHOE_DT));
    const tick = t < SHOE_T0 ? 0 : prog((t - SHOE_T0) % SHOE_DT, 0, 0.1);
    const ctr = prog(t, 61.6, 0.3);
    let pile = '';
    for (let i = 0; i < n; i++) {
      const p = i === n - 1 && n < 10 ? easeOutBack(tick) : 1;
      const x = 540 + ((i % 2) ? 105 : -105) + (rand(i) - 0.5) * 50;
      const y = 1200 - Math.floor(i / 2) * 50 - (1 - p) * 140;
      pile += `<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt((rand(i * 3) - 0.5) * 16)}) scale(${fmt(1.55 * p)})" filter="url(#shadowS)">${runShoe({ color: ['#2ec4b6', '#ff5d8f', '#4aa3ff', '#ffb000', '#8a4dff'][i % 5], color2: i % 2 ? '#fff' : '#ff8a3d' })}</g>`;
    }
    const ding = t >= SHOE_T0 && t < SHOE_T0 + SHOE_DT * 10 + 0.2 ? 1 - tick : 0;
    const swapOut = easeInCubic(prog(t, 61.5, 0.3));
    return (
      photo('shoes', { zoom: 1.05 + l * 0.012, dim: 0.48, grade: 'gWarm' }) +
      // the swap card
      `<g transform="translate(540 ${fmt(lerp(620, 380, easeInOutCubic(prog(t, 61.3, 0.5))))}) scale(${fmt(Math.abs(fsx) * lerp(1, 0.62, easeInOutCubic(prog(t, 61.3, 0.5))))} ${fmt(lerp(1, 0.62, easeInOutCubic(prog(t, 61.3, 0.5))))})" opacity="${fmt(1 - swapOut * 0.0)}">
        <circle r="250" fill="url(#glass)" stroke="url(#ringG)" stroke-width="10" filter="url(#shadow)"/>
        ${showShoe ? `<g transform="scale(2.9)">${runShoe()}</g>` : `<g transform="translate(-20 20) scale(2.6)">${gumboot()}</g>`}
      </g>` +
      shock(540, 620, prog(t, 60.7, 0.5), { r: 380, color: C.goldHi }) +
      // counter
      (ctr > 0
        ? `<g transform="translate(540 700) scale(${fmt(easeOutBack(ctr) * (1 + 0.06 * ding))})" filter="url(#shadow)">
            <rect x="-230" y="-110" width="460" height="220" rx="36" fill="url(#glass)" stroke="url(#ringG)" stroke-width="6"/>
            <g transform="translate(-120 10) scale(1.35)">${runShoe()}</g>
            <text x="60" y="8" text-anchor="middle" font-family="${F.anton}" font-size="70" fill="${C.cream}">×</text>
            <text x="150" y="${fmt(58 - tick * 0)}" text-anchor="middle" font-family="${F.anton}" font-size="${fmt(150 + 16 * ding)}" fill="url(#goldG)" stroke="#1a0f02" stroke-width="3" paint-order="stroke">${Math.max(1, n)}</text>
            ${ding > 0.2 ? `<g opacity="${fmt(ding)}">${[-50, 0, 50].map((a) => `<line x1="${fmt(150 + Math.sin(a * D2R) * 110)}" y1="${fmt(-40 - Math.cos(a * D2R) * 110)}" x2="${fmt(150 + Math.sin(a * D2R) * 150)}" y2="${fmt(-40 - Math.cos(a * D2R) * 150)}" stroke="${C.goldHi}" stroke-width="8" stroke-linecap="round"/>`).join('')}</g>` : ''}
          </g>`
        : '') +
      pile
    );
  }

  // S12 63.35–68.60 · day after day, a few hours' sleep at a time, slowly catching the leaders
  function sCatch(t, l) {
    const dayIdx = Math.min(5, 1 + Math.floor(Math.max(0, t - 63.42) / 0.85));
    const dp = prog((t - 63.42) % 0.85, 0, 0.25);
    const TX0 = 110;
    const TX1 = 970;
    const TY = 1080;
    const catchP = easeInOutCubic(prog(t, 66.6, 1.9));
    const cX = lerp(TX0 + 180, TX0 + 700, lerp(0.15, 1, prog(t, 63.4, 5.2) * 0.4 + catchP * 0.6));
    const leaders = [0.62, 0.66, 0.7].map((f, i) => lerp(TX0, TX1, f + 0.02 * Math.sin(t * 2 + i)));
    const ring = prog(t, 64.54, 0.8);
    return (
      photo('road', { zoom: 1.08 + l * 0.01, dim: 0.5, grade: 'gDawn', dx: -l * 10 }) +
      // day flip card
      `<g transform="translate(540 400)" filter="url(#shadow)">
        <rect x="-190" y="-110" width="380" height="220" rx="26" fill="#f3e9d2" stroke="#1b1b1b" stroke-width="5"/>
        <rect x="-190" y="-110" width="380" height="64" rx="26" fill="${C.red}"/><rect x="-190" y="-70" width="380" height="24" fill="${C.red}"/>
        <circle cx="-110" cy="-110" r="12" fill="#1b1b1b"/><circle cx="110" cy="-110" r="12" fill="#1b1b1b"/>
        <text x="0" y="-62" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="34" letter-spacing="8" fill="#fff">DAY</text>
        <g transform="translate(0 ${fmt(60)}) scale(1 ${fmt(t > 63.42 ? lerp(0.1, 1, easeOutBack(dp)) : 1)})"><text x="0" y="0" dy="0.35em" text-anchor="middle" font-family="${F.anton}" font-size="120" fill="#1b1b1b">${dayIdx}</text></g>
      </g>` +
      // 24 h ring: a few hours of sleep
      (ring > 0
        ? `<g transform="translate(540 760) scale(${fmt(easeOutBack(ring))})" filter="url(#shadow)">
            <circle r="130" fill="url(#glass)" stroke="${C.cream}" stroke-width="4" stroke-opacity="0.4"/>
            <circle r="96" fill="none" stroke="#3a3a3a" stroke-width="34"/>
            <circle r="96" fill="none" stroke="${C.gold}" stroke-width="34" stroke-dasharray="${fmt(2 * Math.PI * 96 * (20 / 24))} 999" transform="rotate(-90)"/>
            <circle r="96" fill="none" stroke="#6c8cff" stroke-width="34" stroke-dasharray="0 ${fmt(2 * Math.PI * 96 * (20 / 24))} ${fmt(2 * Math.PI * 96 * (4 / 24 * cl01(ring * 1.4)))} 999" transform="rotate(-90)"/>
            <g transform="translate(-10 12) scale(0.85)">${zzz(0, 0, t, 1, 0.6)}</g>
          </g>`
        : '') +
      // progress track
      `<g filter="url(#shadow)">
        <rect x="${TX0 - 20}" y="${TY - 34}" width="${TX1 - TX0 + 40}" height="68" rx="34" fill="url(#glass)" stroke="${C.cream}" stroke-opacity="0.35" stroke-width="3"/>
        <line x1="${TX0}" y1="${TY}" x2="${fmt(cX)}" y2="${TY}" stroke="${C.gold}" stroke-width="12" stroke-linecap="round" filter="url(#glowS)"/>
        <rect x="${TX1 - 12}" y="${TY - 42}" width="12" height="84" fill="#fff"/>
      </g>` +
      leaders.map((x) => marker(x, TY, 'pro', 1.3)).join('') +
      marker(cX, TY, 'cliff', 1.7)
    );
  }

  // S13 68.60–74.90 · 5D 15H 4M → crosses the line in MELBOURNE → First. confetti (GAG 5a)
  function sFinish(t, l) {
    const parts = [['5D', 69.02], ['15H', 69.96], ['4M', 70.9]];
    const tapeBreak = prog(t, 72.9, 0.6);
    const run = prog(t, 72.14, 0.9);
    const fx = lerp(-260, 420, easeOutCubic(run)) + (t > 73.1 ? (t - 73.1) * 30 : 0);
    const GY = 1180;
    const first = prog(t, 74.44, 1.5);
    const readout = prog(t, 68.9, 0.4);
    const rUp = easeInOutCubic(prog(t, 71.6, 0.5));
    let digits = '';
    let xx = -250;
    parts.forEach(([s, at], i) => {
      const p = prog(t, at, 0.3);
      const w = s.length * 88 + 30;
      if (p > 0) {
        digits += `<g transform="translate(${xx + w / 2} 0) scale(${fmt(easeOutBack(p))})">${slabText(s, 0, 50, 140, { depth: 7, ls: 2 })}</g>`;
      }
      xx += w + 18;
    });
    return (
      photo('melb', { zoom: 1.04 + l * 0.01, dim: 0.46, grade: 'gWarm' }) +
      (readout > 0
        ? `<g transform="translate(540 ${fmt(lerp(620, 300, rUp))}) scale(${fmt(lerp(1, 0.72, rUp) * easeOutBack(readout))})" filter="url(#shadow)">
            <rect x="-340" y="-110" width="680" height="200" rx="34" fill="url(#glass)" stroke="url(#ringG)" stroke-width="6"/>
            <g transform="translate(-44 0)">${digits}</g>
          </g>`
        : '') +
      chip('MELBOURNE', 540, 520, prog(t, 73.66, 0.4), { fs: 40 }) +
      // finish arch + tape
      (run > 0
        ? `<g opacity="${fmt(cl01(run * 3))}">
            <rect x="420" y="700" width="20" height="${GY - 700}" fill="#e8e8e8"/><rect x="760" y="700" width="20" height="${GY - 700}" fill="#e8e8e8"/><rect x="410" y="690" width="380" height="70" rx="10" fill="#fff" stroke="#1b1b1b" stroke-width="4"/><text x="600" y="742" text-anchor="middle" font-family="${F.anton}" font-size="52" letter-spacing="12" fill="#1b1b1b">FINISH</text>
            ${tapeBreak <= 0
              ? `<line x1="430" y1="${GY - 150}" x2="770" y2="${GY - 150}" stroke="${C.red}" stroke-width="12"/>`
              : `<path d="M430,${GY - 150} Q${fmt(520 + tapeBreak * 30)},${fmt(GY - 150 + tapeBreak * 40)} ${fmt(560 + tapeBreak * 70)},${fmt(GY - 110 + tapeBreak * 90)}" stroke="${C.red}" stroke-width="12" fill="none"/>
                 <path d="M770,${GY - 150} Q${fmt(690 + tapeBreak * 30)},${fmt(GY - 150 + tapeBreak * 40)} ${fmt(660 + tapeBreak * 60)},${fmt(GY - 110 + tapeBreak * 90)}" stroke="${C.red}" stroke-width="12" fill="none"/>`}
          </g>` +
          figAt(fx + 180, GY, 2.9, t * 13, { amp: 0.32, lean: 5, knee: 8, armBias: 10, armBend: 40, color: C.goldHi, filter: 'shadowS', bob: Math.abs(Math.sin(t * 13)) * -5 })
        : '') +
      shock(540, 900, prog(t, 74.44, 0.6), { r: 700, color: '#fff', w: 22 }) +
      (first > 0 && first < 0.2 ? `<rect width="${W}" height="${H}" fill="#fff" opacity="${fmt(0.7 * (1 - first / 0.2))}"/>` : '') +
      confetti(300, 1200, first, 90, { seed: 1, spread: 1.8 }) +
      confetti(800, 1200, first, 90, { seed: 4, spread: 1.8 })
    );
  }

  // S14 74.90–78.70 · GAG 5b gumboots on the podium → legs give out; carried off the stage (dignified)
  function sPodium(t, l) {
    const soft = prog(t, 75.4, 1.2);
    const carry = prog(t, 76.2, 2.5);
    const gx = lerp(300, -220, easeInOutCubic(carry));
    const GY = 1180;
    let conf = '';
    for (let i = 0; i < 50; i++) {
      const y = ((rand(i) * 1400 + (t - 74.9) * (120 + rand(i * 3) * 120)) % 1400) - 100;
      const x = rand(i * 7) * W + Math.sin(t * 2 + i) * 30;
      conf += `<rect x="-8" y="-4" width="16" height="8" fill="${['#ffd23f', '#ff4d6d', '#3ec9ff', '#7cff6b', '#fff'][i % 5]}" transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(t * 200 + i * 40)})" opacity="${fmt(0.8 * (1 - soft * 0.7))}"/>`;
    }
    const helper = (x, k) => figAt(x, GY, 2.3, t * 5 + k * 3, { amp: 0.25, lean: -2, color: '#e9fffd', armBias: k ? 150 : -150, armBend: 0, flip: true, filter: 'shadowS' });
    return (
      photo('melb', { zoom: 1.1 + l * 0.01, dim: 0.62, grade: 'gWarm', dy: -30 }) +
      `<ellipse cx="540" cy="${lerp(650, 700, soft)}" rx="${fmt(lerp(420, 360, soft))}" ry="760" fill="url(#spotW)" opacity="${fmt(0.7 - 0.25 * soft)}"/>` +
      conf +
      // podium
      `<g transform="translate(540 ${GY}) scale(${fmt(easeOutBack(prog(t, 74.9, 0.4)))})" filter="url(#shadow)">
        <rect x="-330" y="-190" width="220" height="190" rx="8" fill="url(#podG)" stroke="#6a5a3a" stroke-width="4"/>
        <rect x="-110" y="-300" width="220" height="300" rx="8" fill="url(#podG)" stroke="#6a5a3a" stroke-width="4"/>
        <rect x="110" y="-140" width="220" height="140" rx="8" fill="url(#podG)" stroke="#6a5a3a" stroke-width="4"/>
        <text x="-220" y="-70" text-anchor="middle" font-family="${F.anton}" font-size="110" fill="#b0a17f">2</text>
        <text x="0" y="-130" text-anchor="middle" font-family="${F.anton}" font-size="170" fill="url(#goldG)" stroke="#6a4a0a" stroke-width="3">1</text>
        <text x="220" y="-40" text-anchor="middle" font-family="${F.anton}" font-size="90" fill="#b0a17f">3</text>
      </g>` +
      gumbootPair(540, GY - 330 + lerp(-300, 0, easeOutBounce(prog(t, 74.95, 0.6))), 2.1) +
      // carried off: two helpers support Cliff, walking gently off stage left
      (carry > 0
        ? `<g opacity="${fmt(cl01(carry * 4))}">
            ${helper(gx - 105, 0)}
            ${figAt(gx, GY - 26, 2.3, 0, { amp: 0, knee: 28, legBias: 10, armBias: 0, armBend: 0, color: C.goldHi, flip: true, filter: 'glowS', arms: 'shoulders' })}
            ${helper(gx + 105, 1)}
          </g>`
        : '')
    );
  }
  function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }

  // S15 78.70–84.20 · soft $10,000 prize → shared with the other runners and his team
  function sPrize(t, l) {
    const chipA = prog(t, 79.34, 0.45);
    const share = prog(t, 82.24, 1.4);
    const CX = 540;
    const CY = 560;
    const recips = [[170, 1000, 'pro'], [330, 1090, 'pro'], [540, 1120, 'team'], [750, 1090, 'pro'], [910, 1000, 'team']];
    let coins = '';
    for (let i = 0; i < 30; i++) {
      const [rx, ry] = recips[i % recips.length];
      const p = cl01((share * 1.4 - (i / 30) * 0.4));
      if (p <= 0 || p >= 1) continue;
      const e = easeInOutCubic(p);
      const x = lerp(CX, rx, e) + Math.sin(p * Math.PI) * (i % 2 ? 40 : -40);
      const y = lerp(CY + 40, ry - 60, e) - Math.sin(p * Math.PI) * 180;
      coins += `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(Math.cos(p * 12 + i))} 1)"><circle r="20" fill="url(#goldG)" stroke="#7a5310" stroke-width="3"/><circle r="12" fill="none" stroke="#fff3c2" stroke-width="2" opacity="0.7"/></g>`;
    }
    const got = (k) => prog(t, 82.6 + k * 0.18, 0.4);
    return (
      photo('crowd', { zoom: 1.08 + l * 0.01, dim: 0.52, grade: 'gWarm' }) +
      `<circle cx="540" cy="620" r="${fmt(460 + 20 * Math.sin(t * 2))}" fill="url(#spotW)" opacity="0.55"/>` +
      token(CX, 820, 120, 'cliff', { s: easeOutBack(prog(t, 78.8, 0.4)) }) +
      (chipA > 0
        ? `<g transform="translate(${CX} ${CY}) scale(${fmt(easeOutBack(chipA) * (1 - 0.15 * prog(t, 82.24, 0.6)))})" filter="url(#shadow)">
            <rect x="-250" y="-80" width="500" height="160" rx="40" fill="url(#glass)" stroke="url(#ringG)" stroke-width="6"/>
            ${slabText('$10,000', 0, 42, 118, { depth: 6, ls: 2 })}
            <rect x="${fmt(-260 + prog(t, 79.6, 0.9) * 520)}" y="-80" width="50" height="160" fill="#fff" opacity="${fmt(0.28 * Math.sin(Math.PI * prog(t, 79.6, 0.9)))}" transform="skewX(-18)"/>
          </g>`
        : '') +
      burst(CX, CY, prog(t, 79.4, 0.8), 22, { r: 320, color: C.goldHi, size: 8, seed: 21 }) +
      recips.map(([x, y, k], i) => (k === 'pro'
        ? token(x, y, 58, 'pro', { s: easeOutBack(prog(t, 80.9 + i * 0.1, 0.4)) * (1 + 0.15 * pulse(t, 82.6 + i * 0.18, 0.4)) })
        : `<g transform="translate(${x} ${y}) scale(${fmt(easeOutBack(prog(t, 80.9 + i * 0.1, 0.4)) * (1 + 0.15 * pulse(t, 82.6 + i * 0.18, 0.4)))})">
            <circle r="58" fill="#2a1d08" stroke="${C.cream}" stroke-width="7" filter="url(#shadow)"/>
            <g transform="translate(-18 30) scale(0.72)">${figure(0, { amp: 0, armBias: 30, color: C.cream, sw: 11 })}</g>
            <g transform="translate(20 30) scale(0.72)">${figure(0, { amp: 0, armBias: -30, color: C.cream, sw: 11 })}</g>
          </g>`)
        + (got(i) > 0 ? `<g transform="translate(${x + 40} ${y - 50}) scale(${fmt(easeOutBack(got(i)))})"><circle r="18" fill="url(#goldG)" stroke="#7a5310" stroke-width="3"/></g>` : '')).join('') +
      coins
    );
  }

  // S16 84.20–87.336 · loop: "…the man everyone laughed at when," → whip back to the frame-1 hook
  function sLoop(t, l) {
    const back = prog(t, 86.9, 0.3); // build to frame-1 composition
    let bubbles = '';
    [[230, 520, -8], [850, 480, 10], [180, 900, 6], [900, 860, -10]].forEach(([x, y, r], i) => {
      const p = prog(t, 86.3 + i * 0.07, 0.25);
      if (p <= 0) return;
      bubbles += `<g transform="translate(${x} ${y}) rotate(${r}) scale(${fmt(easeOutBack(p) * 0.8)})" opacity="${fmt(1 - back)}">
        <ellipse rx="80" ry="54" fill="#fff" stroke="#1b1b1b" stroke-width="4"/>
        <circle r="32" fill="#ffd23f" stroke="#1b1b1b" stroke-width="3"/>
        <path d="M-16,-8 q6,-8 12,0 M4,-8 q6,-8 12,0" stroke="#1b1b1b" stroke-width="4" fill="none"/><path d="M-16,6 Q0,28 16,6 Z" fill="#7a1f1f"/></g>`;
    });
    if (t >= 87.05) return sHook(t - 87.05, t - 87.05) + `<rect width="${W}" height="${H}" fill="#fff" opacity="${fmt(0.6 * (1 - prog(t, 87.05, 0.18)))}"/>`;
    return (
      photo('boots', { zoom: 1.12 - 0.08 * prog(t, 84.2, 2.8), dim: 0.5, grade: 'gWarm' }) +
      `<ellipse cx="540" cy="760" rx="420" ry="700" fill="url(#spotW)" opacity="0.5"/>` +
      gumbootPair(540, 980, 2.4 + 0.1 * prog(t, 84.2, 2.6)) +
      token(540, 460, 120, 'cliff', { s: easeOutBack(prog(t, 84.3, 0.4)) * (1 - back) }) +
      bubbles
    );
  }

  const SCENES = [
    { id: 'hook', start: 0.0, end: 8.6, draw: sHook },
    { id: 'name', start: 8.6, end: 13.2, draw: sName, tin: { type: 'whip', d: 0.28 } },
    { id: 'route', start: 13.2, end: 21.4, draw: sRoute, tin: { type: 'zoom', d: 0.35, cx: 540, cy: 900 } },
    { id: 'sponsors', start: 21.4, end: 26.8, draw: sSponsors, tin: { type: 'whip', d: 0.28 } },
    { id: 'laugh', start: 26.8, end: 30.45, draw: sLaugh, tin: { type: 'flash', d: 0.25 } },
    { id: 'start', start: 30.45, end: 38.1, draw: sStart, tin: { type: 'whip', d: 0.25 } },
    { id: 'night', start: 38.1, end: 42.0, draw: sNight, tin: { type: 'fade', d: 0.35 } },
    { id: 'alarm', start: 42.0, end: 49.3, draw: sAlarm, tin: { type: 'zoom', d: 0.35, cx: 540, cy: 700 } },
    { id: 'news', start: 49.3, end: 53.4, draw: sNews, tin: { type: 'flash', d: 0.3 } },
    { id: 'sheep', start: 53.4, end: 58.85, draw: sSheep, tin: { type: 'whip', d: 0.28 } },
    { id: 'shoes', start: 58.85, end: 63.35, draw: sShoes, tin: { type: 'whip', d: 0.25 } },
    { id: 'catch', start: 63.35, end: 68.6, draw: sCatch, tin: { type: 'fade', d: 0.3 } },
    { id: 'finish', start: 68.6, end: 74.9, draw: sFinish, tin: { type: 'whip', d: 0.28 } },
    { id: 'podium', start: 74.9, end: 78.7, draw: sPodium },
    { id: 'prize', start: 78.7, end: 84.2, draw: sPrize, tin: { type: 'fade', d: 0.35 } },
    { id: 'loop', start: 84.2, end: DUR, draw: sLoop, tin: { type: 'fade', d: 0.3 } },
  ];

  // per-scene caption nudge (keeps captions clear of props in the ~70% band)
  const CAP_NUDGE = {};

  // ---------- karaoke captions (from Whisper word timings) ----------
  function buildCaptionGroups(words) {
    const groups = [];
    let cur = [];
    const flush = () => {
      if (cur.length) groups.push(cur);
      cur = [];
    };
    for (const w of words) {
      const chars = cur.reduce((n, x) => n + x.word.length + 1, 0) + w.word.length;
      if (cur.length && (cur.length >= 4 || chars > 20)) flush();
      cur.push(w);
      if (/[.?!,…:]$/.test(w.word)) flush();
    }
    flush();
    return groups.map((g) => ({ words: g, start: g[0].start, end: g[g.length - 1].end }));
  }
  function captions(t, ep, capY) {
    if (!ep._kgroups) ep._kgroups = buildCaptionGroups(ep.words || []);
    const gs = ep._kgroups;
    let gi = -1;
    for (let i = 0; i < gs.length; i++) {
      const next = gs[i + 1];
      const until = next ? Math.min(next.start - 0.02, gs[i].end + 0.6) : gs[i].end + 0.6;
      if (t >= gs[i].start - 0.06 && t < until) {
        gi = i;
        break;
      }
    }
    if (gi < 0) return '';
    const g = gs[gi];
    const pop = easeOutBack(prog(t, g.start - 0.06, 0.16));
    const txt = g.words.map((w) => w.word.toUpperCase()).join(' ');
    const fs = Math.min(72, 900 / (txt.length * 0.72));
    const spans = g.words
      .map((w, k) => {
        const active = t >= w.start - 0.03 && (t < w.end + 0.08 || (k === g.words.length - 1 && t >= w.start));
        const said = t >= w.end;
        const fill = active ? C.goldHi : said ? '#ffffff' : 'rgba(255,255,255,0.92)';
        return `<tspan fill="${fill}">${esc(w.word.toUpperCase())}${k < g.words.length - 1 ? ' ' : ''}</tspan>`;
      })
      .join('');
    return `<g transform="translate(540 ${capY}) scale(${fmt(0.85 + 0.15 * pop)})" opacity="${fmt(cl01(pop * 2))}">
      <text x="0" y="${fmt(fs * 0.36)}" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="${fmt(fs)}"
        stroke="#000" stroke-width="${fmt(fs * 0.2)}" stroke-linejoin="round" paint-order="stroke" filter="url(#shadow)" letter-spacing="1">${spans}</text>
    </g>`;
  }

  // ---------- compositor with designed transitions ----------
  function drawScene(sc, t) {
    return sc.draw(t, Math.max(0, t - sc.start)) || '';
  }
  function composite(t) {
    let i = SCENES.findIndex((s) => t >= s.start && t < s.end);
    if (i < 0) i = SCENES.length - 1;
    const cur = SCENES[i];
    const tin = cur.tin;
    if (!tin || i === 0 || t >= cur.start + tin.d) return drawScene(cur, t);
    const prev = SCENES[i - 1];
    const p = cl01((t - cur.start) / tin.d);
    const A = drawScene(prev, t);
    const B = drawScene(cur, t);
    switch (tin.type) {
      case 'flash':
        return `${B}<rect width="${W}" height="${H}" fill="#fff" opacity="${fmt(0.85 * Math.pow(1 - p, 2))}"/>`;
      case 'whip': {
        const e = easeInOutCubic(p);
        const off = e * W;
        const streak = Math.sin(Math.PI * p);
        return `<g transform="translate(${fmt(-off)} 0)" filter="url(#blurX)">${A}</g>
          <g transform="translate(${fmt(W - off)} 0)" filter="${p < 0.85 ? 'url(#blurX)' : 'none'}">${B}</g>
          <rect width="${W}" height="${H}" fill="#fff" opacity="${fmt(0.18 * streak)}"/>`;
      }
      case 'zoom': {
        const e = easeInOutCubic(p);
        const cx = tin.cx || 540;
        const cy = tin.cy || 960;
        return `<g transform="translate(${cx} ${cy}) scale(${fmt(1 + e * 2.5)}) translate(${-cx} ${-cy})" opacity="${fmt(1 - e)}">${A}</g>
          <g opacity="${fmt(e)}" transform="translate(540 960) scale(${fmt(1.25 - 0.25 * e)}) translate(-540 -960)">${B}</g>`;
      }
      default:
        return `${A}<g opacity="${fmt(easeInOutCubic(p))}">${B}</g>`;
    }
  }

  window.EPISODE = {
    duration: DUR,
    fps: 30,
    images: Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, v.u])),
    words: [],
    scenes: SCENES,
  };

  window.renderFrame = function (t) {
    const ep = window.EPISODE;
    const root = document.getElementById('root');
    t = clamp(t, 0, DUR - 1e-4);
    const sc = SCENES.find((s) => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];
    const capY = CAP_Y + (CAP_NUDGE[sc.id] || 0);
    const gx = Math.floor(rand(Math.floor(t * 30)) * 384);
    const gy = Math.floor(rand(Math.floor(t * 30) + 0.5) * 384);
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${defs()}
      <rect width="${W}" height="${H}" fill="${C.ink}"/>
      ${composite(t)}
      <rect y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="url(#botShade)" opacity="0.8"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W + 384}" height="${H + 384}" fill="url(#grainP)" opacity="0.07" transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${captions(t, ep, capY)}
    </svg>`;
  };
})();
