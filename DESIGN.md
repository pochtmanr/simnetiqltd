# Simnetiq design standards

The homepage hero establishes the studio system: spacious editorial layouts, tight sans-serif headings, silver controls, thin neutral borders, and dimensional dot forms. Apply these rules to studio marketing pages and shared UI. Product-specific case-study demonstrations retain their own brand palettes and typography.

## Source of truth

- `app/globals.css`: theme palettes, typography, radii, buttons, shared panels, focus and reduced-motion behavior.
- `components/panel.tsx`: contained surfaces and specification rows.
- `components/sections/landing-sections.module.css`: homepage card compositions.
- `components/hero-graph.tsx`: the hero's perspective-projected point sculpture.
- `components/hero-chart-proof.tsx`: single-line, pauseable proof reel.
- Dictionaries in `messages/`: all user-visible localized copy.

## Tokens and typography

| Role | Standard |
| --- | --- |
| Page | `--color-bg`: #07090D dark / #F4F5F7 light |
| Surface | `--color-surface`: #0A0A0B dark / white light |
| Primary text | `--color-text`: #EBEBEB dark / #0A0A0B light |
| Detail accent | Existing slate `--color-primary-glow`; use sparingly |
| Control radius | `--radius-control`: 7px |
| Panel and image radius | `--radius-surface`, `--radius-media`: 12px |
| Interaction timing | `--motion-fast`: 180ms; `--motion-standard`: 280ms |
| Display | `.text-display`: responsive 3–5rem, 500, 1.06 line height |
| Section heading | `.text-headline`: responsive 1.875–2.75rem, 500 |
| Body | `.text-body`: 1rem, 1.625 line height |

Use the shared sans family, backed by the locally loaded Inter font; Hebrew uses Lunasima. Keep tight Latin display tracking, neutral body tracking, and existing RTL corrections. Reserve monospace for genuine technical metadata, not all card copy. Use muted final lines to introduce hierarchy without new decorative labels.

## Layout and surfaces

Use a 1440px content boundary, 24px mobile gutters, and 48px desktop gutters. Major sections generally use 64–112px vertical spacing. Align related headings, descriptions, and media to common columns; stack them naturally on mobile.

- Service summaries: open columns or rows with thin rules, a clear title, supporting copy, and one action.
- Work: larger featured imagery, restrained metadata, then a title, description, and explicit project actions.
- People/process: open photo-and-text compositions when a container adds no meaning.
- Forms, specifications, and contained project groups: shared `Panel`, neutral continuous border and modest radius. No luminous gradient frame or inset glow.
- Secondary page openings: `.studio-page-hero`, `.studio-page-eyebrow`, and shared display typography. Use the eyebrow only for existing meaningful page/section labels; the homepage hero has none.

Avoid nested panels, duplicated mobile/desktop actions, fake dashboard chrome, arbitrary metrics, and multiple competing visual focal points. Keep existing project artwork and marketing copy unless the task explicitly changes them.

## Controls and interactions

Primary actions use the foreground color on the page background color (silver in dark mode, ink in light mode). Secondary actions are transparent with a neutral outline. Both use the same 7px radius and at least 52px height. Small utility controls may be smaller while retaining usable hit areas.

Use real buttons for actions and links for navigation. Use SVG arrows with `currentColor`; mirror directional arrows in RTL. Provide visible keyboard focus equivalent to hover. Use logical start/end alignment. Do not depend on hover to reveal essential copy or actions.

Dot forms are a signature motif, not a background for every component. The hero may use live 3D projection; service figures use static SVG dots. Keep motion subtle, pause expensive rendering when hidden/offscreen, and honor `prefers-reduced-motion`. Automatically rotating content must be pauseable; the proof reel’s text button toggles playback without visible control icons. With reduced motion, it advances manually instead. Do not repeatedly announce rotating content to screen readers.

## Content and verification

Chart claims must come from supplied or verified evidence. Never invent countries, positions, customer counts, or proof. Omit relative dates that will silently become stale. Keep English, Hebrew, and Russian dictionaries synchronized.

For shared style edits, inspect the homepage, at least one listing and detail page, and about/contact at desktop and mobile sizes. Check light/dark themes, RTL alignment, readable text, clipping, focus, and navigation. Run ESLint and localization checks; distinguish unrelated existing type/build failures from regressions.
