# Cravio AI Brand Assets

Final brand system for **Cravio AI** (cravioai.com) — Circuit Track mark.  
Tagline: *AI that runs like a factory.*  
No invented client logos, stats or testimonials in any asset.

**Preview:** [`overview.png`](./overview.png)

---

## Quick start for Dev

| Need | Path |
|------|------|
| Horizontal logo (light) | `logo/cravio-horizontal-colour.svg` |
| Horizontal logo (dark bg) | `logo/cravio-horizontal-colour-on-dark.svg` |
| Icon only | `logo/cravio-icon-colour.svg` |
| Favicon head tags | `favicon/html-head-snippet.html` |
| Web manifest | `favicon/site.webmanifest` |
| Colours / type / usage | `brand-kit/brand-kit.md` |
| Hero (layered SVG) | `hero/hero.svg` + `hero/ANIMATION-NOTES.md` |
| OG image | `og/og-1200x630.png` |
| Line icons | `icons/*.svg` (`currentColor`, 24px) |

**Fonts (Google Fonts, OFL):** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (400/500/700) + [Inter](https://fonts.google.com/specimen/Inter) (400/500/600). Logo SVGs use **outlined paths** — no live font dependency at render time.

**Tokens:** Navy `#0A1628` · Cyan `#00C2B2` · Mist `#F4F7FA` · Slate `#64748B`

---

## Directory index

### `logo/`
Polished Circuit Track mark + Space Grotesk wordmark (paths).

Layouts: `horizontal` | `stacked` | `icon`  
Variants: `colour` | `colour-on-dark` | `white` | `black`

Each combo ships:
- `.svg` (outlined)
- `.png` (transparent, ~2× default)
- `@1x.png`, `@2x.png`, `@large.png` (~2000px wide / 2000px icon)

Examples:
- `cravio-horizontal-colour.svg`
- `cravio-icon-black@large.png`

### `favicon/`
| File | Notes |
|------|-------|
| `favicon.ico` | 16 / 32 / 48 |
| `favicon.svg` | Simplified mark on navy (reads at 16px) |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | PNG sources |
| `apple-touch-icon.png` | 180×180 |
| `android-chrome-192x192.png` | 192 |
| `android-chrome-512x512.png` | 512 |
| `maskable-icon-512x512.png` | 512 maskable (extra safe padding) |
| `site.webmanifest` | PWA snippet |
| `html-head-snippet.html` | Copy into `<head>` |

### `brand-kit/`
| File | Notes |
|------|-------|
| `brand-kit.md` | Colours, contrast, fonts, clear space, don’ts, icon rules |
| `brand-kit-board.png` | 2400×1600 visual board |

### `hero/`
| File | Notes |
|------|-------|
| `hero.svg` | Layered, named groups for animation |
| `hero.png` / `hero@2x.png` | Static frames |
| `ANIMATION-NOTES.md` | Layer list + GSAP/CSS hints |
| `hero-demo.html` | Static preview page |

Layer IDs: `layer-background`, `layer-assembly-tracks`, `layer-circuit-traces`, `layer-data-pulses`, `layer-agent-nodes`, `layer-factory-motif`, `layer-hero-mark`, `layer-copy`.

### `icons/`
24×24 line icons, `currentColor`, stroke 1.75.

**Services:** `service-ai-agents`, `service-content-marketing`, `service-custom-solutions`  
**Agent use cases** (from `ai-consultancy.md`):  
`agent-rfq-quote`, `agent-spec-catalogue`, `agent-order-status`, `agent-lead-research`, `agent-content-engine`

Also: `*.png` 96px previews, `icons-sheet.png`, `README.md`.

### `og/`
| File | Size |
|------|------|
| `og-1200x630.svg` / `.png` | Open Graph / Twitter |
| `og-1080.svg` / `.png` | Square social |

### `illustrations/`
Homepage section spots (SVG + PNG + `@2x`):
- `section-problem` — RFQs / time pressure
- `section-how-it-works` — Audit → Pilot → Scale → Managed
- `section-proven-factory` — Factory + agents (no invented metrics)
- `section-cta` — Book audit prompt

### `concepts/`
Locked concept exploration (A/B/C). **Do not use for production** — finals are under `logo/` etc. Concept A was selected.

### Root
| File | Notes |
|------|-------|
| `overview.png` | This package’s visual index |
| `README.md` | You are here |

---

## Choices Dev should know

1. **Selected mark:** Concept A Circuit Track only.
2. **Wordmark treatment:** “AI” in Cyan (or matching mono colour); Medium weight vs Bold “Cravio”.
3. **On-dark full colour:** Track becomes mist `#E8EEF4`, nodes stay Cyan — see `*-colour-on-dark`.
4. **Favicon** is a *simplified* Circuit Track (fewer nodes) so it holds at 16px; app icons use the full mark.
5. **Hero copy** in SVG is placeholder for layout; prefer HTML text in production (see animation notes).
6. **Agent use cases** match the consultancy plan: RFQ, Spec/Catalogue, Order status, Lead research, Content engine.
7. Illustrations and OG contain **no client names, stats, or testimonials**.
