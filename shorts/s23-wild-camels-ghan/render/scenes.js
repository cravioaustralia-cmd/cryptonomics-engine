/* s23-wild-camels-ghan — Skylab photo-underlay + premium SVG motion graphics.
 * SVG + renderFrame(t) + Playwright + ffmpeg (shared/render). No Remotion. Not map-explainer.
 * All seams are keyed to Whisper word timings in ../transcript.json (Atlas VO, 43.008 s).
 * On-screen text = names / places / dates / soft key facts only (no VO-echo titles).
 */
(function () {
  const HS = window.HS;
  const { W, H, clamp, lerp, easeOutBack, easeOutCubic, easeInOutCubic, easeOutElastic } = HS;
  const DUR = 43.008;
  const CAP_Y = HS.CAPTION_Y; // 1344 — lower-middle band (~70%)

  // ---------- palette ----------
  const C = {
    ink: '#0d0906',
    gold: '#f0c46a',
    goldHi: '#ffe3a1',
    goldLo: '#9a6a22',
    ochre: '#d9772b',
    red: '#d8412f',
    stamp: '#c8372d',
    cream: '#fff4e2',
    paper: '#f1e6cf',
    sky: '#7fd3ff',
    teal: '#3ec9b8',
  };
  const F = {
    anton: "'Anton', 'Arial Black', sans-serif",
    mont: "'Montserrat', 'Arial Black', sans-serif",
    play: "'Playfair Display', Georgia, serif",
  };

  // ---------- assets (all in ../images, licences in images/SOURCES.md) ----------
  const IMG = {
    herd: { u: '/img/s23_01_feral_camels.jpg', w: 1486, h: 1008 },
    outback: { u: '/img/s23_02_outback_camels.jpg', w: 1688, h: 1212 },
    newhaven: { u: '/img/s23_03_newhaven_camel.jpg', w: 1920, h: 1920 },
    muster: { u: '/img/s23_05_apy_muster.jpg', w: 1920, h: 1281 },
    desert: { u: '/img/s23_06_desert_camels.jpg', w: 1920, h: 1440 },
    c1891: { u: '/img/s23_08_cameleers_1891.jpeg', w: 622, h: 738 },
    hergott: { u: '/img/s23_10_hergott_1905.jpg', w: 1024, h: 670 },
    winton: { u: '/img/s23_15_winton_1911.jpg', w: 1000, h: 594 },
    loco: { u: '/img/s23_16_ghan_train.jpg', w: 1920, h: 1280 },
    alice: { u: '/img/s23_18_ghan_alice.jpg', w: 1920, h: 1078 },
    carriage: { u: '/img/s23_19_ghan_carriage.jpg', w: 1920, h: 1440 },
    otRail: { u: '/img/s23_20_ot_central.jpg', w: 1920, h: 2560 },
    strangways: { u: '/img/s23_21_strangways.jpg', w: 1920, h: 919 },
    otMap: { u: '/img/s23_23_ot_map.png', w: 821, h: 652 },
    birdsville: { u: '/img/s23_26_birdsville_1926.jpg', w: 1920, h: 1152 },
    decorated: { u: '/img/s23_27_afghan_decorated.jpg', w: 1280, h: 817 },
  };

  // fonts (OFL, render/fonts) + image preload so no frame renders blank
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
    ...[...Object.values(IMG).map((im) => im.u), GRAIN].map((u) => {
      const i = new Image();
      i.src = u;
      return i.decode().catch(() => {});
    }),
  ]);

  // ---------- small utils ----------
  const cl01 = (v) => clamp(v, 0, 1);
  const prog = (t, a, d) => cl01((t - a) / d);
  const rand = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const easeInCubic = (x) => x * x * x;
  const fmt = (n) => (Math.round(n * 100) / 100).toString();
  const bez = (a, b, c, d, u) => {
    const v = 1 - u;
    return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d;
  };
  const qbez = (a, b, c, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;

  /** Full-bleed photo with focal point, zoom and drift; always covers frame. */
  function photo(key, o = {}) {
    const im = IMG[key];
    const zoom = o.zoom || 1;
    const s = Math.max(W / im.w, H / im.h) * zoom;
    const iw = im.w * s;
    const ih = im.h * s;
    const fx = o.fx != null ? o.fx : 0.5;
    const fy = o.fy != null ? o.fy : 0.5;
    const x = clamp(W / 2 - fx * iw + (o.dx || 0), W - iw, 0);
    const y = clamp(H / 2 - fy * ih + (o.dy || 0), H - ih, 0);
    const filt = o.grade ? ` filter="url(#${o.grade})"` : '';
    const dim = o.dim != null ? o.dim : 0.4;
    return `<image href="${im.u}" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(iw)}" height="${fmt(ih)}" preserveAspectRatio="none"${filt}/>
      <rect width="${W}" height="${H}" fill="${o.tint || '#000'}" opacity="${dim}"/>`;
  }
  /** Screen position of an image point for a photo() call (anchors MG on real features). */
  function photoPt(key, o, px, py) {
    const im = IMG[key];
    const zoom = o.zoom || 1;
    const s = Math.max(W / im.w, H / im.h) * zoom;
    const iw = im.w * s;
    const ih = im.h * s;
    const x = clamp(W / 2 - (o.fx != null ? o.fx : 0.5) * iw + (o.dx || 0), W - iw, 0);
    const y = clamp(H / 2 - (o.fy != null ? o.fy : 0.5) * ih + (o.dy || 0), H - ih, 0);
    return [x + px * iw, y + py * ih];
  }
  /** Blurred full-bleed backdrop (for low-res archival prints shown sharp on top). */
  function blurBack(key, o = {}) {
    const im = IMG[key];
    const s = Math.max(W / im.w, H / im.h) * (o.zoom || 1.15);
    const iw = im.w * s;
    const ih = im.h * s;
    return `<image href="${im.u}" x="${fmt((W - iw) / 2 + (o.dx || 0))}" y="${fmt((H - ih) / 2)}" width="${fmt(iw)}" height="${fmt(ih)}" preserveAspectRatio="none" filter="url(#bgBlur)"/>
      <rect width="${W}" height="${H}" fill="${o.tint || '#140c05'}" opacity="${o.dim != null ? o.dim : 0.55}"/>`;
  }

  /** Archival print: cream paper border, tape, drop shadow; deals in with p (0..1). */
  function printCard(key, cx, cy, w, rot, p, o = {}) {
    if (p <= 0) return '';
    const im = IMG[key];
    const h = o.h || (w * im.h) / im.w;
    const e = easeOutCubic(cl01(p));
    const b = o.border != null ? o.border : 20;
    const dy = (1 - e) * (o.fromY != null ? o.fromY : 700);
    const r = rot + (1 - e) * (o.spin != null ? o.spin : 14);
    const sc = o.scale != null ? o.scale : 1;
    const id = `pc_${key}_${o.id || 0}`;
    const zoom = o.zoom || 1;
    const iw = w * zoom;
    const ih = (w * im.h * zoom) / im.w;
    const ix = -iw / 2 + (o.dx || 0);
    const iy = -h / 2 - (ih - h) * (o.fy != null ? o.fy : 0.5);
    return `<g transform="translate(${fmt(cx)} ${fmt(cy + dy)}) rotate(${fmt(r)}) scale(${fmt(sc)})" opacity="${fmt(cl01(p * 3))}">
      <rect x="${-w / 2 - b}" y="${-h / 2 - b}" width="${w + 2 * b}" height="${h + 2 * b + (o.caption ? 40 : 0)}" fill="${C.paper}" filter="url(#shadow)"/>
      <clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/></clipPath>
      <g clip-path="url(#${id})"><image href="${im.u}" x="${fmt(ix)}" y="${fmt(iy)}" width="${fmt(iw)}" height="${fmt(ih)}" preserveAspectRatio="none" filter="url(#${o.grade || 'gSepia'})"/>
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#printVig)"/></g>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="2"/>
      ${o.tape === false ? '' : `<rect x="${-w / 2 - 40}" y="${-h / 2 - 34}" width="130" height="44" fill="#f7efd9" opacity="0.72" transform="rotate(-32 ${-w / 2 + 25} ${-h / 2 - 12})"/>
      <rect x="${w / 2 - 90}" y="${-h / 2 - 34}" width="130" height="44" fill="#f7efd9" opacity="0.72" transform="rotate(30 ${w / 2 - 25} ${-h / 2 - 12})"/>`}
    </g>`;
  }

  // ---------- shared defs ----------
  function defs() {
    return `<defs>
      <filter id="gSepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.42 0.72 0.18 0 0.02  0.35 0.64 0.16 0 0.01  0.26 0.5 0.13 0 0  0 0 0 1 0"/></filter>
      <filter id="gWarm" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.1 0.06 0 0 0.02  0.02 1.0 0 0 0.01  0 0 0.8 0 0  0 0 0 1 0"/></filter>
      <filter id="gHot" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.18 0.1 0 0 0.04  0.04 0.98 0 0 0.01  0 0 0.7 0 0  0 0 0 1 0"/></filter>
      <filter id="gPop" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="1.3"/><feComponentTransfer><feFuncR type="linear" slope="1.2" intercept="0.02"/><feFuncG type="linear" slope="1.15" intercept="0.01"/><feFuncB type="linear" slope="1.05" intercept="0"/></feComponentTransfer></filter>
      <filter id="gBW" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.36 0.62 0.14 0 0.01  0.33 0.6 0.13 0 0  0.3 0.55 0.12 0 0  0 0 0 1 0"/></filter>
      <filter id="gMap" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.9 0 0 0 0.02  0 0.82 0 0 0  0 0 0.62 0 0  0 0 0 1 0"/></filter>
      <filter id="bgBlur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="22"/></filter>
      <filter id="blurX" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation="46 0"/></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glowS" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.65"/></filter>
      <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter>
      <filter id="heat" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.03" numOctaves="1" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18"/></filter>
      <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c2"/><stop offset="0.45" stop-color="${C.gold}"/><stop offset="1" stop-color="#b07a2a"/></linearGradient>
      <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b07a2a" stop-opacity="0"/><stop offset="0.5" stop-color="${C.goldHi}"/><stop offset="1" stop-color="#b07a2a" stop-opacity="0"/></linearGradient>
      <linearGradient id="ochreG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd09a"/><stop offset="0.5" stop-color="${C.ochre}"/><stop offset="1" stop-color="#8a3a10"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22160b" stop-opacity="0.9"/><stop offset="1" stop-color="#0d0804" stop-opacity="0.88"/></linearGradient>
      <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.72"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="botShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.78"/></linearGradient>
      <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient>
      <radialGradient id="printVig" cx="0.5" cy="0.5" r="0.7"><stop offset="0.6" stop-color="#3a2408" stop-opacity="0"/><stop offset="1" stop-color="#3a2408" stop-opacity="0.45"/></radialGradient>
      <radialGradient id="spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff2cf" stop-opacity="0.55"/><stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></radialGradient>
      <radialGradient id="sunG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6d8"/><stop offset="0.35" stop-color="#ffd27a" stop-opacity="0.95"/><stop offset="0.7" stop-color="${C.ochre}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.ochre}" stop-opacity="0"/></radialGradient>
      <radialGradient id="ausFill" cx="0.5" cy="0.55" r="0.6"><stop offset="0" stop-color="#e0843a" stop-opacity="0.55"/><stop offset="1" stop-color="#8a3a10" stop-opacity="0.35"/></radialGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset="0.35" stop-color="${C.gold}"/><stop offset="0.7" stop-color="#a86e1f"/><stop offset="1" stop-color="#ffe29a"/></linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c79a62"/><stop offset="1" stop-color="#7a4f28"/></linearGradient>
      <linearGradient id="tagG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8eed6"/><stop offset="1" stop-color="#e2d0a8"/></linearGradient>
      <pattern id="grainP" patternUnits="userSpaceOnUse" width="384" height="384"><image href="${GRAIN}" width="384" height="384"/></pattern>
    </defs>`;
  }

  // ---------- silhouettes (hand-built, generic) ----------
  // dromedary facing right; feet at y=70
  const CAMEL = `<path d="M-60,-30 C-58,-50 -35,-78 -5,-80 C20,-80 32,-58 40,-44 C46,-36 54,-34 60,-36
    C72,-38 80,-30 86,-18 C90,-10 94,-8 98,-14 C104,-26 106,-42 112,-50 C116,-56 126,-58 134,-54 L139,-46
    C136,-42 130,-40 124,-42 C118,-40 116,-32 112,-22 C106,-6 98,4 88,4 C78,4 72,-4 64,-6
    C60,0 56,6 54,12 L58,40 L57,70 L50,70 L49,41 L44,18 L40,40 L42,70 L35,70 L33,41 L30,10
    C10,12 -20,12 -38,8 L-40,40 L-35,70 L-42,70 L-48,41 L-51,16 L-55,40 L-53,70 L-60,70 L-64,40 L-64,10
    C-66,-5 -64,-20 -60,-30 Z M-61,-26 C-70,-20 -72,-6 -68,8 L-65,8 C-67,-4 -64,-16 -58,-22 Z"/>
    <path d="M126,-54 L128,-61 L131,-55 Z"/>`;
  // horse facing right; feet at y≈60
  const HORSE = `<path d="M-70,-18 C-60,-30 -20,-32 20,-28 C34,-27 44,-34 52,-46 L70,-72 C74,-78 80,-80 84,-76
    L96,-60 C100,-54 98,-50 92,-50 L80,-52 C72,-40 66,-26 62,-10 C60,0 56,6 50,8 L48,30 L52,58 L45,60 L39,31 L35,10
    C20,12 0,12 -20,10 L-28,32 L-22,58 L-29,60 L-37,32 L-44,12 L-50,32 L-46,58 L-53,60 L-61,30 C-66,18 -72,4 -70,-18 Z
    M-70,-16 C-84,-12 -94,4 -96,24 L-90,26 C-86,10 -80,0 -68,-6 Z M78,-78 L80,-90 L86,-78 Z"/>`;
  // 1920s lorry facing left; wheels touch y≈40
  const TRUCK = `<g fill-rule="evenodd">
    <path d="M-130,-36 L-60,-36 L-60,-82 L-6,-82 C0,-82 4,-78 4,-72 L4,-36 L130,-36 L130,14 L-136,14 L-136,-24 C-136,-30 -134,-36 -130,-36 Z
      M-52,-74 L-52,-44 L-12,-44 L-12,-74 Z"/>
    <path d="M-150,-8 L-136,-8 L-136,6 L-150,6 Z"/>
    <path d="M10,-52 L130,-52 L130,-44 L10,-44 Z M14,-52 L20,-52 L20,-36 L14,-36 Z M66,-52 L72,-52 L72,-36 L66,-36 Z M122,-52 L128,-52 L128,-36 L122,-36 Z"/>
    <path d="M-118,14 A28,28 0 0 1 -62,14 Z M60,14 A28,28 0 0 1 116,14 Z"/>
    <path d="M-90,-12 a26,26 0 1,0 0.1,0 Z M-90,4 a10,10 0 1,1 -0.1,0 Z"/>
    <path d="M88,-12 a26,26 0 1,0 0.1,0 Z M88,4 a10,10 0 1,1 -0.1,0 Z"/>
  </g>`;
  function camelAt(x, y, s, o = {}) {
    // y = ground line; feet at +70 local
    const flip = o.flip ? -1 : 1;
    const bob = o.bob || 0;
    return `<g transform="translate(${fmt(x)} ${fmt(y - 70 * s + bob)}) scale(${fmt(s * flip)} ${fmt(s)})" fill="${o.fill || C.gold}" opacity="${fmt(o.a != null ? o.a : 1)}"${o.filter ? ` filter="url(#${o.filter})"` : ''}>${CAMEL}</g>`;
  }

  // ---------- Australia outline (lon/lat → screen) ----------
  const AUS = [
    [142.5, -10.7], [143.5, -14], [145.3, -15], [145.9, -17], [146.3, -19], [148.8, -20.4], [150.2, -22.3], [151.2, -23.9],
    [153.1, -25.3], [153.6, -28.2], [153.1, -30.3], [152.5, -32.5], [151.2, -33.9], [150.2, -35.7], [150, -37.5], [149.3, -37.8],
    [147.5, -38.2], [146.3, -39.1], [144.9, -37.8], [143.5, -38.8], [141.5, -38.4], [140.4, -37.9], [139.7, -36.9], [139.3, -35.6],
    [138.5, -35.6], [138.4, -34.8], [138.1, -34.2], [137.6, -35.1], [137.4, -35.2], [137.9, -33.6], [137.6, -33.0], [136.4, -34.1],
    [135.9, -34.9], [135.1, -33.9], [134.2, -32.9], [133.0, -32.2], [131.2, -31.5], [129, -31.7], [126.2, -32.3], [124, -33],
    [123.5, -33.9], [121.9, -33.9], [119.9, -34.0], [118.0, -35.1], [116.6, -35.0], [115.0, -34.3], [115.7, -33.3], [115.7, -31.8],
    [115.0, -30.0], [114.9, -29.0], [113.7, -26.6], [113.4, -24.5], [113.9, -22.0], [114.6, -21.8], [116.7, -20.6], [118.8, -20.3],
    [121.0, -19.6], [122.2, -18.0], [122.9, -16.4], [124.4, -15.6], [125.2, -14.5], [126.9, -13.8], [128.1, -15.2], [129.6, -14.9],
    [130.1, -13.2], [130.8, -12.4], [132.6, -11.5], [133.9, -11.8], [136.0, -12.0], [136.8, -12.2], [136.2, -13.3], [135.5, -15.0],
    [137.0, -15.9], [139.2, -17.4], [140.8, -17.4], [141.5, -15.5], [141.6, -12.6],
  ];
  const TAS = [[144.6, -40.7], [148.3, -40.9], [148.3, -42.2], [147.8, -43.2], [146.8, -43.6], [145.3, -42.2]];
  const LON0 = 133.5;
  const LAT0 = -27;
  const COSL = 0.891;
  function ausProj(lon, lat, cx, cy, width) {
    const k = width / (41 * COSL);
    return [cx + (lon - LON0) * k * COSL, cy + (-lat + LAT0) * k];
  }
  function ausPathD(cx, cy, width) {
    const pts = (arr) => arr.map(([lo, la], i) => {
      const [x, y] = ausProj(lo, la, cx, cy, width);
      return `${i ? 'L' : 'M'}${fmt(x)},${fmt(y)}`;
    }).join(' ') + ' Z';
    return pts(AUS) + ' ' + pts(TAS);
  }
  function inPoly(lo, la) {
    let c = false;
    for (let i = 0, j = AUS.length - 1; i < AUS.length; j = i++) {
      const [xi, yi] = AUS[i];
      const [xj, yj] = AUS[j];
      if (yi > la !== yj > la && lo < ((xj - xi) * (la - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  // feral-camel stipple: biased to the arid interior (WA / NT / SA / west Qld deserts)
  const HERD_PTS = (() => {
    const out = [];
    let i = 0;
    while (out.length < 900 && i < 40000) {
      i++;
      const lo = 114 + rand(i * 1.3) * 38;
      const la = -12 - rand(i * 2.7 + 5) * 26;
      if (!inPoly(lo, la)) continue;
      const d = Math.hypot((lo - 129) / 11, (la + 25) / 7.5);
      if (rand(i * 5.1 + 9) > Math.exp(-d * d * 0.9) * 1.1) continue;
      if (lo > 146) continue; // camels are rare on the wetter east coast
      out.push([lo, la, rand(i * 7.7)]);
    }
    return out;
  })();
  /** Australia map insert: draw p (outline stroke), fill f, herd dots n (0..1). */
  function ausMap(cx, cy, width, o = {}) {
    const d = ausPathD(cx, cy, width);
    const L = width * 5.2;
    const draw = o.draw != null ? o.draw : 1;
    const fill = o.fill != null ? o.fill : 1;
    let dots = '';
    if (o.dots > 0) {
      const n = Math.floor(HERD_PTS.length * cl01(o.dots));
      for (let i = 0; i < n; i++) {
        const [lo, la, r] = HERD_PTS[i];
        const [x, y] = ausProj(lo, la, cx, cy, width);
        const age = cl01((cl01(o.dots) * HERD_PTS.length - i) / 40);
        dots += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt((o.dotR || 2.6) * (0.6 + 0.6 * r) * (1 + (1 - age) * 1.5))}" fill="${C.goldHi}" opacity="${fmt(0.55 + 0.45 * age)}"/>`;
      }
    }
    return `<g opacity="${fmt(o.a != null ? o.a : 1)}">
      <path d="${d}" fill="url(#ausFill)" opacity="${fmt(fill)}"/>
      <path d="${d}" fill="none" stroke="${C.goldHi}" stroke-width="${o.sw || 5}" stroke-linejoin="round" stroke-dasharray="${fmt(L)}" stroke-dashoffset="${fmt(L * (1 - draw))}" filter="url(#glowS)"/>
      ${dots}
    </g>`;
  }

  // ---------- design components ----------
  function chip(label, x, y, p, o = {}) {
    if (p <= 0) return '';
    const e = easeOutBack(cl01(p));
    const fs = o.fs || 30;
    const w = o.w || label.length * (fs * 0.72 + 3) + (o.icon === false ? 64 : 116);
    const icon =
      o.icon === false
        ? ''
        : `<g transform="translate(${-w / 2 + 44} 0)">
            <path d="M0,-20 C-12,-20 -18,-11 -18,-3 C-18,9 0,22 0,22 C0,22 18,9 18,-3 C18,-11 12,-20 0,-20 Z" fill="${o.accent || C.gold}"/>
            <circle cx="0" cy="-4" r="6" fill="${C.ink}"/></g>`;
    const tx = o.icon === false ? 0 : 26;
    const strike = o.strike > 0
      ? `<line x1="${-w / 2 + 14}" y1="2" x2="${-w / 2 + 14 + (w - 28) * easeOutCubic(cl01(o.strike))}" y2="-2" stroke="${C.red}" stroke-width="9" stroke-linecap="round"/>`
      : '';
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(e * (o.scale || 1))})" opacity="${fmt(cl01(p * 3) * (o.a != null ? o.a : 1))}" filter="url(#shadow)">
      <rect x="${-w / 2}" y="-38" width="${w}" height="76" rx="38" fill="url(#glass)" stroke="${o.accent || C.gold}" stroke-width="3"/>
      ${icon}
      <text x="${tx}" y="${fs * 0.36}" text-anchor="middle" font-family="${o.italic ? F.play : F.mont}" font-weight="${o.italic ? 700 : 900}" ${o.italic ? 'font-style="italic"' : ''} font-size="${fs}"
        fill="${o.color || C.cream}" letter-spacing="${o.italic ? 1 : 3}">${esc(label)}</text>
      ${strike}
    </g>`;
  }

  /** Big 3D-extruded Anton type. */
  function slabText(txt, x, y, size, o = {}) {
    const depth = o.depth || 10;
    let ext = '';
    for (let d = depth; d > 0; d--) {
      ext += `<text x="${x + d * 0.9}" y="${y + d * 1.1}" text-anchor="middle" font-family="${F.anton}" font-size="${size}" fill="${o.ext || '#3b2508'}" letter-spacing="${o.ls || 0}">${esc(txt)}</text>`;
    }
    return `<g>${ext}<text x="${x}" y="${y}" text-anchor="middle" font-family="${F.anton}" font-size="${size}" fill="${o.fill || 'url(#goldG)'}" stroke="${o.stroke || '#1a0f02'}" stroke-width="${o.sw || 3}" paint-order="stroke" letter-spacing="${o.ls || 0}">${esc(txt)}</text></g>`;
  }

  /** Frame-1 hook card: OVER A MILLION (unspoken on frame 1). */
  function hookCard(s, a, shimmer) {
    if (a <= 0) return '';
    const sh = shimmer != null ? shimmer : 0;
    return `<g opacity="${fmt(a)}" transform="translate(540 400) scale(${fmt(s)}) translate(-540 -400)">
      <rect x="0" y="0" width="${W}" height="720" fill="url(#topShade)"/>
      <text x="540" y="222" text-anchor="middle" font-family="${F.mont}" font-weight="900" font-size="32" letter-spacing="14" fill="${C.goldHi}">WILD CAMELS</text>
      <rect x="290" y="242" width="500" height="3" fill="url(#goldH)"/>
      ${slabText('OVER A', 540, 370, 118, { depth: 8, ls: 10, fill: C.cream, ext: '#111' })}
      ${slabText('MILLION', 540, 580, 214, { depth: 13, ls: 6 })}
      <rect x="${fmt(150 + sh * 760)}" y="400" width="64" height="190" fill="#fff" opacity="${fmt(0.28 * Math.sin(Math.PI * sh))}" transform="skewX(-20)"/>
    </g>`;
  }

  function particlesDust(t, n, seed, o = {}) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const r1 = rand(i + seed);
      const r2 = rand(i * 3.7 + seed);
      const r3 = rand(i * 7.1 + seed);
      const sp = o.speed || 30;
      const x = (((r1 * W + Math.sin(t * 0.6 + i) * 20 + (o.dx || 0) * t) % W) + W) % W;
      const y = (((r2 * H - t * sp * (0.5 + r3)) % H) + H) % H;
      const rr = 1.5 + r3 * (o.size || 3);
      s += `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(rr)}" fill="${o.color || C.goldHi}" opacity="${fmt((o.alpha || 0.5) * (0.4 + 0.6 * r2))}"/>`;
    }
    return s;
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
  function shock(cx, cy, p, o = {}) {
    if (p <= 0 || p >= 1) return '';
    const e = easeOutCubic(p);
    return `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt((o.r || 400) * e)}" fill="none" stroke="${o.color || '#fff'}" stroke-width="${fmt((o.w || 14) * (1 - p))}" opacity="${fmt(1 - p)}"/>`;
  }
  function pin(x, y, p, o = {}) {
    if (p <= 0) return '';
    const dy = lerp(-260, 0, easeOutElastic(cl01(p * 1.15)));
    const s = o.s || 1;
    return `<g transform="translate(${fmt(x)} ${fmt(y + dy)}) scale(${s})" opacity="${fmt(cl01(p * 4))}">
      <ellipse cx="0" cy="4" rx="${fmt(22 * cl01(p * 2))}" ry="7" fill="#000" opacity="0.45"/>
      <path d="M0,0 C-8,-16 -32,-38 -32,-64 C-32,-84 -16,-98 0,-98 C16,-98 32,-84 32,-64 C32,-38 8,-16 0,0 Z" fill="${o.fill || C.gold}" stroke="#5a3a0a" stroke-width="3"/>
      <circle cx="0" cy="-64" r="12" fill="${C.ink}"/>
    </g>`;
  }
  function tag(txt, x, y, a, col, o = {}) {
    if (a <= 0) return '';
    return `<text x="${fmt(x)}" y="${fmt(y)}" text-anchor="${o.anchor || 'middle'}" font-family="${F.mont}" font-weight="900" font-size="${o.fs || 30}" letter-spacing="3"
      fill="${col || C.cream}" stroke="#000" stroke-width="8" paint-order="stroke" opacity="${fmt(a)}">${esc(txt)}</text>`;
  }
  /** Circular photo medallion (crop of an archival print). */
  function medallion(key, cx, cy, r, p, o = {}) {
    if (p <= 0) return '';
    const im = IMG[key];
    const e = easeOutBack(cl01(p));
    const iw = o.iw || r * 4;
    const ih = (iw * im.h) / im.w;
    const id = `md_${key}_${o.id || 0}`;
    return `<g transform="translate(${fmt(cx)} ${fmt(cy)}) scale(${fmt(e)})" opacity="${fmt(cl01(p * 3))}">
      <circle r="${r + 26}" fill="url(#spot)" opacity="0.6"/>
      <circle r="${r}" fill="${C.ink}" stroke="url(#ringG)" stroke-width="8" filter="url(#shadow)"/>
      <clipPath id="${id}"><circle r="${r - 6}"/></clipPath>
      <g clip-path="url(#${id})"><image href="${im.u}" x="${fmt(-iw * (o.fx || 0.5))}" y="${fmt(-ih * (o.fy || 0.5))}" width="${fmt(iw)}" height="${fmt(ih)}" preserveAspectRatio="none" filter="url(#gSepia)"/></g>
    </g>`;
  }
  /** Rubber stamp (ink) — slams in with p. */
  function stamp(label, cx, cy, rot, p, o = {}) {
    if (p <= 0) return '';
    const e = cl01(p / 0.35);
    const s = lerp(2.2, 1, easeOutCubic(e));
    const fs = o.fs || 120;
    const w = o.w || label.length * fs * 0.52 + 90;
    const h = fs + 70;
    return `<g transform="translate(${fmt(cx)} ${fmt(cy)}) rotate(${rot}) scale(${fmt(s)})" opacity="${fmt(0.9 * cl01(e * 2))}" filter="url(#rough)">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="none" stroke="${C.stamp}" stroke-width="10"/>
      <rect x="${-w / 2 + 16}" y="${-h / 2 + 16}" width="${w - 32}" height="${h - 32}" rx="10" fill="none" stroke="${C.stamp}" stroke-width="4"/>
      <text y="${fs * 0.36}" text-anchor="middle" font-family="${F.anton}" font-size="${fs}" letter-spacing="8" fill="${C.stamp}">${esc(label)}</text>
    </g>`;
  }

  // ======================================================================
  // SCENES — times from transcript.json
  // ======================================================================
  const HK = { zoom: 1.0, fx: 0.47, fy: 0.46 };

  // S1 0.00–2.50 · HOOK: OVER A MILLION over an Australian feral herd (frame 1 = full card)
  function sHook(t, l) {
    const settle = 1.06 - 0.06 * easeOutCubic(prog(l, 0, 0.5));
    const exit = easeInCubic(prog(l, 2.05, 0.4));
    return (
      photo('herd', { ...HK, zoom: HK.zoom + l * 0.012, dim: 0.22, grade: 'gPop' }) +
      `<rect width="${W}" height="${H}" fill="url(#spot)" opacity="0.3" transform="translate(0 -320)"/>` +
      particlesDust(l, 40, 3, { speed: 22, alpha: 0.45 }) +
      shock(540, 470, prog(l, 0.0, 0.7), { r: 720, color: C.goldHi, w: 18 }) +
      `<g transform="translate(0 ${fmt(-exit * 760)})">${hookCard(settle, 1 - exit * 0.8, prog(l, 0.2, 0.9))}</g>`
    );
  }

  // S2 2.50–5.75 · not Arabia ✕, not Asia ✕ … Australia (outline draws, pin, herd glints)
  const DS = { zoom: 1.02, fx: 0.36, fy: 0.55 };
  function sWhere(t, l) {
    const fly = easeInCubic(prog(t, 4.62, 0.35));
    const ausA = prog(t, 4.62, 0.7);
    const land = prog(t, 4.94, 0.5);
    return (
      photo('desert', { ...DS, zoom: DS.zoom + l * 0.015, dim: 0.5, grade: 'gWarm' }) +
      `<g transform="translate(${fmt(-fly * 700)} 0)" opacity="${fmt(1 - fly)}">` +
      chip('ARABIA', 540, 300, prog(t, 3.08, 0.3), { icon: false, fs: 36, strike: prog(t, 3.56, 0.22), a: 1 - 0.45 * prog(t, 3.6, 0.2), accent: C.cream }) +
      chip('ASIA', 540, 410, prog(t, 3.86, 0.3), { icon: false, fs: 36, strike: prog(t, 4.26, 0.22), a: 1 - 0.45 * prog(t, 4.3, 0.2), accent: C.cream }) +
      `</g>` +
      (ausA > 0
        ? `<g transform="translate(540 790) scale(${fmt(lerp(0.9, 1, easeOutCubic(ausA)))}) translate(-540 -790)">${ausMap(540, 790, 720, { draw: easeInOutCubic(prog(t, 4.62, 0.55)), fill: prog(t, 4.94, 0.4), dots: 0.35 * prog(t, 5.0, 0.7), a: 1 })}</g>`
        : '') +
      shock(540, 790, land, { r: 560, color: C.goldHi, w: 16 }) +
      pin(...ausProj(133.4, -24.5, 540, 790, 720), prog(t, 4.94, 0.6)) +
      chip('AUSTRALIA', 540, 330, prog(t, 4.96, 0.35), { fs: 40 })
    );
  }

  // S3 5.75–10.15 · sly tease: the people who brought them ↔ a famous train (The Ghan loco)
  const LOCO = { zoom: 1.0, fx: 0.62, fy: 0.5 };
  function sTease(t, l) {
    const o = { ...LOCO, zoom: 1.0 + l * 0.02 };
    const [lx, ly] = photoPt('loco', o, 0.645, 0.487);
    const mx = 250;
    const my = 470;
    const ring = prog(t, 7.94, 0.4);
    const link = easeInOutCubic(prog(t, 8.32, 0.66));
    const c1 = [mx + 240, my - 60];
    const c2 = [lx - 60, ly - 330];
    const d = `M${mx + 60},${my + 90} C${fmt(c1[0])},${fmt(c1[1] + 250)} ${fmt(c2[0])},${fmt(c2[1])} ${fmt(lx)},${fmt(ly - 80)}`;
    const LEN = 900;
    const sx = bez(mx + 60, c1[0], c2[0], lx, link);
    const sy = bez(my + 90, c1[1] + 250, c2[1], ly - 80, link);
    const q = prog(t, 8.1, 0.3);
    return (
      photo('loco', { ...o, dim: 0.42 - 0.12 * prog(t, 7.6, 0.6), grade: 'gWarm' }) +
      `<rect width="${W}" height="${H}" fill="#1a0a02" opacity="0.18"/>` +
      medallion('c1891', mx, my, 150, prog(t, 6.2, 0.45), { iw: 640, fx: 0.16, fy: 0.55 }) +
      (ring > 0
        ? `<circle cx="${fmt(lx)}" cy="${fmt(ly)}" r="${fmt(lerp(260, 96, easeOutCubic(ring)) + 6 * Math.sin(t * 7))}" fill="none" stroke="${C.goldHi}" stroke-width="6" opacity="${fmt(cl01(ring * 2))}" filter="url(#glowS)"/>
           <circle cx="${fmt(lx)}" cy="${fmt(ly)}" r="${fmt(lerp(300, 120, easeOutCubic(ring)))}" fill="none" stroke="${C.gold}" stroke-width="2" stroke-dasharray="6 10" opacity="${fmt(0.8 * cl01(ring * 2))}"/>`
        : '') +
      (link > 0
        ? `<path d="${d}" stroke="${C.goldHi}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${LEN}" stroke-dashoffset="${fmt(LEN * (1 - link))}" filter="url(#glowS)"/>
           <circle cx="${fmt(sx)}" cy="${fmt(sy)}" r="13" fill="#fff" filter="url(#glow)" opacity="${fmt(link < 1 ? 1 : 1 - prog(t, 9.1, 0.3))}"/>`
        : '') +
      (q > 0
        ? `<g transform="translate(${fmt(lx + 70)} ${fmt(ly - 250)}) scale(${fmt(easeOutBack(q) * (1 + 0.05 * Math.sin(t * 8)))})">
             <circle r="62" fill="url(#glass)" stroke="url(#ringG)" stroke-width="5" filter="url(#shadow)"/>
             <text y="34" text-anchor="middle" font-family="${F.anton}" font-size="96" fill="${C.goldHi}">?</text></g>`
        : '')
    );
  }

  // S4 10.15–13.20 · 1860s slam; horses struggle in the heat → a camel strides in
  const STR = { zoom: 1.0, fx: 0.45, fy: 0.5 };
  function sYear(t, l) {
    const slam = prog(t, 10.34, 0.32);
    const sc = slam > 0 ? lerp(2.4, 1, easeOutCubic(slam)) : 2.4;
    const up = easeInOutCubic(prog(t, 10.95, 0.45));
    const shake = slam > 0 && slam < 1 ? Math.sin(l * 90) * 10 * (1 - slam) : 0;
    const yy = lerp(760, 360, up);
    const ysc = lerp(1, 0.62, up);
    // horse: walks in, slows, droops; exits as the camel strides in on "so"
    const hIn = easeOutCubic(prog(t, 11.1, 1.4));
    const swap = easeInOutCubic(prog(t, 12.7, 0.45));
    const hx = lerp(-220, 470, hIn) - swap * 700;
    const hBob = Math.sin(l * 9 * (1 - 0.6 * hIn)) * 6 * (1 - hIn * 0.6);
    const droop = 8 * prog(t, 11.8, 0.6);
    const cIn = easeOutCubic(prog(t, 12.74, 0.6));
    const cx = lerp(1300, 560, cIn);
    const cBob = Math.sin(l * 12) * 5;
    const GY = 1150;
    const heat = prog(t, 11.2, 0.5);
    let wav = '';
    for (let k = 0; k < 7; k++) {
      const ph = (l * 0.5 + k / 7) % 1;
      const y0 = GY - 60 - ph * 380;
      wav += `<path d="M${120 + k * 120},${fmt(y0)} q20,-18 0,-36 t0,-36" stroke="#ffe0a8" stroke-width="4" fill="none" opacity="${fmt(0.4 * Math.sin(Math.PI * ph) * heat)}"/>`;
    }
    let drops = '';
    for (let k = 0; k < 3; k++) {
      const ph = (l * 1.4 + k / 3) % 1;
      drops += `<path transform="translate(${fmt(hx + 110 + k * 16)} ${fmt(GY - 250 + ph * 70)})" d="M0,-10 C4,-4 6,0 6,4 C6,8 3,10 0,10 C-3,10 -6,8 -6,4 C-6,0 -4,-4 0,-10 Z" fill="${C.sky}" opacity="${fmt(prog(t, 11.7, 0.3) * (1 - ph) * (1 - swap))}"/>`;
    }
    return (
      photo('strangways', { ...STR, zoom: 1.02 + l * 0.02, dim: 0.34, grade: 'gSepia' }) +
      `<rect width="${W}" height="${H}" fill="#6a3000" opacity="${fmt(0.12 + 0.12 * heat)}"/>` +
      `<circle cx="540" cy="790" r="${fmt(260 + 12 * Math.sin(t * 3))}" fill="url(#sunG)" opacity="${fmt(0.85 * heat)}"/>` +
      `<g opacity="${fmt(0.35 * heat)}" transform="translate(540 790) rotate(${fmt(l * 8)})">${Array.from({ length: 16 }, (_, k) => `<path d="M0,0 L${fmt(Math.cos((k / 16) * Math.PI * 2) * 900)},${fmt(Math.sin((k / 16) * Math.PI * 2) * 900)}" stroke="#ffd98a" stroke-width="26" opacity="0.25"/>`).join('')}</g>` +
      wav +
      `<rect x="0" y="${GY}" width="${W}" height="4" fill="${C.goldHi}" opacity="${fmt(0.35 * heat)}"/>` +
      (hIn > 0
        ? `<g transform="translate(${fmt(hx)} ${fmt(GY - 60 * 1.9 + hBob)}) scale(1.9)" opacity="${fmt(1 - swap)}"><g transform="rotate(${fmt(droop)} 60 -40)" fill="${C.cream}" filter="url(#shadow)">${HORSE}</g></g>`
        : '') +
      drops +
      (cIn > 0 ? camelAt(cx, GY, 1.75, { fill: 'url(#goldG)', bob: cBob, filter: 'shadow' }) : '') +
      burst(hx + 40, GY - 20, prog(t, 12.7, 0.8), 24, { r: 200, color: '#e8c89a', size: 8, sy: 0.4, seed: 31 }) +
      `<g transform="translate(${fmt(shake)} 0)">` +
      (slam > 0
        ? `<g opacity="${fmt(cl01(slam * 3))}" transform="translate(540 ${fmt(yy)}) scale(${fmt(sc * ysc)}) translate(-540 ${fmt(-yy)})">
            ${slabText('1860s', 540, yy + 110, 330, { depth: 16, ls: 8 })}
          </g>`
        : '') +
      shock(540, 700, prog(t, 10.38, 0.6), { r: 620, color: C.goldHi, w: 20 }) +
      `</g>`
    );
  }

  // S5 13.20–18.60 · imports: camel string print + sea route from today's India & Pakistan
  function sImport(t, l) {
    const AX = 730;
    const AY = 985;
    const AWID = 440;
    const [ex, ey] = ausProj(121.5, -18.5, AX, AY, AWID);
    const ox = 150;
    const oy = 820;
    const c = [420, 600];
    const route = easeInOutCubic(prog(t, 13.86, 0.6));
    const d = `M${ox},${oy} Q${c[0]},${c[1]} ${fmt(ex)},${fmt(ey)}`;
    const LEN = 700;
    // camel icons stream along the route; rate climbs on "thousands"
    let stream = '';
    let arrived = 0;
    for (let i = 0; i < 46; i++) {
      const born = 14.1 + i * (i < 8 ? 0.16 : 0.075);
      const u = (t - born) / 0.95;
      if (u <= 0) continue;
      if (u >= 1) {
        arrived++;
        continue;
      }
      const e = easeInOutCubic(u);
      const x = qbez(ox, c[0], ex, e);
      const y = qbez(oy, c[1], ey, e);
      stream += camelAt(x - 10, y + 16, 0.2, { fill: C.goldHi, a: Math.min(1, u * 5, (1 - u) * 5) });
    }
    const aus = ausMap(AX, AY, AWID, { draw: easeInOutCubic(prog(t, 13.26, 0.5)), fill: prog(t, 13.5, 0.4), dots: arrived / 46 * 0.45, dotR: 2.2, sw: 4 });
    return (
      blurBack('winton', { dim: 0.5 }) +
      printCard('winton', 540, 380, 940, -1.8, prog(t, 13.2, 0.45), { id: 1 }) +
      aus +
      (route > 0
        ? `<path d="${d}" stroke="${C.goldHi}" stroke-width="5" fill="none" stroke-dasharray="${LEN}" stroke-dashoffset="${fmt(LEN * (1 - route))}" opacity="0.9" filter="url(#glowS)"/>
           <path d="${d}" stroke="#fff" stroke-width="2.5" fill="none" stroke-dasharray="10 16" stroke-dashoffset="${fmt(-l * 60)}" opacity="${fmt(0.8 * route)}"/>`
        : '') +
      stream +
      `<circle cx="${ox}" cy="${oy}" r="${fmt(14 + 3 * Math.sin(t * 6))}" fill="${C.ochre}" stroke="${C.goldHi}" stroke-width="4" opacity="${fmt(prog(t, 13.7, 0.3))}" filter="url(#glowS)"/>` +
      shock(ox, oy, prog(t, 17.0, 0.6), { r: 140, color: C.goldHi, w: 8 }) +
      chip('INDIA', 190, 930, prog(t, 16.98, 0.35), { icon: false, fs: 30 }) +
      chip('PAKISTAN', 250, 1030, prog(t, 17.72, 0.35), { icon: false, fs: 30 })
    );
  }

  // S6 18.60–24.85 · cameleers: archival prints dealt, three origins, "AFGHANS" stamp
  function sAfghans(t, l) {
    const pA = prog(t, 18.6, 0.5);
    const shift = easeInOutCubic(prog(t, 22.9, 0.5));
    const pB = prog(t, 22.96, 0.5);
    const st = prog(t, 23.78, 0.5);
    const shake = st > 0 && st < 0.3 ? Math.sin(l * 80) * 8 * (1 - st / 0.3) : 0;
    const chips = [
      ['AFGHANISTAN', 315, 20.42],
      ['INDIA', 580, 21.44],
      ['PAKISTAN', 808, 22.0],
    ];
    return (
      blurBack('c1891', { dim: 0.55 }) +
      `<g transform="translate(${fmt(shake)} 0)">` +
      printCard('c1891', lerp(540, 470, shift), lerp(560, 520, shift), 700, lerp(2, -3, shift), pA, { id: 2, fromY: 900, h: 830, zoom: 1.0, fy: 0.2 }) +
      printCard('decorated', 640, 800, 660, 4, pB, { id: 3, fromY: 900, spin: -14 }) +
      stamp('AFGHANS', 560, 960, -7, st, { fs: 124 }) +
      burst(560, 960, prog(t, 23.8, 0.6), 30, { r: 360, color: C.stamp, size: 7, seed: 61 }) +
      `</g>` +
      chips.map(([lab, x, at]) => chip(lab, x, 1150, prog(t, at - 0.02, 0.35), { icon: false, fs: 26 })).join('')
    );
  }

  // S7 24.85–26.10 · haul: loaded camel train (Hergott Springs print), load brackets lock on
  function sHaul(t, l) {
    const cx = 540;
    const cy = 640;
    const w = 980;
    const h = (w * 670) / 1024;
    const targets = [
      [0.25, 0.4, 0.14, 0.3, 25.4],
      [0.47, 0.39, 0.1, 0.19, 25.6],
      [0.6, 0.43, 0.09, 0.14, 25.78],
    ];
    let br = '';
    for (const [nx, ny, bw, bh, at] of targets) {
      const p = prog(t, at, 0.3);
      if (p <= 0) continue;
      const e = easeOutBack(p);
      const x = cx - w / 2 + nx * w;
      const y = cy - h / 2 + ny * h;
      const hw = (bw * w) / 2 * lerp(1.6, 1, e);
      const hh = (bh * h) / 2 * lerp(1.6, 1, e);
      const k = 26;
      br += `<g stroke="${C.goldHi}" stroke-width="6" fill="none" opacity="${fmt(cl01(p * 3))}" filter="url(#glowS)">
        <path d="M${fmt(x - hw)},${fmt(y - hh + k)} V${fmt(y - hh)} H${fmt(x - hw + k)} M${fmt(x + hw - k)},${fmt(y - hh)} H${fmt(x + hw)} V${fmt(y - hh + k)}
          M${fmt(x + hw)},${fmt(y + hh - k)} V${fmt(y + hh)} H${fmt(x + hw - k)} M${fmt(x - hw + k)},${fmt(y + hh)} H${fmt(x - hw)} V${fmt(y + hh - k)}"/></g>`;
    }
    return (
      blurBack('hergott', { dim: 0.5 }) +
      printCard('hergott', cx, cy, w, -1.2, prog(t, 24.85, 0.4), { id: 4, tape: false, fromY: 300, spin: 4 }) +
      br
    );
  }

  // S8 26.10–28.15 · railways + telegraph (Hurley, Central Australia): rails glow, wire pulses
  const OT = { zoom: 1.0, fx: 0.5, fy: 0.5 };
  function sWires(t, l) {
    const o = { ...OT, zoom: 1.0 + l * 0.025 };
    const P = (nx, ny) => photoPt('otRail', o, nx, ny);
    const [vx, vy] = P(0.715, 0.33);
    const [l1x, l1y] = P(0.35, 1.0);
    const [r1x, r1y] = P(0.97, 0.78);
    const rail = easeInOutCubic(prog(t, 26.2, 0.7));
    const wire = easeInOutCubic(prog(t, 27.15, 0.55));
    const poles = [P(0.14, 0.205), P(0.572, 0.293), P(0.635, 0.307), P(0.667, 0.314), P(0.69, 0.319), [vx, vy]];
    let wd = `M${fmt(poles[0][0])},${fmt(poles[0][1])}`;
    for (let i = 1; i < poles.length; i++) {
      const [ax, ay] = poles[i - 1];
      const [bx, by] = poles[i];
      wd += ` Q${fmt((ax + bx) / 2)},${fmt((ay + by) / 2 + 22 / i)} ${fmt(bx)},${fmt(by)}`;
    }
    const WL = 900;
    let pulses = '';
    if (wire > 0.9) {
      for (let k = 0; k < 4; k++) {
        const u = ((((t - 27.6) * 0.9 + k / 4) % 1) + 1) % 1;
        const i = Math.min(poles.length - 2, Math.floor(u * (poles.length - 1)));
        const f = u * (poles.length - 1) - i;
        const [ax, ay] = poles[i];
        const [bx, by] = poles[i + 1];
        pulses += `<circle cx="${fmt(lerp(ax, bx, f))}" cy="${fmt(lerp(ay, by, f) + (22 / (i + 1)) * 2 * f * (1 - f))}" r="${fmt(9 - i)}" fill="#fff" filter="url(#glow)"/>`;
      }
    }
    // rails: trace from horizon toward viewer, clipped above the caption band
    const railPath = (bx, by) => `M${fmt(vx)},${fmt(vy)} L${fmt(bx)},${fmt(by)}`;
    const RL = 1500;
    return (
      photo('otRail', { ...o, dim: 0.3, grade: 'gSepia' }) +
      `<clipPath id="railClip"><rect x="0" y="0" width="${W}" height="1210"/></clipPath>` +
      `<g clip-path="url(#railClip)" opacity="${fmt(cl01(rail * 3))}">
        <path d="${railPath(l1x, l1y)}" stroke="${C.goldHi}" stroke-width="7" stroke-dasharray="${RL}" stroke-dashoffset="${fmt(RL * (1 - rail))}" filter="url(#glowS)"/>
        <path d="${railPath(r1x, r1y)}" stroke="${C.goldHi}" stroke-width="7" stroke-dasharray="${RL}" stroke-dashoffset="${fmt(RL * (1 - rail))}" filter="url(#glowS)"/>
      </g>` +
      `<circle cx="${fmt(vx)}" cy="${fmt(vy)}" r="${fmt(20 + 6 * Math.sin(t * 6))}" fill="${C.goldHi}" opacity="${fmt(0.8 * rail)}" filter="url(#glow)"/>` +
      (wire > 0 ? `<path d="${wd}" stroke="${C.sky}" stroke-width="5" fill="none" stroke-dasharray="${WL}" stroke-dashoffset="${fmt(WL * (1 - wire))}" filter="url(#glowS)"/>` : '') +
      pulses +
      poles.slice(0, 5).map(([x, y], i) => `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(8 - i)}" fill="${C.sky}" opacity="${fmt(prog(t, 27.15 + i * 0.1, 0.2))}" filter="url(#glowS)"/>`).join('') +
      chip('OVERLAND TELEGRAPH', 540, 230, prog(t, 27.2, 0.4), { fs: 30, accent: C.sky })
    );
  }

  // S9 28.15–30.05 · ADELAIDE → DARWIN: archival telegraph-line map card, route glows north
  const MAPC = { sx: 300, sy: 10, sw: 340, sh: 570, top: 250, h: 880 };
  const OTLINE = [
    [518, 545], [512, 520], [510, 488], [520, 442], [500, 425], [484, 413], [465, 381], [455, 340], [440, 320], [430, 297], [428, 270],
    [426, 243], [436, 198], [425, 168], [422, 128], [405, 105], [392, 87], [375, 65], [362, 45],
  ];
  function sRoute(t, l) {
    const k = MAPC.h / MAPC.sh;
    const cw = MAPC.sw * k;
    const left = 540 - cw / 2;
    const P = ([px, py]) => [left + (px - MAPC.sx) * k, MAPC.top + (py - MAPC.sy) * k];
    const pts = OTLINE.map(P);
    let d = `M${fmt(pts[0][0])},${fmt(pts[0][1])}`;
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      d += ` L${fmt(pts[i][0])},${fmt(pts[i][1])}`;
      len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    const card = prog(t, 28.15, 0.45);
    const draw = easeInOutCubic(prog(t, 28.45, 0.8));
    // train dot position along the route
    let acc = 0;
    const target = draw * len;
    let tx = pts[0][0];
    let ty = pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + seg >= target) {
        const f = (target - acc) / seg;
        tx = lerp(pts[i - 1][0], pts[i][0], f);
        ty = lerp(pts[i - 1][1], pts[i][1], f);
        break;
      }
      acc += seg;
      tx = pts[i][0];
      ty = pts[i][1];
    }
    const [ax, ay] = pts[0];
    const [dx, dy] = pts[pts.length - 1];
    const ce = easeOutCubic(card);
    const zoom = 1 + l * 0.02;
    return (
      blurBack('alice', { dim: 0.5, zoom: 1.2 }) +
      `<g transform="translate(540 ${fmt(MAPC.top + MAPC.h / 2)}) scale(${fmt(zoom * lerp(0.85, 1, ce))}) rotate(${fmt((1 - ce) * -6)}) translate(-540 ${fmt(-(MAPC.top + MAPC.h / 2))})" opacity="${fmt(cl01(card * 3))}">
        <rect x="${fmt(left - 22)}" y="${MAPC.top - 22}" width="${fmt(cw + 44)}" height="${MAPC.h + 44}" fill="${C.paper}" filter="url(#shadow)"/>
        <svg x="${fmt(left)}" y="${MAPC.top}" width="${fmt(cw)}" height="${MAPC.h}" viewBox="${MAPC.sx} ${MAPC.sy} ${MAPC.sw} ${MAPC.sh}" preserveAspectRatio="none">
          <image href="${IMG.otMap.u}" width="821" height="652" filter="url(#gMap)"/>
        </svg>
        <rect x="${fmt(left)}" y="${MAPC.top}" width="${fmt(cw)}" height="${MAPC.h}" fill="url(#printVig)"/>
        <path d="${d}" stroke="${C.ochre}" stroke-width="16" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity="0.35" stroke-dasharray="${fmt(len)}" stroke-dashoffset="${fmt(len * (1 - draw))}"/>
        <path d="${d}" stroke="${C.goldHi}" stroke-width="7" fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${fmt(len)}" stroke-dashoffset="${fmt(len * (1 - draw))}" filter="url(#glowS)"/>
        ${draw > 0 ? `<circle cx="${fmt(tx)}" cy="${fmt(ty)}" r="${fmt(15 + 3 * Math.sin(t * 9))}" fill="#fff" filter="url(#glow)"/>` : ''}
        ${pin(ax, ay, prog(t, 28.38, 0.6), { s: 0.8 })}
        ${pin(dx, dy, prog(t, 29.0, 0.6), { s: 0.8, fill: C.ochre })}
        ${tag('ADELAIDE', ax - 70, ay + 10, prog(t, 28.45, 0.3), C.goldHi, { anchor: 'end', fs: 32 })}
        ${tag('DARWIN', dx - 60, dy + 4, prog(t, 29.05, 0.3), C.goldHi, { anchor: 'end', fs: 32 })}
      </g>` +
      shock(dx, dy, prog(t, 29.1, 0.6), { r: 180, color: C.goldHi, w: 8 }) +
      chip('ADELAIDE–DARWIN', 540, 140, prog(t, 28.5, 0.4), { fs: 32 })
    );
  }

  // S10 30.05–33.45 · THE GHAN livery panel: sheen on the name, logo ring, soft "widely said", link to cameleers
  const PAN = { x: 40, y: 250, w: 1000, h: 580, sx: 58, sy: 360, sw: 1248, sh: 724 };
  function sGhan(t, l) {
    const zoom = 1 + l * 0.03;
    const vw = PAN.sw / zoom;
    const vh = PAN.sh / zoom;
    const vx = PAN.sx + (PAN.sw - vw) * 0.55;
    const vy = PAN.sy + (PAN.sh - vh) * 0.5;
    const toScreen = (nx, ny) => [PAN.x + ((nx * 1920 - vx) / vw) * PAN.w, PAN.y + ((ny * 1440 - vy) / vh) * PAN.h];
    const [gx, gy] = toScreen(0.426, 0.49);
    const p = prog(t, 30.05, 0.45);
    const e = easeOutCubic(p);
    const sheen = prog(t, 30.25, 0.7);
    const ring = prog(t, 30.4, 0.5);
    const med = prog(t, 32.0, 0.4);
    const link = easeInOutCubic(prog(t, 32.22, 0.7));
    const mx = 230;
    const my = 1040;
    const d = `M${mx + 80},${my - 80} C${mx + 260},${my - 260} ${fmt(gx - 60)},${fmt(gy + 240)} ${fmt(gx)},${fmt(gy + 70)}`;
    const LEN = 800;
    return (
      blurBack('carriage', { dim: 0.55 }) +
      `<g transform="translate(0 ${fmt((1 - e) * 120)})" opacity="${fmt(cl01(p * 3))}">
        <rect x="${PAN.x - 8}" y="${PAN.y - 8}" width="${PAN.w + 16}" height="${PAN.h + 16}" rx="22" fill="none" stroke="url(#ringG)" stroke-width="6" filter="url(#shadow)"/>
        <clipPath id="panC"><rect x="${PAN.x}" y="${PAN.y}" width="${PAN.w}" height="${PAN.h}" rx="16"/></clipPath>
        <g clip-path="url(#panC)">
          <svg x="${PAN.x}" y="${PAN.y}" width="${PAN.w}" height="${PAN.h}" viewBox="${fmt(vx)} ${fmt(vy)} ${fmt(vw)} ${fmt(vh)}" preserveAspectRatio="none">
            <image href="${IMG.carriage.u}" width="1920" height="1440"/>
          </svg>
          <rect x="${fmt(PAN.x - 300 + 1600 * sheen)}" y="${PAN.y}" width="200" height="${PAN.h}" fill="url(#sheen)" opacity="${fmt(Math.sin(Math.PI * sheen))}" transform="skewX(-18)"/>
        </g>
      </g>` +
      (ring > 0
        ? `<circle cx="${fmt(gx)}" cy="${fmt(gy)}" r="${fmt(lerp(200, 86, easeOutCubic(ring)) + 5 * Math.sin(t * 6))}" fill="none" stroke="${C.goldHi}" stroke-width="6" opacity="${fmt(cl01(ring * 2))}" filter="url(#glowS)"/>`
        : '') +
      burst(gx, gy, prog(t, 30.4, 0.8), 24, { r: 200, seed: 77 }) +
      chip('widely said', 760, 950, prog(t, 31.14, 0.35), { icon: false, italic: true, fs: 40, color: C.goldHi, w: 330 }) +
      (link > 0
        ? `<path d="${d}" stroke="${C.goldHi}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${LEN}" stroke-dashoffset="${fmt(LEN * (1 - link))}" filter="url(#glowS)"/>`
        : '') +
      medallion('c1891', mx, my, 120, med, { iw: 520, fx: 0.16, fy: 0.55, id: 2 }) +
      shock(gx, gy, prog(t, 32.9, 0.6), { r: 200, color: C.goldHi, w: 8 })
    );
  }

  // S11 33.45–35.10 · trucks replace them: 1920s lorry rolls in, the camel string walks off
  function sTrucks(t, l) {
    const GY = 1110;
    const tIn = easeOutCubic(prog(t, 33.6, 0.75));
    const trx = lerp(1350, 700, tIn);
    const brake = prog(t, 34.3, 0.2);
    const off = easeInCubic(prog(t, 34.1, 0.9));
    let camels = '';
    [0, 1, 2].forEach((i) => {
      const x = 130 + i * 175 - off * 760;
      camels += camelAt(x, GY, 0.62, { fill: C.gold, bob: Math.sin(l * 10 + i) * 3 * (off > 0 ? 1 : 0.3), a: 1 - off * 0.6, filter: 'shadow' });
    });
    let speed = '';
    if (tIn < 1) {
      for (let k = 0; k < 5; k++) {
        speed += `<rect x="${fmt(trx + 190 + k * 20)}" y="${GY - 150 + k * 26}" width="${fmt(160 * (1 - tIn))}" height="4" fill="${C.cream}" opacity="${fmt(0.6 * (1 - tIn))}"/>`;
      }
    }
    return (
      blurBack('birdsville', { dim: 0.5 }) +
      printCard('birdsville', 540, 440, 960, 1.5, prog(t, 33.45, 0.4), { id: 5, fromY: 300, spin: -5 }) +
      `<rect x="40" y="${GY}" width="1000" height="6" rx="3" fill="${C.goldHi}" opacity="0.55"/>` +
      `<path d="M40,${GY + 22} H1040" stroke="${C.goldHi}" stroke-width="3" stroke-dasharray="30 26" opacity="0.35"/>` +
      camels +
      speed +
      `<g transform="translate(${fmt(trx)} ${fmt(GY - 40 * 1.25 - brake * (1 - brake) * 10)}) scale(1.25)" fill="${C.cream}" filter="url(#shadow)">${TRUCK}</g>` +
      burst(trx + 150, GY - 10, prog(t, 34.0, 0.9), 22, { r: 180, color: '#e8c89a', size: 9, sy: 0.35, seed: 88 })
    );
  }

  // S12 35.10–36.70 · set free: stock gate swings open on a lone feral camel (gradual, no one-day stamp)
  const NH = { zoom: 1.0, fx: 0.46, fy: 0.5 };
  function gateLeaf(hx, dir, open, top, bot) {
    // dir: +1 leaf extends right from hinge, -1 extends left
    const len = 470;
    const sx = Math.cos(open * 1.35);
    const rails = [0, 0.33, 0.66, 1].map((f) => {
      const y = lerp(top + 20, bot - 20, f);
      return `<rect x="0" y="${fmt(y - 9)}" width="${len}" height="18" rx="4" fill="url(#wood)" stroke="#3a220b" stroke-width="2"/>`;
    }).join('');
    const brace = `<path d="M10,${bot - 30} L${len - 10},${top + 30}" stroke="#6a4020" stroke-width="16"/>`;
    const stile = `<rect x="${len - 22}" y="${top}" width="22" height="${bot - top}" fill="url(#wood)" stroke="#3a220b" stroke-width="2"/>`;
    return `<g transform="translate(${hx} 0) scale(${fmt(dir * sx)} 1)" filter="url(#shadow)">${brace}${rails}${stile}</g>`;
  }
  function sFree(t, l) {
    const open = easeInOutCubic(prog(t, 35.62, 0.9));
    const top = 700;
    const bot = 1150;
    const flare = prog(t, 36.0, 0.6);
    return (
      photo('newhaven', { ...NH, zoom: 1.12 - l * 0.03, dim: 0.28 - 0.1 * open, grade: 'gWarm' }) +
      `<circle cx="760" cy="420" r="${fmt(300 + 60 * flare)}" fill="url(#sunG)" opacity="${fmt(0.55 * flare)}"/>` +
      particlesDust(l, 30, 17, { speed: 18, alpha: 0.4 * (0.4 + open) }) +
      `<rect x="44" y="${top - 30}" width="30" height="${bot - top + 60}" fill="#5a3616" filter="url(#shadow)"/>` +
      `<rect x="1006" y="${top - 30}" width="30" height="${bot - top + 60}" fill="#5a3616" filter="url(#shadow)"/>` +
      gateLeaf(70, 1, open, top, bot) +
      gateLeaf(1010, -1, open, top, bot)
    );
  }

  // S13 36.70–38.95 · today: the map fills with the feral herd → OVER A MILLION reprise
  const OB = { zoom: 1.0, fx: 0.55, fy: 0.5 };
  function sMillion(t, l) {
    const dots = easeInOutCubic(prog(t, 36.9, 1.3));
    const slam = prog(t, 38.14, 0.3);
    const sc = slam > 0 ? lerp(2.2, 1, easeOutCubic(slam)) : 2.2;
    const shake = slam > 0 && slam < 1 ? Math.sin(l * 90) * 9 * (1 - slam) : 0;
    const pulse = 1 + 0.02 * Math.sin((t - 38.14) * 12) * prog(t, 38.14, 0.2) * (1 - prog(t, 38.8, 0.3));
    return (
      photo('outback', { ...OB, zoom: 1.04 + l * 0.02, dim: 0.58, grade: 'gWarm' }) +
      `<g transform="translate(${fmt(shake)} 0)">` +
      `<g transform="translate(540 850) scale(${fmt(pulse * lerp(0.92, 1, easeOutCubic(prog(t, 36.7, 0.5))))}) translate(-540 -850)">${ausMap(540, 850, 780, { draw: easeInOutCubic(prog(t, 36.7, 0.45)), fill: 1, dots, dotR: 2.8, a: cl01(prog(t, 36.7, 0.2) * 2) })}</g>` +
      shock(540, 850, slam, { r: 700, color: C.goldHi, w: 20 }) +
      (slam > 0
        ? `<g opacity="${fmt(cl01(slam * 3))}" transform="translate(540 320) scale(${fmt(sc)}) translate(-540 -320)">${slabText('OVER A MILLION', 540, 370, 142, { depth: 10, ls: 4 })}</g>`
        : '') +
      `</g>` +
      burst(540, 320, prog(t, 38.14, 0.8), 36, { r: 520, seed: 140, size: 8, sy: 0.5 })
    );
  }

  // S14 38.95–42.05 · Australia now exports camels → shipping tag types SAUDI ARABIA
  const MU = { zoom: 1.0, fx: 0.3, fy: 0.45 };
  function sExport(t, l) {
    const drop = prog(t, 39.6, 0.6);
    const dy = lerp(-700, 0, easeOutBack(drop));
    const sw = Math.sin((t - 39.6) * 4.2) * 9 * Math.exp(-(t - 39.6) * 0.9) * (drop > 0 ? 1 : 0) + Math.sin(t * 1.6) * 1.2;
    const dest = 'SAUDI ARABIA';
    const n = Math.floor(dest.length * prog(t, 41.02, 0.72));
    const typed = dest.slice(0, n);
    const caret = n < dest.length && t > 40.9 && Math.floor(t * 6) % 2 === 0;
    const hookX = 560;
    const tagY = 520;
    const wob = prog(t, 41.75, 0.35);
    return (
      photo('muster', { ...MU, zoom: 1.04 + l * 0.02, dim: 0.45, grade: 'gWarm' }) +
      (drop > 0
        ? `<g transform="translate(${hookX} ${fmt(dy)}) rotate(${fmt(sw)})">
            <path d="M0,0 C6,120 -6,240 0,${tagY - 190}" stroke="#e9dcbc" stroke-width="5" fill="none"/>
            <g transform="translate(0 ${tagY}) rotate(${fmt(4 * Math.sin(Math.PI * wob))})" filter="url(#shadow)">
              <path d="M-150,-160 L-90,-222 L90,-222 L150,-160 L150,240 L-150,240 Z" fill="url(#tagG)" stroke="#8a6a3a" stroke-width="3"/>
              <circle cx="0" cy="-${190}" r="18" fill="#6a4a24"/><circle cx="0" cy="-${190}" r="11" fill="${C.ink}"/>
              <rect x="-150" y="-150" width="300" height="72" fill="${C.stamp}"/>
              <text y="-100" text-anchor="middle" font-family="${F.anton}" font-size="54" letter-spacing="10" fill="${C.cream}">EXPORT</text>
              <text x="-128" y="-30" font-family="${F.mont}" font-weight="800" font-size="20" letter-spacing="4" fill="#6a4a24">CARGO</text>
              <g transform="translate(0 40)">${camelAt(-10, 26, 0.55, { fill: '#3a2408' })}</g>
              <line x1="-130" y1="110" x2="130" y2="110" stroke="#6a4a24" stroke-width="2"/>
              <text x="-128" y="148" font-family="${F.mont}" font-weight="800" font-size="20" letter-spacing="4" fill="#6a4a24">TO</text>
              <text x="0" y="200" text-anchor="middle" font-family="${F.anton}" font-size="44" letter-spacing="1" fill="#2a1a08">${esc(typed)}${caret ? '|' : ''}</text>
              <line x1="-130" y1="218" x2="130" y2="218" stroke="#6a4a24" stroke-width="2"/>
            </g>
          </g>`
        : '') +
      chip('AUSTRALIA', 540, 1150, prog(t, 39.08, 0.35), { fs: 30 })
    );
  }

  // S15 42.05–43.008 · "So yes." incomplete loop — whip back; OVER A MILLION lands on frame-1 framing
  function sLoop(t, l) {
    const z = lerp(HK.zoom + 0.05, HK.zoom, easeOutCubic(prog(t, 42.05, DUR - 42.05)));
    const cardP = prog(t, 42.36, 0.5);
    const s = lerp(1.7, 1.06, easeOutCubic(cardP));
    return (
      photo('herd', { ...HK, zoom: z, dim: 0.22, grade: 'gPop' }) +
      `<rect width="${W}" height="${H}" fill="url(#spot)" opacity="0.3" transform="translate(0 -320)"/>` +
      particlesDust(t - DUR, 40, 3, { speed: 22, alpha: 0.45 }) +
      hookCard(s, cl01(cardP * 1.6), 0)
    );
  }

  const SCENES = [
    { id: 'hook', start: 0.0, end: 2.5, draw: sHook },
    { id: 'where', start: 2.5, end: 5.75, draw: sWhere, tin: { type: 'whip', d: 0.3 } },
    { id: 'tease', start: 5.75, end: 10.15, draw: sTease, tin: { type: 'flash', d: 0.3 } },
    { id: 'year', start: 10.15, end: 13.2, draw: sYear, tin: { type: 'whip', d: 0.25 } },
    { id: 'import', start: 13.2, end: 18.6, draw: sImport, tin: { type: 'fade', d: 0.3 } },
    { id: 'afghans', start: 18.6, end: 24.85, draw: sAfghans, tin: { type: 'whip', d: 0.3 } },
    { id: 'haul', start: 24.85, end: 26.1, draw: sHaul, tin: { type: 'fade', d: 0.25 } },
    { id: 'wires', start: 26.1, end: 28.15, draw: sWires, tin: { type: 'whip', d: 0.25 } },
    { id: 'route', start: 28.15, end: 30.05, draw: sRoute, tin: { type: 'zoom', d: 0.35, cx: 850, cy: 640 } },
    { id: 'ghan', start: 30.05, end: 33.45, draw: sGhan, tin: { type: 'flash', d: 0.28 } },
    { id: 'trucks', start: 33.45, end: 35.1, draw: sTrucks, tin: { type: 'whip', d: 0.28 } },
    { id: 'free', start: 35.1, end: 36.7, draw: sFree, tin: { type: 'fade', d: 0.3 } },
    { id: 'million', start: 36.7, end: 38.95, draw: sMillion, tin: { type: 'flash', d: 0.25 } },
    { id: 'export', start: 38.95, end: 42.05, draw: sExport, tin: { type: 'whip', d: 0.28 } },
    { id: 'loop', start: 42.05, end: DUR, draw: sLoop, tin: { type: 'whip', d: 0.28 } },
  ];

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
      if (cur.length && (cur.length >= 4 || chars > 19)) flush();
      cur.push(w);
      if (/[.?!,…]$/.test(w.word)) flush();
    }
    flush();
    return groups.map((g) => ({ words: g, start: g[0].start, end: g[g.length - 1].end }));
  }
  function captions(t, ep) {
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
    const fs = Math.min(70, 880 / (txt.length * 0.74));
    const spans = g.words
      .map((w, k) => {
        const active = t >= w.start - 0.03 && (t < w.end + 0.08 || (k === g.words.length - 1 && t >= w.start));
        const said = t >= w.end;
        const fill = active ? C.goldHi : said ? '#ffffff' : 'rgba(255,255,255,0.92)';
        return `<tspan fill="${fill}">${esc(w.word.toUpperCase())}${k < g.words.length - 1 ? ' ' : ''}</tspan>`;
      })
      .join('');
    return `<g transform="translate(540 ${CAP_Y}) scale(${fmt(0.85 + 0.15 * pop)})" opacity="${fmt(cl01(pop * 2))}">
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
    const gx = Math.floor(rand(Math.floor(t * 30)) * 384);
    const gy = Math.floor(rand(Math.floor(t * 30) + 0.5) * 384);
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      ${defs()}
      <rect width="${W}" height="${H}" fill="${C.ink}"/>
      ${composite(t)}
      <rect y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="url(#botShade)" opacity="0.8"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W + 384}" height="${H + 384}" fill="url(#grainP)" opacity="0.07" transform="translate(${-gx} ${-gy})" style="mix-blend-mode:overlay"/>
      ${captions(t, ep)}
    </svg>`;
  };
})();
