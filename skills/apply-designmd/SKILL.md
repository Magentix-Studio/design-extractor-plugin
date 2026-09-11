---
name: apply-designmd
description: Extract a DESIGN.md from a reference website with the design-extractor MCP server and apply its tokens, fonts and component recipes to the current codebase (Tailwind v4 @theme, CSS variables or a tokens JSON). Use when the user wants a project to look like a given site, asks to adopt or apply a DESIGN.md, or asks for a design system from a URL.
---

# Apply a DESIGN.md

A DESIGN.md is a design system document with two layers: YAML front matter
holding machine-readable tokens (colors, typography, rounded, spacing,
components, optional dark overrides) and a markdown body holding the
rationale (Overview, Colors, Typography, Layout, Elevation & Depth, Shapes,
Components, Do's and Don'ts). The format is described at
https://www.design-extractor.com/docs/design-md.

Work through the steps in order. Do not skip the verification step.

## 1. Get the DESIGN.md

If the user already has a DESIGN.md in the repo or pasted one, read it and go
to step 2.

Otherwise extract it from the reference site with the `design-extractor` MCP
server. If the server's tools are not available, stop and tell the user to
install the plugin and set `DESIGN_EXTRACTOR_API_KEY` (see the plugin README),
do not try to scrape the site yourself.

1. Call `get_pricing` once if the user has not said which tier to use, and
   tell them the cost before spending credits. `LITE` extracts one page and
   suits a landing page or a single screen. `PRO` samples the site's key
   pages and suits a whole product or marketing site. `get_credits` shows the
   balance.
2. Call `extract_design` with `url` (the public page, https) and `tier`
   (`LITE` or `PRO`). It returns a status and the result URL on the site.
   This spends credits, so call it once per site. Only public pages work: no
   localhost, no pages behind a login. Tell the user it takes at least a
   minute.
3. Wait about 60 seconds, then call `get_extraction` with `site` set to the
   site the user named (a name or URL; never ask the user for an id). While
   the status is `QUEUED` or `RUNNING`, wait 25 seconds and call it again.
   Do not start a second extraction of the same URL while one is running.
   When it is `COMPLETED` the response contains the full DESIGN.md text.
   When it is `FAILED` the response says why; report that to the user and
   stop.
4. Save the text as `DESIGN.md` at the repo root unless the user asks for a
   different place. Commit nothing yet.

`list_my_extractions` shows earlier extractions; reuse one instead of paying
again when the same site was extracted recently.

## 2. Read it

Parse the front matter first, then the body.

Front matter (tokens, exact values):

- `colors`: `token-name: "#hex"`. Expect `primary`, often `secondary`,
  `surface`, `on-surface`, `background`, `error`, plus scale names such as
  `primary-60`. Keep the names.
- `typography`: named levels (`display-lg`, `headline-md`, `body-md`,
  `label-sm`) with `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`,
  `letterSpacing`, optional `fontFeature` and `fontVariation`.
- `rounded`: scale levels (`sm`, `md`, `lg`, `full`) to dimensions.
- `spacing`: scale levels to dimensions or numbers.
- `components`: per component (`button-primary`, `button-primary-hover`,
  `input`, `card`) a map of property to a literal or a token reference such
  as `"{colors.primary}"`. Resolve every reference against the YAML tree;
  a reference that does not resolve is a bug in the document, not a token
  to invent.
- `dark.colors`: overrides that apply in dark mode. Base tokens are the
  default theme.

Body (intent, use it to make decisions the tokens leave open):

- Overview: the personality of the design; guides everything you cannot
  read from a token (density, contrast, tone).
- Colors and Typography: which token goes where (CTAs, text on dark
  surfaces, headline weights).
- Layout: base spacing unit, content widths, gutters, grid.
- Elevation & Depth and Shapes: shadows or borders, corner radii per element.
- Components: recipes in prose; combine with the `components` tokens.
- Do's and Don'ts: hard rules. Treat each Don't as a lint rule for your work.

If the front matter and the body disagree, the front matter wins for values
and the body wins for usage.

## 3. Map the tokens onto the project

Detect what the project uses before writing anything: Tailwind v4 (`@import
"tailwindcss"` in a CSS file), Tailwind v3 (`tailwind.config`), plain CSS or
CSS modules, styled-components, or a tokens pipeline (Style Dictionary, a
`tokens.json`). Extend the existing token file; do not add a second source of
truth. Keep DESIGN.md token names, converted to the target's naming rule.

### Tailwind v4 `@theme`

In the main CSS file, next to `@import "tailwindcss";`:

```css
@theme {
  --color-primary: #2665fd;
  --color-secondary: #475569;
  --color-surface: #0b1326;
  --color-on-surface: #dae2fd;
  --color-error: #ffb4ab;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --text-body-md: 16px;
  --text-body-md--line-height: 1.5;
  --text-headline-md: 28px;
  --text-headline-md--line-height: 1.2;
  --text-headline-md--font-weight: 600;
  --text-headline-md--letter-spacing: -0.02em;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  --spacing-gutter: 24px;
}
```

Rules: `colors.x` becomes `--color-x`, so `bg-primary`, `text-on-surface`
work. Each typography level becomes `--text-<level>` plus the
`--text-<level>--line-height`, `--font-weight` and `--letter-spacing`
modifiers, so `text-headline-md` sets all of them. `rounded.x` becomes
`--radius-x`. Named spacing tokens become `--spacing-<name>`; do not replace
Tailwind's numeric spacing scale, add to it. Fonts become `--font-<name>`.
Dark overrides: a `.dark` or `@media (prefers-color-scheme: dark)` block that
reassigns the same `--color-*` variables outside `@theme`, or `@theme inline`
with variables that point at `:root` custom properties when the project
already switches themes that way.

### CSS variables

```css
:root {
  --color-primary: #2665fd;
  --color-surface: #0b1326;
  --color-on-surface: #dae2fd;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --text-body-md-size: 16px;
  --text-body-md-line-height: 1.5;
  --radius-md: 8px;
  --space-4: 16px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #05070f;
  }
}
```

Use the same prefixes as above so a later move to Tailwind is a rename-free
change. Components reference variables, never raw hex.

### Design tokens JSON

When the project has a tokens file, write the DESIGN.md tokens in the W3C
design tokens format the file already follows. Colors as `$type: "color"`,
dimensions as `$type: "dimension"`, typography levels as `$type:
"typography"` composites, references as `{colors.primary}` (the same syntax
DESIGN.md uses). Run the project's token build afterwards.

## 4. Wire the fonts

For each distinct `fontFamily` in `typography`:

- Check if it is already loaded (existing `@font-face`, `next/font`, a
  `<link>` to Google Fonts, a self-hosted file). Reuse it.
- Otherwise load it the way the project loads fonts. Next.js: `next/font/
  google` or `next/font/local` with a CSS variable and `display: "swap"`.
  Plain HTML or Vite: a Google Fonts `<link>` with `preconnect`, or
  self-hosted `@font-face` with `font-display: swap`.
- Load only the weights the typography levels use.
- Always give the family a fallback stack (`ui-sans-serif, system-ui,
  sans-serif` or `ui-serif, Georgia, serif` or `ui-monospace, monospace`).
- If the font is proprietary and not available, pick the closest open font
  with the same classification and x-height, and say so in your summary.

## 5. Apply the component recipes

For each entry in `components` and each component described in the body:

1. Find the project's existing component (Button, Input, Card). Restyle it;
   do not create a parallel component.
2. Apply the resolved token values through the mapping from step 3 (utility
   classes or variables), never inline hex or px.
3. State variants (`button-primary-hover`, `-active`, `-disabled`) map onto
   `hover:`, `active:`, `disabled:` or the matching selectors.
4. Follow the body for what the tokens do not cover: shadow versus border
   (Elevation & Depth), radius per element (Shapes), padding from the
   spacing scale (Layout).
5. Where the project has a component the DESIGN.md does not mention, derive
   it from the closest recipe and the Overview, and list it as an assumption.

Keep the diff focused: tokens, fonts, the components the DESIGN.md covers,
and the layout constants (content width, gutters). Do not rewrite unrelated
markup.

## 6. Verify visually

1. Run the project (its dev command) and open the main screens.
2. Take screenshots if a browser tool is available; otherwise describe what
   to check and ask the user to look.
3. Compare against the reference site and the DESIGN.md: palette on the
   main surfaces, the headline and body fonts actually rendering (check the
   network tab or computed styles, not just the CSS), radii, spacing rhythm,
   button states.
4. Check text contrast against the surfaces (at least 4.5:1 for body text,
   3:1 for large text) and fix with the nearest scale token, not a new color.
5. Walk through the Do's and Don'ts and confirm none is violated.
6. Run the project's lint and type checks.

Finish with a short summary: tokens added, fonts loaded, components
restyled, assumptions made, and anything the DESIGN.md left open.
