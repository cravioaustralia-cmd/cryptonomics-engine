# Hero animation notes (for Dev)

Source: `hero.svg` — layered groups with stable IDs.

## Layers (back → front)
| ID | Role | Motion |
|----|------|--------|
| `layer-background` | Navy gradient + grid | Static (optional very slow grid drift: `translateX` 0→40px over 40s, loop) |
| `layer-factory-motif` | Abstract factory silhouette | Static or opacity 0.2→0.3 pulse 6s |
| `layer-assembly-tracks` | Conveyor / assembly paths | Static |
| `layer-circuit-traces` | Cyan PCB accents | Optional draw-on: `stroke-dashoffset` 0 over 1.2s on load |
| `layer-data-pulses` | Cyan dots on the line | **Primary motion** — move along tracks |
| `layer-agent-nodes` | RFQ / Content / Ops modules | Soft scale 1→1.04→1 on a 3s stagger |
| `layer-hero-mark` | Large Circuit Track mark | Entrance: opacity 0→1 + slight scale 0.96→1 (600ms) |
| `layer-copy` | Headline / sub / URL | Prefer real HTML text over SVG text in production |

## Recommended pulse motion (CSS or GSAP)
Animate `#pulse-1` … `#pulse-5` along `#track-main` / `#track-loop` / `#track-riser`.

**GSAP + MotionPath (preferred):**
```js
gsap.to("#pulse-1", {
  motionPath: { path: "#track-main", align: "#track-main", autoRotate: false },
  duration: 8, repeat: -1, ease: "none"
});
gsap.to("#pulse-2", {
  motionPath: { path: "#track-main", align: "#track-main" },
  duration: 8, repeat: -1, ease: "none", delay: 2.5
});
gsap.to("#pulse-5", {
  motionPath: { path: "#track-loop", align: "#track-loop" },
  duration: 6, repeat: -1, ease: "none"
});
```

**CSS-only fallback:** keyframe `cx`/`cy` or `transform: translate()` along approximate waypoints (see `hero-demo.html`).

## Agent nodes
```js
gsap.to(["#agent-1","#agent-2","#agent-3"], {
  scale: 1.04, transformOrigin: "center",
  duration: 1.6, yoyo: true, repeat: -1, stagger: 0.4, ease: "sine.inOut"
});
```

## Performance
- Keep blur (`softGlow`) off on mobile or reduce `stdDeviation`.
- Prefer animating `transform` and `opacity` only.
- Replace `layer-copy` with HTML/CSS for crisp type and a11y.
