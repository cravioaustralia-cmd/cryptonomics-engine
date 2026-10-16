# Cravio AI Brand Kit

**Positioning:** AI agents and content engines built by a manufacturer, proven in our own factory.  
**Tagline:** AI that runs like a factory.  
**Domain:** cravioai.com  
**Mark:** Circuit Track (Concept A) — monogram C as an assembly-line / PCB track with cyan nodes.

---

## Colours

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| **Navy** | `#0A1628` | 10, 22, 40 | Primary — logo track, headings, dark surfaces |
| **Cyan** | `#00C2B2` | 0, 194, 178 | Accent — nodes, “AI”, CTAs, data pulses |
| **Mist** | `#F4F7FA` | 244, 247, 250 | Light ground, text on navy |
| Slate | `#64748B` | 100, 116, 139 | Supporting neutral — body muted, captions |
| Line | `#E2E8F0` | 226, 232, 240 | Borders, dividers on mist |
| White | `#FFFFFF` | 255, 255, 255 | Cards on mist, pure light UI |

### Contrast notes
- Navy on Mist / White: **AAA** for body and UI.
- Cyan on Navy: **AA+** for large text and icons; avoid cyan body text on white (use Navy).
- Mist on Navy: **AAA**.
- Cyan on White: decorative only — pair with Navy text labels.
- Do not place Navy logo-colour track on Navy backgrounds; use **colour-on-dark** or **white** logo variants.

---

## Typography

### Headings — Space Grotesk
- Google Fonts: https://fonts.google.com/specimen/Space+Grotesk  
- License: SIL Open Font License  
- Weights to load: **400 Regular, 500 Medium, 700 Bold** (real files — no faux bold)
- Use: H1–H3, wordmark “Cravio”, buttons, nav

### Body — Inter
- Google Fonts: https://fonts.google.com/specimen/Inter  
- License: SIL Open Font License  
- Weights: **400 Regular, 500 Medium, 600 SemiBold**
- Use: paragraphs, forms, captions, UI

### CSS snippet
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
```
```css
:root {
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --navy: #0A1628;
  --cyan: #00C2B2;
  --mist: #F4F7FA;
  --slate: #64748B;
}
h1,h2,h3,.display { font-family: var(--font-display); font-weight: 700; color: var(--navy); }
body { font-family: var(--font-body); color: var(--navy); }
```

Wordmark: “Cravio” = Space Grotesk Bold; “AI” = Space Grotesk Medium in Cyan (or White/Black in mono variants). All logo SVGs ship with **outlined paths** — do not substitute live text in the logo files.

---

## Logo usage

### Clear space
Keep clear space ≥ **height of the centre chip** (≈ ¼ of icon height) on all sides. Do not crowd with other marks or type.

### Minimum sizes
| Format | Min width |
|--------|-----------|
| Horizontal | 120px |
| Stacked | 80px |
| Icon only | 24px (prefer 32px+) |
| Favicon | 16px (simplified SVG provided) |

### Variants
| File suffix | When |
|-------------|------|
| `*-colour` | Light / mist backgrounds |
| `*-colour-on-dark` | Navy / dark photography |
| `*-white` | Photos, navy fields, video |
| `*-black` | Mono print, stamps, fax |

### Don’ts
1. Don’t stretch, skew, or rotate the mark.
2. Don’t recolour nodes independently of the system (Navy + Cyan only for full-colour).
3. Don’t add strokes, shadows, or gradients to the logo.
4. Don’t place colour (navy track) logo on navy or black without switching to on-dark/white.
5. Don’t reconstruct the wordmark in a different typeface.
6. Don’t invent client logos, fake stats, or testimonials next to the mark.

---

## Icon style rules
- Grid: **24×24**, optical padding ~2px.
- Stroke: **1.75**, round caps & joins, `currentColor`.
- Align to pixel grid; prefer geometric, industrial metaphors (nodes, docs, modules) — no brains/robots/sparkles.
- Services + agent use cases live in `/brand/icons/`.

---

## Voice (short)
Credible manufacturer who ships AI. Concrete, Australian English, no hype stats you can’t prove. Human approval on every agent output.
