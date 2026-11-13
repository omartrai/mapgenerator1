# Noria design contract

Noria is a working map-poster studio, not a generic landing page. The interface should feel quiet, precise, and useful enough for long editing sessions.

## Foundations

- `--font-display`: `"Instrument Sans", sans-serif`
- `--font-body`: `"Instrument Sans", sans-serif`
- `--font-mono`: `"Spline Sans Mono", monospace`
- `--accent`: `#526f60` — restrained sage, reserved for selection and confirmation
- `--ink`: `#171816`
- `--surface`: `#ffffff`
- `--surface-muted`: `#f7f6f2`
- `--canvas`: `#e8e8e6`
- `--line`: `#e5e3de`

## Product-specific character

- The black tool rail, white editor pane, and gray poster stage are the recognizable Noria composition.
- Poster controls should feel like print-production tools: compact, labeled, and reversible.
- Export copy uses concrete formats and actions; avoid vague CTA language.
- Button presses move down by 2px. Selected tools use a narrow indicator or a clear border, not a glow.

## Component foundation

- DaisyUI v5 provides semantic primitives (`navbar`, `btn`, `input`, `card`, and `modal-box`).
- The only enabled theme is the custom `noria` theme in `src/styles/daisy.css`.
- Existing product classes remain the final styling authority so component adoption can be incremental and regression-safe.
- Prefer a DaisyUI semantic class plus one product class over long Tailwind utility chains.

## Guardrails

- No default indigo or purple accents.
- No decorative trust gradients, blobs, or waves.
- No emoji icons; use `react-icons/fi` monoline icons with `currentColor`.
- No invented performance or popularity metrics.
- No filler copy or external placeholder-image services.
- No rounded card with a colored left border.
- Keep visible accent use sparse; neutral surfaces carry the interface.
- Key editor regions include stable `data-od-id` attributes.

## Storefront (shop pages)

- Tokens live in `src/styles/store.css` (`--s-*`); later layers override them: `premium.css`, then `refresh.css` (loaded last; the current look).
- White page, light header with uppercase nav links, a dark "Cart (n)" pill and a green "Design poster" pill.
- The home page opens with a rounded sage card (`--s-hero-card`) that holds the header and the hero: a heavy uppercase headline, a place search, category chips and three framed posters.
- Headings, poster names and prices use Fraunces 600 (`--s-display`) in sentence case; body text and buttons stay in Plus Jakarta Sans.
- Cards are white with a hairline and 16–20px corners; buttons and chips are pills in sentence case.
- `--s-accent` is the brand green `#1f3b33` for actions and selection. No orange in the interface.
- Only real numbers in the interface (catalogue counts, prices); never invented reviews or customer counts.
