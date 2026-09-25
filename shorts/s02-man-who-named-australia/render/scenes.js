/* s02-man-who-named-australia — Checkpoint C + quiet quality pass (Trim statue / Port Louis / MG)
   Every beat: stillLayer photo underlay + SVG motion overlays.
   On-screen text ONLY: names / places / key facts / plate / short hook.
   Captions carry spoken words (transcript.json). No Remotion. */
(function () {
  const IMG = {
    portrait: '/img/s02_01_matthew_flinders.jpg',
    portraitAlt: '/img/s02_02_flinders_general.jpg',
    investigator: '/img/s02_03_hms_investigator.jpg',
    trimStatue: '/img/s02_04_trim_cat_statue.jpg',
    // s02_05_black_cat.jpg REJECTED (AI heterochromic eyes) — Trim beat uses statue
    mauritius: '/img/s02_06_mauritius_coast.jpg', // Port Louis harbour (replaced lonely tree)
    voyageBook: '/img/s02_07_voyage_terra.jpg',
    euston: '/img/s02_08_euston_station.jpg',
    dig: '/img/s02_09_archaeological.jpg',
    village: '/img/s02_10_english_village.jpg',
  };

  function label(text, x, y, scale, opacity, opts) {
    opts = opts || {};
    const fill = opts.fill || '#f5c842';
    const size = opts.size || 34;
    const color = opts.color || '#fff';
    const w = opts.w || Math.max(160, text.length * (size * 0.58) + 48);
    const h = opts.h || size + 28;
    if (opacity <= 0.01) return '';
    return `<g opacity="${opacity}" transform="translate(${x} ${y}) scale(${Math.max(scale, 0.01)}) translate(${-w / 2} ${-h / 2})">
      <rect width="${w}" height="${h}" rx="12" fill="rgba(8,10,18,0.82)" stroke="${fill}" stroke-width="3"/>
      <text x="${w / 2}" y="${h / 2 + size * 0.35}" text-anchor="middle"
        font-family="Arial Black, Helvetica, sans-serif" font-size="${size}" font-weight="900"
        fill="${color}" stroke="#000" stroke-width="5" paint-order="stroke">${text}</text>
    </g>`;
  }

  // 0–7.0 Euston underlay + short 200 YEARS slam
  function hookSlam(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, easeOutCubic } = hs;
    const slam = easeOutBack(clamp(local / 0.45, 0, 1));
    const pulse = 1 + 0.03 * Math.sin(local * 7);
    const fade = local > 5.8 ? clamp((7 - local) / 1.0, 0, 1) : 1;
    const persp = 1 + local * 0.012;
    return (
      stillLayer(IMG.euston, {
        dim: 0.55,
        scale: 1.14 + local * 0.006,
        driftX: Math.sin(local * 0.35) * 10,
        driftY: local * 2.2,
      }) +
      `<g opacity="${fade}" transform="translate(540 480) scale(${slam * pulse * persp}) translate(-540 -480)">
        <rect x="160" y="380" width="760" height="200" rx="24" fill="rgba(10,10,20,0.78)"
          stroke="#f5c842" stroke-width="5"/>
        <text x="540" y="510" text-anchor="middle"
          font-family="Arial Black, Helvetica, sans-serif" font-size="92" font-weight="900"
          fill="#f5c842" stroke="#000" stroke-width="10" paint-order="stroke">200 YEARS</text>
      </g>`
    );
  }

  // 7.0–12.3 Investigator underlay + ship orbit / Australia path
  function circumnavigate(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic, easeOutBack } = hs;
    const enter = easeOutCubic(clamp(local / 0.45, 0, 1));
    const angle = local * 48;
    const cx = 540;
    const cy = 980;
    const rx = 300;
    const ry = 150;
    const rad = (angle * Math.PI) / 180;
    const sx = cx + Math.cos(rad) * rx;
    const sy = cy + Math.sin(rad) * ry;
    const nameIn = easeOutBack(clamp((local - 0.4) / 0.4, 0, 1));
    const auIn = easeOutCubic(clamp((local - 1.6) / 0.4, 0, 1));
    const badgeIn = easeOutBack(clamp((local - 3.6) / 0.4, 0, 1));
    let wake = '';
    for (let i = 0; i < 10; i++) {
      const a = rad - i * 0.18;
      const wx = cx + Math.cos(a) * (rx - i * 8);
      const wy = cy + Math.sin(a) * (ry - i * 4);
      wake += `<ellipse cx="${wx}" cy="${wy}" rx="${14 + i * 3}" ry="${5 + i}" fill="#b3e5fc" opacity="${0.35 * (1 - i / 10)}"/>`;
    }
    return (
      stillLayer(IMG.investigator, {
        dim: 0.48,
        scale: 1.12 + local * 0.004,
        driftX: Math.sin(local * 0.5) * 6,
      }) +
      `<g opacity="${enter}">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none"
          stroke="rgba(120,200,255,0.75)" stroke-width="4" stroke-dasharray="14 10"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.55}" ry="${ry * 0.55}" fill="none"
          stroke="rgba(120,200,255,0.3)" stroke-width="2"/>
        <!-- Australia blob -->
        <ellipse cx="${cx}" cy="${cy}" rx="88" ry="72" fill="#2e7d32" opacity="0.55" stroke="#a5d6a7" stroke-width="3"/>
        ${wake}
        <g transform="translate(${sx} ${sy}) rotate(${angle + 90})">
          <path d="M-40,8 L-28,22 L28,22 L40,8 Z" fill="#5d4037" stroke="#2a1810" stroke-width="2"/>
          <rect x="-4" y="-34" width="8" height="42" fill="#3e2723"/>
          <path d="M0,-34 L0,-6 L28,-6 Z" fill="#f5f0e0" stroke="#bbb" stroke-width="1"/>
        </g>
        ${label('Matthew Flinders', 540, 280, Math.max(nameIn, 0.01), nameIn, { fill: '#c9a227', size: 32, w: 360 })}
        ${label('Australia', 540, 360, Math.max(auIn, 0.01), auIn, { fill: '#66bb6a', size: 36, w: 240 })}
        ${label('Investigator', 540, 1180, Math.max(badgeIn, 0.01), badgeIn * (local < 5 ? 1 : clamp((5.3 - local) / 0.3, 0, 1)), { fill: '#90caf9', size: 28, w: 280 })}
      </g>`
    );
  }

  // 12.3–16.3 Trim commemorative statue underlay + kinetic badge
  function trimFriend(t, local, hs) {
    const { stillLayer, clamp, easeOutBack } = hs;
    const pop = easeOutBack(clamp(local / 0.5, 0, 1));
    let hearts = '';
    if (local > 1.2) {
      for (let i = 0; i < 5; i++) {
        const hx = 700 + Math.sin(local * 2 + i) * 40 + i * 28;
        const hy = 900 - ((local - 1.2) * 80 + i * 50) % 280;
        const op = 0.35 + 0.25 * Math.sin(local * 3 + i);
        hearts += `<text x="${hx}" y="${hy}" font-size="${18 + i * 3}" fill="#ff8a80" opacity="${op}">♥</text>`;
      }
    }
    // Zoom toward Trim (bronze cat at Flinders' left / viewer-right of pedestal)
    return (
      stillLayer(IMG.trimStatue, {
        dim: 0.38,
        scale: 1.42 + local * 0.008,
        driftX: 70 + Math.sin(local * 0.6) * 6,
        driftY: 40 + Math.sin(local * 0.8) * 5,
      }) +
      `<g>
        ${label('Trim', 540, 300, Math.max(pop, 0.01), pop, { fill: '#f5c842', size: 48, w: 200 })}
        ${hearts}
      </g>`
    );
  }

  // 16.3–24.2 Port Louis harbour + designed bars slam + dim vignette
  function prisonMauritius(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic, easeOutBack, easeOutElastic } = hs;
    const barsT = easeOutCubic(clamp(local / 0.55, 0, 1));
    const punch = local > 1.4 && local < 2.2 ? clamp((local - 1.4) / 0.35, 0, 1) : 0;
    const shake = punch > 0 ? Math.sin(local * 42) * (1 - punch) * 14 : 0;
    const placeIn = easeOutBack(clamp((local - 0.6) / 0.4, 0, 1));
    const yearsIn = easeOutElastic(clamp((local - 3.2) / 0.55, 0, 1));
    const y0 = -280 + barsT * 280;
    const vig = 0.25 + barsT * 0.62;
    let bars = '';
    for (let i = 0; i < 9; i++) {
      const x = 90 + i * 110 + shake * (i % 2 ? -0.7 : 1);
      bars += `<g>
        <rect x="${x}" y="${y0}" width="38" height="1040" rx="4" fill="#0d1118"/>
        <rect x="${x + 2}" y="${y0}" width="12" height="1040" fill="#7b8fa8" opacity="0.7"/>
        <rect x="${x + 14}" y="${y0}" width="10" height="1040" fill="#3a4558" opacity="0.9"/>
        <rect x="${x + 28}" y="${y0}" width="6" height="1040" fill="#000" opacity="0.75"/>
        <ellipse cx="${x + 19}" cy="${y0 + 90}" rx="9" ry="6" fill="#c5d0e0" opacity="0.55"/>
        <ellipse cx="${x + 19}" cy="${y0 + 520}" rx="9" ry="6" fill="#c5d0e0" opacity="0.5"/>
        <ellipse cx="${x + 19}" cy="${y0 + 920}" rx="9" ry="6" fill="#c5d0e0" opacity="0.45"/>
      </g>`;
    }
    return (
      stillLayer(IMG.mauritius, {
        dim: 0.45 + barsT * 0.14,
        scale: 1.14 + punch * 0.05,
        driftX: shake * 0.4,
      }) +
      `<defs>
        <radialGradient id="prisonVig" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stop-color="#000" stop-opacity="0"/>
          <stop offset="40%" stop-color="#000" stop-opacity="${vig * 0.2}"/>
          <stop offset="100%" stop-color="#000" stop-opacity="${vig}"/>
        </radialGradient>
        <linearGradient id="barRail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8a9bb0"/>
          <stop offset="35%" stop-color="#3d4a5c"/>
          <stop offset="100%" stop-color="#121820"/>
        </linearGradient>
        <linearGradient id="lockFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#9aa8bc"/>
          <stop offset="100%" stop-color="#2a3340"/>
        </linearGradient>
      </defs>
      <g transform="translate(${shake * 0.3} 0)">
        <rect x="0" y="0" width="1080" height="1920" fill="url(#prisonVig)"/>
        <!-- side wall shadows -->
        <rect x="0" y="0" width="70" height="1920" fill="#000" opacity="${0.35 * barsT}"/>
        <rect x="1010" y="0" width="70" height="1920" fill="#000" opacity="${0.35 * barsT}"/>
        <rect x="50" y="${y0 - 56}" width="980" height="58" rx="5" fill="url(#barRail)" stroke="#05070a" stroke-width="3"/>
        <rect x="50" y="${y0 - 50}" width="980" height="10" fill="#d0d8e4" opacity="0.28"/>
        <rect x="50" y="${y0 + 990}" width="980" height="50" rx="5" fill="url(#barRail)" stroke="#05070a" stroke-width="3"/>
        ${bars}
        <!-- lock plate slam accent -->
        <g opacity="${barsT}" transform="translate(540 ${y0 + 560}) scale(${0.85 + barsT * 0.2})">
          <rect x="-48" y="-60" width="96" height="120" rx="8" fill="url(#lockFace)" stroke="#0a0c10" stroke-width="3"/>
          <circle cx="0" cy="-10" r="16" fill="none" stroke="#1a202c" stroke-width="5"/>
          <rect x="-6" y="6" width="12" height="40" rx="3" fill="#1a202c"/>
        </g>
        ${label('Mauritius', 540, 230, Math.max(placeIn, 0.01), placeIn, { fill: '#80cbc4', size: 36, w: 260 })}
        ${label('6½ years', 540, 1180, Math.max(yearsIn, 0.01), yearsIn, { fill: '#ef5350', size: 42, w: 260 })}
      </g>`
    );
  }

  // 24.2–33.2 Portrait / voyage book + AUSTRALIA stamp + July 1814
  function nameAustralia(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, easeOutCubic } = hs;
    const under = local < 4.5 ? IMG.portrait : IMG.voyageBook;
    const dim = local < 4.5 ? 0.45 : 0.5;
    const nameIn = easeOutCubic(clamp(local / 0.45, 0, 1));
    const stampT = clamp((local - 3.5) / 0.4, 0, 1);
    const stampScale = stampT > 0 ? easeOutBack(stampT) : 0;
    const dateIn = easeOutBack(clamp((local - 5.8) / 0.4, 0, 1));
    // book page prop
    const page = easeOutCubic(clamp((local - 2.2) / 0.5, 0, 1));
    return (
      stillLayer(under, {
        dim,
        scale: 1.1 + local * 0.003,
        driftY: Math.sin(local * 0.4) * 6,
      }) +
      `<g>
        ${label('Matthew Flinders', 540, 260, Math.max(nameIn, 0.01), nameIn * (local < 4 ? 1 : clamp((4.5 - local) / 0.4, 0, 1)), { fill: '#c9a227', size: 30, w: 360 })}
        <g opacity="${page}" transform="translate(0 ${(1 - page) * 60})">
          <rect x="180" y="980" width="720" height="280" rx="10" fill="#f3e6c4" stroke="#5c4030" stroke-width="4"/>
          <rect x="210" y="1010" width="280" height="12" fill="#c9a227" opacity="0.5"/>
          <rect x="210" y="1040" width="420" height="8" fill="#8d6e63" opacity="0.35"/>
          <rect x="210" y="1065" width="380" height="8" fill="#8d6e63" opacity="0.3"/>
          <rect x="210" y="1090" width="400" height="8" fill="#8d6e63" opacity="0.3"/>
          <rect x="210" y="1115" width="300" height="8" fill="#8d6e63" opacity="0.25"/>
        </g>
        <g opacity="${stampT}" transform="translate(700 1080) rotate(-18) scale(${Math.max(stampScale, 0.01)})">
          <ellipse cx="0" cy="0" rx="150" ry="58" fill="none" stroke="#b71c1c" stroke-width="8"/>
          <text text-anchor="middle" y="14" font-size="42" fill="#b71c1c"
            font-family="Arial Black, sans-serif">AUSTRALIA</text>
        </g>
        ${label('July 1814', 540, 320, Math.max(dateIn, 0.01), dateIn, { fill: '#ffe9a0', size: 34, w: 240 })}
      </g>`
    );
  }

  // 33.2–35.9 Candle flicker → extinguish (designed wax + bloom + smoke)
  function candleDie(t, local, hs) {
    const { stillLayer, clamp } = hs;
    const flicker = 0.85 + 0.15 * Math.sin(local * 18) * Math.sin(local * 7);
    const out = clamp((local - 1.6) / 0.55, 0, 1);
    const flameOp = (1 - out) * flicker;
    const smokeOp = clamp((local - 1.9) / 0.4, 0, 1);
    const bloom = flameOp * 0.7;
    let smoke = '';
    for (let i = 0; i < 10; i++) {
      const sy = 840 - smokeOp * (160 + i * 62) - Math.sin(local * 2.2 + i) * 16;
      const sx = 540 + Math.sin(local * 1.6 + i * 1.15) * (14 + i * 12);
      const rx = 7 + i * 3.2 + smokeOp * 8;
      const ry = 16 + i * 7;
      smoke += `<ellipse cx="${sx}" cy="${sy}" rx="${rx}" ry="${ry}"
        fill="#eceff1" opacity="${smokeOp * (0.5 - i * 0.04)}"/>`;
    }
    return (
      stillLayer(IMG.portraitAlt, {
        dim: 0.66 + out * 0.2,
        scale: 1.15,
        driftY: local * 3,
      }) +
      `<defs>
        <radialGradient id="candleBloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffe082" stop-opacity="${bloom}"/>
          <stop offset="35%" stop-color="#ff9800" stop-opacity="${bloom * 0.45}"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="roomWarm" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stop-color="#ffb74d" stop-opacity="${flameOp * 0.22}"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="waxBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fffaf0"/>
          <stop offset="45%" stop-color="#f0e0c0"/>
          <stop offset="100%" stop-color="#c9b48a"/>
        </linearGradient>
        <linearGradient id="holderMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#2a1810"/>
          <stop offset="40%" stop-color="#a1887f"/>
          <stop offset="100%" stop-color="#2a1810"/>
        </linearGradient>
      </defs>
      <g>
        <rect x="0" y="0" width="1080" height="1920" fill="url(#roomWarm)"/>
        <ellipse cx="540" cy="940" rx="${120 + flameOp * 50}" ry="${95 + flameOp * 40}" fill="url(#candleBloom)"/>
        <!-- saucer + holder -->
        <ellipse cx="540" cy="1235" rx="95" ry="18" fill="#000" opacity="0.4"/>
        <ellipse cx="540" cy="1215" rx="88" ry="20" fill="#3e2723"/>
        <ellipse cx="540" cy="1210" rx="78" ry="14" fill="#5d4037"/>
        <rect x="482" y="1110" width="116" height="100" rx="8" fill="url(#holderMetal)"/>
        <ellipse cx="540" cy="1110" rx="58" ry="14" fill="#6d4c41"/>
        <!-- wax pillar + melting drips -->
        <rect x="508" y="960" width="64" height="160" rx="8" fill="url(#waxBody)"/>
        <path d="M514,1005 Q502,1050 512,1105" fill="none" stroke="#e8dcc0" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
        <path d="M562,990 Q576,1035 566,1095" fill="none" stroke="#d4c4a0" stroke-width="8" stroke-linecap="round" opacity="0.75"/>
        <ellipse cx="516" cy="1108" rx="8" ry="10" fill="#e8dcc0" opacity="0.85"/>
        <ellipse cx="564" cy="1098" rx="7" ry="9" fill="#d4c4a0" opacity="0.7"/>
        <rect x="532" y="946" width="16" height="22" rx="2" fill="#1a1008"/>
        <!-- flame -->
        <g opacity="${flameOp}" transform="translate(540 940) scale(${0.9 + flicker * 0.22})">
          <ellipse cx="0" cy="-4" rx="32" ry="64" fill="#e65100" opacity="0.5"/>
          <ellipse cx="0" cy="-10" rx="20" ry="52" fill="#ff6f00"/>
          <ellipse cx="0" cy="-18" rx="12" ry="36" fill="#ffca28"/>
          <ellipse cx="0" cy="-28" rx="5" ry="16" fill="#fffde7" opacity="0.95"/>
        </g>
        ${smoke}
      </g>`
    );
  }

  // 35.9–46.5 Euston / London — cemetery headstone gulp + perspective
  function londonGulp(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic, easeInOutCubic } = hs;
    const gulp = easeInOutCubic(clamp((local - 3.2) / 5.0, 0, 1));
    const londonIn = easeOutCubic(clamp(local / 0.5, 0, 1));
    const scale = 1.1 + gulp * 0.38 + local * 0.004;
    const driftY = gulp * 90 + Math.sin(local * 0.4) * 6;
    // Two depth rows — far (smaller, higher) then near (larger, lower) for perspective
    const far = [
      { x: 160, w: 90, h: 0.55, top: 'round' },
      { x: 300, w: 75, h: 0.48, top: 'cross' },
      { x: 440, w: 95, h: 0.58, top: 'peak' },
      { x: 600, w: 80, h: 0.5, top: 'round' },
      { x: 760, w: 88, h: 0.52, top: 'cross' },
    ];
    const near = [
      { x: 40,  w: 170, h: 1.0,  top: 'round' },
      { x: 230, w: 140, h: 0.85, top: 'cross' },
      { x: 420, w: 180, h: 1.05, top: 'round' },
      { x: 640, w: 150, h: 0.9,  top: 'peak' },
      { x: 850, w: 160, h: 0.95, top: 'round' },
    ];
    function drawRow(stones, baseY, riseMul, opacityMul) {
      const rise = (60 + gulp * 560) * riseMul;
      let out = '';
      stones.forEach((s, i) => {
        const h = rise * s.h;
        const y = baseY - h;
        const w = s.w * (0.9 + gulp * 0.15);
        // vanishing pull toward center as gulp grows
        const x = s.x - gulp * (s.x - 540) * 0.12;
        const op = (0.15 + gulp * 0.75) * opacityMul;
        const fill = i % 2 === 0 ? '#0b1220' : '#172033';
        const stroke = '#3d4f66';
        if (s.top === 'round') {
          out += `<g opacity="${op}">
            <rect x="${x}" y="${y + 40}" width="${w}" height="${Math.max(h - 40, 0)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
            <path d="M${x},${y + 44} Q${x + w / 2},${y - 10} ${x + w},${y + 44}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
            <rect x="${x + w * 0.2}" y="${y + h * 0.32}" width="${w * 0.6}" height="9" rx="2" fill="#546e7a" opacity="0.4"/>
            <rect x="${x + w * 0.28}" y="${y + h * 0.42}" width="${w * 0.44}" height="6" rx="1" fill="#455a64" opacity="0.3"/>
          </g>`;
        } else if (s.top === 'peak') {
          out += `<g opacity="${op}">
            <rect x="${x}" y="${y + 55}" width="${w}" height="${Math.max(h - 55, 0)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
            <path d="M${x},${y + 58} L${x + w / 2},${y} L${x + w},${y + 58} Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
          </g>`;
        } else {
          const cx = x + w / 2;
          out += `<g opacity="${op}">
            <rect x="${x + w * 0.16}" y="${y + 78}" width="${w * 0.68}" height="${Math.max(h - 78, 0)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
            <rect x="${cx - 11}" y="${y}" width="22" height="100" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
            <rect x="${cx - 40}" y="${y + 24}" width="80" height="20" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
          </g>`;
        }
      });
      return out;
    }
    return (
      stillLayer(IMG.euston, {
        dim: 0.5 + gulp * 0.16,
        scale,
        driftY,
        driftX: Math.sin(local * 0.3) * 8,
      }) +
      `<defs>
        <linearGradient id="graveFog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="${0.2 + gulp * 0.45}"/>
        </linearGradient>
      </defs>
      <g>
        ${label('London', 540, 240, Math.max(londonIn, 0.01), londonIn, { fill: '#90caf9', size: 38, w: 220 })}
        <rect x="0" y="1100" width="1080" height="820" fill="url(#graveFog)"/>
        <ellipse cx="540" cy="1520" rx="${420 + gulp * 140}" ry="${36 + gulp * 22}" fill="#000" opacity="${0.2 + gulp * 0.4}"/>
        ${drawRow(far, 1380, 0.72, 0.65)}
        ${drawRow(near, 1520, 1.0, 1.0)}
      </g>`
    );
  }

  // 46.5–56.8 Dig trench + dirt particles + plate rotate-in
  function digPlate(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, easeOutCubic, easeOutElastic } = hs;
    const yearIn = easeOutBack(clamp(local / 0.5, 0, 1));
    const digT = clamp((local - 1.4) / 3.0, 0, 1);
    const plateT = easeOutElastic(clamp((local - 6.0) / 0.7, 0, 1));
    const plateRot = (1 - plateT) * -50;
    let dirt = '';
    for (let i = 0; i < 34; i++) {
      const seed = i * 53.7;
      const x = 140 + (seed % 800);
      const rise = digT * (220 + (i % 11) * 48);
      const y = 1080 - rise + Math.sin(local * 6 + i) * 12;
      const s = 7 + (i % 6) * 3.5;
      const op = digT > 0.05 ? 0.45 + digT * 0.45 : 0;
      dirt += `<rect x="${x}" y="${y}" width="${s}" height="${s * 0.8}" fill="${i % 3 === 0 ? '#8d6e63' : '#6d4c41'}"
        opacity="${op}" transform="rotate(${local * 50 + i * 18} ${x} ${y})"/>`;
    }
    const shovelSwing = -16 + Math.sin(local * 7) * 16;
    return (
      stillLayer(IMG.dig, {
        dim: 0.45,
        scale: 1.12 + digT * 0.04,
        driftY: Math.sin(local * 0.5) * 5,
      }) +
      `<g>
        ${label('2019', 540, 250, Math.max(yearIn, 0.01), yearIn * (1 - clamp((local - 5.2) / 0.5, 0, 1)), { fill: '#66bb6a', size: 48, w: 200 })}
        ${dirt}
        <g transform="translate(760 ${1040 - digT * 90}) rotate(${shovelSwing})">
          <rect x="-9" y="0" width="18" height="160" rx="3" fill="#5c4030"/>
          <path d="M-42,158 L42,158 L20,220 L-20,220 Z" fill="#90a4ae" stroke="#37474f" stroke-width="2"/>
        </g>
        <g opacity="${plateT}" transform="translate(540 900) scale(${Math.max(plateT, 0.01)}) rotate(${plateRot}) translate(-540 -900)">
          <ellipse cx="540" cy="1080" rx="270" ry="28" fill="#000" opacity="0.3"/>
          <rect x="170" y="760" width="740" height="250" rx="14" fill="#78909c" stroke="#455a64" stroke-width="7"/>
          <rect x="195" y="785" width="690" height="200" rx="6" fill="#90a4ae"/>
          <rect x="210" y="800" width="660" height="170" rx="4" fill="none" stroke="#546e7a" stroke-width="2" stroke-dasharray="8 6"/>
          <text x="540" y="880" text-anchor="middle" font-size="34" fill="#1a237e"
            font-family="Georgia, serif" font-style="italic">Captain Matthew Flinders</text>
          <text x="540" y="935" text-anchor="middle" font-size="20" fill="#37474f"
            font-family="Helvetica, Arial, sans-serif">R.N. · 1774 – 1814</text>
        </g>
      </g>`
    );
  }

  // 56.8–65.0 Flat Lincolnshire village — 2024 + Donington; soft resting mood
  function villageLoop(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic, easeOutBack } = hs;
    const soft = easeOutCubic(clamp(local / 0.55, 0, 1));
    const yearIn = easeOutBack(clamp((local - 0.7) / 0.4, 0, 1));
    const placeIn = easeOutCubic(clamp((local - 1.3) / 0.4, 0, 1));
    return (
      stillLayer(IMG.village, {
        dim: 0.4,
        scale: 1.14 + local * 0.003,
        driftX: Math.sin(local * 0.25) * 10,
        driftY: local * 1.5,
      }) +
      `<g opacity="${soft}">
        ${label('2024', 540, 260, Math.max(yearIn, 0.01), yearIn, { fill: '#90caf9', size: 42, w: 180 })}
        ${label('Donington', 540, 350, Math.max(placeIn, 0.01), placeIn, { fill: '#ffe9a0', size: 32, w: 260 })}
      </g>`
    );
  }

  window.EPISODE = {
    duration: 64.968,
    fps: 30,
    words: [],
    scenes: [
      { id: 'hook', start: 0.0, end: 7.0, draw: hookSlam },
      { id: 'circumnavigate', start: 7.0, end: 12.3, draw: circumnavigate },
      { id: 'trim', start: 12.3, end: 16.3, draw: trimFriend },
      { id: 'prison', start: 16.3, end: 24.2, draw: prisonMauritius },
      { id: 'name', start: 24.2, end: 33.2, draw: nameAustralia },
      { id: 'candle', start: 33.2, end: 35.9, draw: candleDie },
      { id: 'london', start: 35.9, end: 46.5, draw: londonGulp },
      { id: 'dig', start: 46.5, end: 56.8, draw: digPlate },
      { id: 'loop', start: 56.8, end: 65.0, draw: villageLoop },
    ],
  };
})();
