# Threadwise — identity

The working system, not a logo file. Everything here is implemented in
`src/components/threadwise/BrandMark.tsx` and `BrandLockup.tsx`, so the code and
this document cannot drift apart.

## The mark

A case tag hanging from a cord: ink body, punched hole, tilted 7°, cobalt pin.

It is the object that already exists on every cord in the canvas — the tag that
carries a relationship's name. The product's most distinctive detail is the
brand, which is why it can be the icon and the in-app mark at once.

**Rules**

- Ink tag, cobalt pin. Never the reverse; never a coloured tag.
- Paper square behind it in every icon context, so it survives dark chrome.
- Minimum sizes: 16px in a favicon (on paper), 20px inline, 32px standalone.
- Below 20px the cord and pin collapse — the paper chip is what carries it.
- Never stretch, never re-tilt, never add a shadow or gradient.

**Files**

| File | Use |
|---|---|
| `public/brand/tag.svg` | inline in the app |
| `public/brand/favicon.svg` | browser tab (paper field) |
| `public/brand/tag-mono.svg` | single-colour / `currentColor` |
| `public/favicon.ico` | 16/32/48 tab and bookmarks |
| `public/apple-touch-icon.png` | 180, opaque — iOS composites transparency on black |
| `public/icon-192.png`, `icon-512.png` | PWA / Android |
| `public/icon-maskable-512.png` | Android adaptive, padded into the safe zone |

## The lockup

Horizontal by default. Stacked only for square formats.

- The mark is set to the wordmark's **cap height**, never larger.
- The gap is **0.45× the mark width**. Tighter reads as one glyph; looser reads as two objects.
- Clear space on every side equals the mark's width.
- Wordmark: Fraunces italic, `tracking-tight`, lowercase, never letterspaced.

## Type

| Register | Face | Use |
|---|---|---|
| Display | Fraunces, italic for the wordmark and titles | headlines, card titles |
| Reading | Fraunces, roman | long-form assessment, quotes |
| Data | JetBrains Mono | labels, dates, counters, keycaps |

Three registers, nothing between 10px and 18px. No sizes below 10px anywhere
except the deliberately-scaled laptop mock.

## Colour

| Token | Value | Meaning |
|---|---|---|
| Paper | `#FDFBF7` | the surface everything sits on |
| Ink | `#1A1A1A` | structure, text, rules |
| Cobalt | `#1A4BFF` | **interaction only** — selection, focus, links, the pin |
| Red | `#C1121F` | **one meaning** — the blind spot, the contradiction |

Cobalt never decorates. Red never warns about anything except a contradiction or
a blind spot. Card *type* is carried by rule pattern and weight, not hue.

## Materials

- **Paper** — the canvas and every reading surface.
- **Stock** — panels, sheets, menus: white, 2px ink rule, 2px corners, hard offset shadow.
- **Ink** — type and rules.

No soft shadows, no gradients, no glass except the dock (78% paper, 18px blur) and
the two top bars.

## Voice

Labels describe the person's work, not the software.
"Nothing challenged yet", not "Awaiting analysis". "Start from evidence, not a
prompt", not "Get started with AI".
