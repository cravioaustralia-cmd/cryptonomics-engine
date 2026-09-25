/* s01-skylab-esperance — SVG motion graphics (no Remotion) */
(function () {
  const IMG = {
    beach: '/img/04-esperance-beach.jpg',
    orbit: '/img/01-skylab-orbit.jpg',
    cutaway: '/img/02-skylab-cutaway.jpg',
    map: '/img/03-australia-wa-map.png',
    fireball: '/img/06-meteor-fireball.jpg',
    debris: '/img/07-metal-debris.jpg',
    museum: '/img/08-museum.jpg',
    coast: '/img/05-esperance-coast.jpg',
    gavel: '/img/09-gavel.jpg',
    letter: '/img/09-official-letter.jpg',
    mic: '/img/09-vintage-mic.jpg',
    headphones: '/img/09-radio-headphones.jpg',
    sky: '/img/10-night-sky.jpg',
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Scene drawers ---
  function hookSlam(t, local, hs) {
    const { stillLayer, easeOutBack, clamp, easeOutCubic } = hs;
    const slam = easeOutBack(clamp(local / 0.45, 0, 1));
    const pulse = 1 + 0.03 * Math.sin(local * 8);
    const sub = easeOutCubic(clamp((local - 0.5) / 0.4, 0, 1));
    return (
      stillLayer(IMG.beach, { dim: 0.55, scale: 1.12, driftX: Math.sin(local * 0.4) * 8 }) +
      `<g transform="translate(540 520) scale(${slam * pulse}) translate(-540 -520)">
        <rect x="60" y="360" width="960" height="300" rx="28" fill="rgba(10,10,20,0.78)"
          stroke="#f5c842" stroke-width="5"/>
        <text x="540" y="460" text-anchor="middle"
          font-family="Arial Black, Helvetica, sans-serif" font-size="58" font-weight="900"
          fill="#f5c842" stroke="#000" stroke-width="8" paint-order="stroke">A TOWN FINED NASA</text>
        <text x="540" y="560" text-anchor="middle"
          font-family="Arial Black, Helvetica, sans-serif" font-size="72" font-weight="900"
          fill="#fff" stroke="#000" stroke-width="10" paint-order="stroke">FOR LITTERING</text>
      </g>
      <g opacity="${sub}">
        <text x="540" y="640" text-anchor="middle"
          font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="700"
          fill="#ffe9a0">Esperance, Western Australia · 1979</text>
      </g>`
    );
  }

  function orbitSat(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic } = hs;
    const img = local < 5.6 ? IMG.orbit : IMG.cutaway;
    const dim = local < 5.6 ? 0.5 : 0.42;
    const angle = local * 55;
    const shake = local > 5.6 ? Math.sin(local * 40) * 6 : 0;
    const enter = easeOutCubic(clamp(local / 0.5, 0, 1));
    const cx = 540 + shake;
    const cy = 1100;
    const rx = 320;
    const ry = 140;
    const rad = (angle * Math.PI) / 180;
    const satX = cx + Math.cos(rad) * rx;
    const satY = cy + Math.sin(rad) * ry;
    const warn = local > 4.5 ? clamp((local - 4.5) / 0.6, 0, 1) : 0;
    return (
      stillLayer(img, { dim, scale: 1.1 + local * 0.004, driftY: shake * 0.3 }) +
      `<g opacity="${enter}">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none"
          stroke="rgba(120,200,255,0.85)" stroke-width="4" stroke-dasharray="14 10"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.62}" ry="${ry * 0.62}" fill="none"
          stroke="rgba(120,200,255,0.35)" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="70" fill="#3a7bd5" opacity="0.9"/>
        <circle cx="${cx}" cy="${cy}" r="48" fill="#6ec6ff"/>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="22" fill="#041428"
          font-family="Arial Black, sans-serif">EARTH</text>
        <g transform="translate(${satX} ${satY}) rotate(${angle})">
          <rect x="-36" y="-16" width="72" height="32" rx="4" fill="#d8dde6" stroke="#222" stroke-width="2"/>
          <rect x="-70" y="-10" width="28" height="20" fill="#4fc3f7"/>
          <rect x="42" y="-10" width="28" height="20" fill="#4fc3f7"/>
          <circle cx="0" cy="0" r="6" fill="#ff7043"/>
        </g>
        <text x="540" y="320" text-anchor="middle"
          font-family="Arial Black, sans-serif" font-size="48" fill="#fff"
          stroke="#000" stroke-width="7" paint-order="stroke">SKYLAB</text>
        <text x="540" y="385" text-anchor="middle" font-size="32" fill="#b8e0ff"
          font-family="Helvetica, Arial, sans-serif">NASA's first space station</text>
      </g>
      <g opacity="${warn}">
        <rect x="200" y="1100" width="680" height="70" rx="14" fill="rgba(180,30,30,0.85)"/>
        <text x="540" y="1148" text-anchor="middle" font-size="34" fill="#fff"
          font-family="Arial Black, sans-serif">⚠ FALLING OUT OF ORBIT</text>
      </g>`
    );
  }

  function mapPin(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, easeOutCubic, easeOutElastic } = hs;
    const drop = easeOutElastic(clamp(local / 0.9, 0, 1));
    const pinY = -400 + drop * 400;
    // Esperance approx on WA map framing — lower mid-left of typical WA crop
    const pinX = 470;
    const pinBase = 980;
    const ripple = clamp((local - 0.7) / 0.5, 0, 1);
    const label = easeOutCubic(clamp((local - 0.5) / 0.4, 0, 1));
    return (
      stillLayer(IMG.map, { dim: 0.35, scale: 1.15 }) +
      `<g>
        <text x="540" y="320" text-anchor="middle" font-size="40" fill="#fff"
          font-family="Arial Black, sans-serif" stroke="#000" stroke-width="6" paint-order="stroke">
          11 JULY 1979 · WESTERN AUSTRALIA</text>
        <g transform="translate(${pinX} ${pinBase + pinY})">
          <path d="M0,-90 C-38,-90 -55,-55 -55,-30 C-55,20 0,90 0,90 C0,90 55,20 55,-30 C55,-55 38,-90 0,-90 Z"
            fill="#e53935" stroke="#fff" stroke-width="4"/>
          <circle cx="0" cy="-40" r="22" fill="#fff"/>
        </g>
        <circle cx="${pinX}" cy="${pinBase + 20}" r="${20 + ripple * 80}"
          fill="none" stroke="#ffeb3b" stroke-width="4" opacity="${1 - ripple}"/>
        <g opacity="${label}">
          <rect x="300" y="1100" width="480" height="90" rx="16" fill="rgba(0,0,0,0.75)" stroke="#f5c842" stroke-width="3"/>
          <text x="540" y="1160" text-anchor="middle" font-size="42" fill="#f5c842"
            font-family="Arial Black, sans-serif">ESPERANCE</text>
        </g>
      </g>`
    );
  }

  function debrisRain(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic } = hs;
    const pieces = [];
    for (let i = 0; i < 28; i++) {
      const seed = i * 97.13;
      const x = ((seed * 13) % 1000) + 40;
      const speed = 280 + (i % 7) * 55;
      const delay = (i % 9) * 0.08;
      const y = -120 + ((local - delay) * speed) % 2200;
      const rot = local * (40 + i * 7) + i * 20;
      const w = 28 + (i % 5) * 10;
      const h = 16 + (i % 3) * 8;
      const op = clamp(local * 2, 0, 1);
      pieces.push(
        `<g opacity="${op}" transform="translate(${x} ${y}) rotate(${rot})">
          <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2"
            fill="${i % 2 ? '#c5cad3' : '#8a909a'}" stroke="#333" stroke-width="1"/>
          <rect x="${-w / 2}" y="${-h / 2}" width="${w * 0.35}" height="${h}" fill="#ff7043" opacity="0.7"/>
        </g>`
      );
    }
    const banner = easeOutCubic(clamp((local - 0.2) / 0.4, 0, 1));
    return (
      stillLayer(IMG.fireball, { dim: 0.4, scale: 1.2 + local * 0.01 }) +
      pieces.join('') +
      `<g opacity="${banner}">
        <rect x="80" y="260" width="920" height="100" rx="18" fill="rgba(0,0,0,0.7)" stroke="#ff7043" stroke-width="3"/>
        <text x="540" y="325" text-anchor="middle" font-size="44" fill="#fff"
          font-family="Arial Black, sans-serif" stroke="#000" stroke-width="5" paint-order="stroke">
          SPACE STATION DEBRIS</text>
      </g>`
    );
  }

  function debrisCard(t, local, hs) {
    const { stillLayer, clamp, easeOutBack } = hs;
    const fly = easeOutBack(clamp(local / 0.55, 0, 1));
    const x = 540;
    const y = 900;
    return (
      stillLayer(IMG.debris, { dim: 0.5, scale: 1.15 }) +
      `<g transform="translate(${x} ${y}) scale(${fly}) translate(${-x} ${-y})">
        <rect x="140" y="980" width="800" height="360" rx="24" fill="rgba(20,18,14,0.88)"
          stroke="#f5c842" stroke-width="4"/>
        <text x="540" y="1080" text-anchor="middle" font-size="40" fill="#f5c842"
          font-family="Arial Black, sans-serif">LOCALS COLLECTED IT</text>
        <text x="540" y="1170" text-anchor="middle" font-size="48" fill="#fff"
          font-family="Arial Black, sans-serif">Chunks of Skylab</text>
        <text x="540" y="1250" text-anchor="middle" font-size="32" fill="#ccc"
          font-family="Helvetica, Arial, sans-serif">picked up across the Shire</text>
      </g>`
    );
  }

  function museumPlaque(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic } = hs;
    const slide = easeOutCubic(clamp(local / 0.55, 0, 1));
    const x = lerp(-700, 0, slide);
    function lerp(a, b, u) {
      return a + (b - a) * u;
    }
    return (
      stillLayer(IMG.museum, { dim: 0.48, scale: 1.1 }) +
      `<g transform="translate(${x} 0)">
        <rect x="90" y="980" width="900" height="400" rx="16" fill="#2a2418"
          stroke="#c9a227" stroke-width="8"/>
        <rect x="120" y="1010" width="840" height="340" rx="8" fill="#1a1610"
          stroke="#8a7420" stroke-width="2"/>
        <text x="540" y="1100" text-anchor="middle" font-size="28" fill="#c9a227"
          font-family="Georgia, serif" letter-spacing="4">ESPERANCE MUSEUM</text>
        <text x="540" y="1200" text-anchor="middle" font-size="46" fill="#f5e6c8"
          font-family="Georgia, serif">Skylab Debris Exhibit</text>
        <text x="540" y="1290" text-anchor="middle" font-size="30" fill="#bba87a"
          font-family="Helvetica, Arial, sans-serif">One big chunk · on display</text>
      </g>`
    );
  }

  function councilPop(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, easeOutElastic } = hs;
    const pop = easeOutElastic(clamp(local / 0.7, 0, 1));
    const line2 = clamp((local - 1.2) / 0.4, 0, 1);
    return (
      stillLayer(IMG.coast, { dim: 0.52, scale: 1.1 }) +
      `<g transform="translate(540 520) scale(${pop}) translate(-540 -520)">
        <rect x="100" y="380" width="880" height="280" rx="22" fill="rgba(8,40,70,0.9)"
          stroke="#7ec8ff" stroke-width="4"/>
        <text x="540" y="480" text-anchor="middle" font-size="36" fill="#7ec8ff"
          font-family="Arial Black, sans-serif">SHIRE OF ESPERANCE</text>
        <text x="540" y="580" text-anchor="middle" font-size="42" fill="#fff"
          font-family="Arial Black, sans-serif">did what any responsible</text>
        <text x="540" y="640" text-anchor="middle" font-size="42" fill="#fff"
          font-family="Arial Black, sans-serif">council would do…</text>
      </g>
      <g opacity="${line2}" transform="translate(540 1100) scale(${easeOutBack(line2)}) translate(-540 -1180)">
        <text x="540" y="1110" text-anchor="middle" font-size="34" fill="#f5c842"
          font-family="Helvetica, Arial, sans-serif">📋 Issue a littering fine</text>
      </g>`
    );
  }

  function ticketStamp(t, local, hs) {
    const { stillLayer, clamp, easeOutCubic, easeOutBack } = hs;
    // Print lines appear sequentially
    const lines = [
      { y: 400, text: 'LITTERING FINE', size: 36 },
      { y: 470, text: 'To:   N.A.S.A.', size: 34 },
      { y: 530, text: 'From: Shire of Esperance', size: 30 },
      { y: 595, text: 'Amount:  $400.00', size: 38 },
      { y: 655, text: 'Date:  July 1979', size: 28 },
    ];
    const printProgress = clamp(local / 1.6, 0, 1) * lines.length;
    let ticketBody = '';
    lines.forEach((ln, i) => {
      const reveal = clamp(printProgress - i, 0, 1);
      if (reveal <= 0) return;
      ticketBody += `<text x="540" y="${ln.y}" text-anchor="middle" font-size="${ln.size}"
        fill="#1a1208" font-family="Courier New, monospace" font-weight="700"
        opacity="${reveal}">${esc(ln.text)}</text>`;
    });
    const paper = easeOutCubic(clamp(local / 0.35, 0, 1));
    const stampT = clamp((local - 2.0) / 0.35, 0, 1);
    const stampScale = stampT > 0 ? easeOutBack(stampT) : 0;
    const stampRot = -18;
    return (
      stillLayer(IMG.gavel, { dim: 0.55, scale: 1.08 }) +
      `<g opacity="${paper}" transform="translate(0 ${(1 - paper) * 80})">
        <rect x="140" y="280" width="800" height="420" rx="8" fill="#f3e6c4"
          stroke="#5c4030" stroke-width="4"/>
        <rect x="160" y="300" width="760" height="40" fill="#c9a227"/>
        <text x="540" y="330" text-anchor="middle" font-size="22" fill="#1a1208"
          font-family="Arial Black, sans-serif">OFFICIAL NOTICE</text>
        ${ticketBody}
      </g>
      <g opacity="${stampT}" transform="translate(780 620) rotate(${stampRot}) scale(${stampScale})">
        <ellipse cx="0" cy="0" rx="120" ry="55" fill="none" stroke="#c62828" stroke-width="8"/>
        <text text-anchor="middle" y="12" font-size="40" fill="#c62828"
          font-family="Arial Black, sans-serif" transform="rotate(0)">ISSUED</text>
      </g>`
    );
  }

  function unpaidYears(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, lerp } = hs;
    const stampT = clamp(local / 0.4, 0, 1);
    const stampScale = easeOutBack(stampT);
    // Year count 1979 → 2009 over ~2.5s starting at local 1.0
    const yearT = clamp((local - 1.0) / 2.5, 0, 1);
    const year = Math.round(lerp(1979, 2009, yearT));
    const yearsPassed = year - 1979;
    return (
      stillLayer(IMG.letter, { dim: 0.55, scale: 1.1 }) +
      `<g>
        <rect x="120" y="260" width="840" height="420" rx="12" fill="rgba(250,245,230,0.92)"
          stroke="#333" stroke-width="3"/>
        <text x="540" y="360" text-anchor="middle" font-size="34" fill="#333"
          font-family="Courier New, monospace">FINE STATUS</text>
        <text x="540" y="460" text-anchor="middle" font-size="64" fill="#111"
          font-family="Arial Black, sans-serif">$400</text>
        <g transform="translate(540 580) rotate(-12) scale(${stampScale})">
          <rect x="-160" y="-50" width="320" height="100" rx="8" fill="none"
            stroke="#b71c1c" stroke-width="10"/>
          <text text-anchor="middle" y="18" font-size="52" fill="#b71c1c"
            font-family="Arial Black, sans-serif">UNPAID</text>
        </g>
        <text x="540" y="1080" text-anchor="middle" font-size="56" fill="#f5c842"
          font-family="Arial Black, sans-serif" stroke="#000" stroke-width="6" paint-order="stroke">${year}</text>
        <text x="540" y="1160" text-anchor="middle" font-size="32" fill="#fff"
          font-family="Helvetica, Arial, sans-serif">${yearsPassed} years later…</text>
      </g>`
    );
  }

  function radioEQ(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, easeOutCubic } = hs;
    const bars = [];
    for (let i = 0; i < 16; i++) {
      const h =
        40 +
        Math.abs(Math.sin(local * 10 + i * 0.7)) * 140 +
        Math.abs(Math.sin(local * 3.5 + i)) * 60;
      const x = 200 + i * 44;
      bars.push(
        `<rect x="${x}" y="${1300 - h}" width="32" height="${h}" rx="6"
          fill="${i % 3 === 0 ? '#f5c842' : '#4fc3f7'}" opacity="0.9"/>`
      );
    }
    const namePop = easeOutBack(clamp((local - 1.8) / 0.45, 0, 1));
    const cashPop = easeOutBack(clamp((local - 4.8) / 0.4, 0, 1));
    // Scene spans ~39.8–47.3 in absolute (local 0–7.5)
    return (
      stillLayer(local < 5.5 ? IMG.mic : IMG.headphones, { dim: 0.5, scale: 1.12 }) +
      `<g>
        <text x="540" y="320" text-anchor="middle" font-size="36" fill="#b8e0ff"
          font-family="Arial Black, sans-serif">2009 · AMERICAN RADIO</text>
        ${bars.join('')}
        <g opacity="${namePop}" transform="translate(540 420) scale(${Math.max(namePop, 0.01)}) translate(-540 -420)">
          <rect x="120" y="340" width="840" height="160" rx="20" fill="rgba(0,0,0,0.75)"
            stroke="#f5c842" stroke-width="4"/>
          <text x="540" y="410" text-anchor="middle" font-size="34" fill="#aaa"
            font-family="Helvetica, Arial, sans-serif">DJ</text>
          <text x="540" y="470" text-anchor="middle" font-size="56" fill="#fff"
            font-family="Arial Black, sans-serif">SCOTT BARLEY</text>
        </g>
        <g opacity="${cashPop}" transform="translate(540 1100) scale(${Math.max(cashPop, 0.01)}) translate(-540 -1100)">
          <circle cx="540" cy="1100" r="110" fill="#2e7d32" stroke="#a5d6a7" stroke-width="6"/>
          <text x="540" y="1120" text-anchor="middle" font-size="52" fill="#fff"
            font-family="Arial Black, sans-serif">$400</text>
          <text x="540" y="1260" text-anchor="middle" font-size="32" fill="#c8e6c9"
            font-family="Helvetica, Arial, sans-serif">raised from listeners ✓</text>
        </g>
      </g>`
    );
  }

  function loopPunch(t, local, hs) {
    const { stillLayer, clamp, easeOutBack, easeOutCubic } = hs;
    const slam = easeOutBack(clamp(local / 0.5, 0, 1));
    const sub = easeOutCubic(clamp((local - 1.2) / 0.5, 0, 1));
    const pulse = 1 + 0.025 * Math.sin(local * 6);
    return (
      stillLayer(IMG.sky, { dim: 0.45, scale: 1.15 + local * 0.005 }) +
      `<g transform="translate(540 1100) scale(${slam * pulse}) translate(-540 -1100)">
        <rect x="70" y="940" width="940" height="320" rx="28" fill="rgba(5,10,30,0.82)"
          stroke="#f5c842" stroke-width="5"/>
        <text x="540" y="1040" text-anchor="middle" font-size="40" fill="#f5c842"
          font-family="Arial Black, sans-serif">REMEMBER THE TINY TOWN</text>
        <text x="540" y="1140" text-anchor="middle" font-size="56" fill="#fff"
          font-family="Arial Black, sans-serif">THAT FINED NASA</text>
      </g>
      <g opacity="${sub}">
        <text x="540" y="1360" text-anchor="middle" font-size="34" fill="#ffe9a0"
          font-family="Helvetica, Arial, sans-serif">Esperance · still owed nothing</text>
        <text x="540" y="1440" text-anchor="middle" font-size="28" fill="#9ab"
          font-family="Helvetica, Arial, sans-serif">Don't drop things from space 🚀</text>
      </g>`
    );
  }

  window.EPISODE = {
    duration: 53.088,
    fps: 30,
    words: [],
    scenes: [
      { id: 'hook', start: 0.0, end: 5.0, draw: hookSlam },
      { id: 'orbit', start: 5.0, end: 13.5, draw: orbitSat },
      { id: 'map', start: 13.5, end: 17.5, draw: mapPin },
      { id: 'debris', start: 17.5, end: 21.7, draw: debrisRain },
      { id: 'card', start: 21.7, end: 24.3, draw: debrisCard },
      { id: 'museum', start: 24.3, end: 27.0, draw: museumPlaque },
      { id: 'council', start: 27.0, end: 31.2, draw: councilPop },
      { id: 'ticket', start: 31.2, end: 35.2, draw: ticketStamp },
      { id: 'unpaid', start: 35.2, end: 39.8, draw: unpaidYears },
      { id: 'radio', start: 39.8, end: 47.3, draw: radioEQ },
      { id: 'loop', start: 47.3, end: 53.2, draw: loopPunch },
    ],
  };
})();
