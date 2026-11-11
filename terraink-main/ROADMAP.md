# Roadmap

## SEO & Discoverability

- [ ] **Google Search Console** — Submit sitemap, monitor indexing, and track keyword performance (see setup steps below)
- [ ] **Blog / content pages** — Add server-rendered pages (e.g. "How to create a free map poster") to drive organic traffic; an SPA alone is limited since Google mostly sees a single URL
- [ ] **Submit to directories** — List Terraink on Product Hunt, AlternativeTo, Futurepedia, and similar design-tool directories
- [ ] **OpenStreetMap community** — Showcase Terraink in OSM forums, wiki tool pages, and community channels
- [ ] **Backlink outreach** — Reach out to map/design blogs for reviews or mentions
- [ ] **Social media presence** — Regular posts showcasing poster examples on Instagram, Reddit (r/MapPorn, r/Design), and X/Twitter to build domain authority

## Code Quality

- [ ] **TypeScript strict mode** — Migrate to `strict: true` and remove `allowJs`; currently gradual (`strict: false`, `allowJs: true`)
- [ ] **Fix pre-existing type errors** — `pngExporter.ts`, `StartupLocationModal.tsx`, `typography.ts` have unresolved TS errors

## Features

- [ ] **Expand export formats** — Additional export options or quality settings beyond current PNG, PDF, SVG
- [ ] **Markers improvements** — Enhance the `markers` feature (custom icons, bulk import, etc.)
- [ ] **Theme gallery** — Browsable theme previews to make discovery easier
- [ ] **Accessibility audit** — Ensure full keyboard navigation and screen reader support across all features

## Google Search Console Setup

1. Go to https://search.google.com/search-console
2. Click **Add Property** and choose **URL prefix** method
3. Enter `https://terraink.app`
4. Verify ownership using one of these methods:
   - **HTML meta tag** (easiest): Add the verification `<meta>` tag Google gives you to `index.html` `<head>`
   - **DNS TXT record**: Add a TXT record to your domain's DNS settings
   - **HTML file**: Upload a verification HTML file to `public/`
5. Once verified:
   - Go to **Sitemaps** in the left sidebar
   - Submit `https://terraink.app/sitemap.xml`
   - Go to **URL Inspection** and request indexing for `https://terraink.app`
6. Monitor the **Performance** tab for keyword impressions, clicks, and average position
