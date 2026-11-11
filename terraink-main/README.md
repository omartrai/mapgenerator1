# Maploom

Maploom turns any location into customizable, print-ready map art. Search for a
place, pick a visual theme, refine map layers and typography, add markers, and
export the finished poster as PNG, PDF, or layered SVG.

## Features

- Worldwide place search and browser geolocation
- Curated themes plus editable colors for roads, water, parks, and buildings
- Portrait, landscape, square, phone, and custom poster formats
- Custom title, subtitle, coordinates, fonts, and text placement
- Draggable markers and route overlays
- High-resolution PNG, PDF, and layered SVG exports
- Responsive desktop and mobile editing experiences
- Client-side operation with no account required

## Development

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run typecheck
npm run build
```

## Mapping stack

- Map data: OpenStreetMap contributors
- Vector tiles: OpenMapTiles / OpenFreeMap
- Renderer: MapLibre GL JS
- Geocoding: Nominatim

## License and attribution

Maploom is derived from [Terraink](https://github.com/yousifamanuel/terraink)
by Yousuf Amanuel. The source is distributed under the GNU AGPL-3.0 license;
see [LICENSE](./LICENSE). The Terraink name, logo, and visual identity are not
used by this project.

Map data is © OpenStreetMap contributors and licensed under ODbL. MapLibre GL
JS is licensed under BSD-3-Clause. Bundled typefaces retain their respective
SIL Open Font License notices in `public/licenses/fonts.txt`.
