# Maploom store — architecture and operations

Maploom is a shop for personalised map posters. Customers design a poster in
the studio, add it to the cart, check out with their delivery details and pay
on delivery. The owner receives each order with the customer's exact design
and produces print-ready files from it for an external print-and-ship service.

## Customer journey

| Route | Page | What happens |
| --- | --- | --- |
| `/` | Storefront | Hero slider, shop by frame, offers, popular designs (Morocco / World), sizes and prices, FAQ |
| `/create` | Studio | The map editor with guided steps: Place → Style → Text → Size & frame, plus optional extras (map details, markers, routes). A live framed preview and the buy box show the price. |
| `/create?preset=<id>` | Studio | Starts from a featured design (`src/features/store/domain/presets.ts`) |
| `/create?edit=<cartItemId>` | Studio | Reopens a cart item for editing ("Update cart item") |
| `/cart` | Cart | Quantities, edit/remove, free-shipping progress, totals |
| `/checkout` | Checkout | Name, phone (Moroccan format when the country is Morocco), email, address, city, optional postal code, country, delivery instructions; cash on delivery |
| `/order/<number>?key=<accessKey>` | Confirmation | Order summary; the key in the link is the customer's private access key |

## Admin

| Route | What it does |
| --- | --- |
| `/admin` | Password sign-in, order list with status filters, search and totals |
| `/admin/orders/<number>` | Customer and contact details, shipping address (copy button), payment status, every poster's full configuration, customer preview, print files, fulfillment status, print-partner reference, tracking link, internal notes, history, design JSON download |
| `/create?order=<number>&item=<id>` | Opened from "Generate print files": loads the customer's exact saved design and renders print files: PNG at 300 DPI (up to about 36 MP), PDF at print size, and a layered vector SVG. Each file is saved with the order and downloaded. |

### Workflow for fulfilling an order

1. Open `/admin` and select the new order.
2. Click **Generate print files** for each poster, then **PNG · 300 DPI**
   (and PDF/SVG if your print partner prefers them).
3. Place the order with your print-and-ship service using the downloaded file
   and the shipping address (use **Copy**).
4. Set the status to **Sent to print**, add the partner's order reference and,
   once shipped, the tracking link.

## Configuration (Vercel project → Settings → Environment Variables)

| Variable | Required | Purpose |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | yes | Added automatically when a Vercel Blob store is connected to the project. All order data is stored in it as **private** blobs. |
| `ADMIN_PASSWORD` | yes | Password for `/admin`. Use a long random value. Without it the admin API refuses every request. |
| `ORDER_WEBHOOK_URL` | no | Incoming webhook (Slack, Discord, Zapier, Make, n8n…) that gets a message for every new order. |
| `FULFILLMENT_PROVIDER` | no | Defaults to `manual`. Reserved for future print-on-demand integrations. |

Prices, sizes, frames, shipping and currency are all in
`src/features/store/domain/catalog.ts`. The server recalculates every price
from that file, so the browser can't change them.

Prices are in Moroccan dirhams (MAD, stored in centimes) and display as
"199 DH" (or "199 درهم" in Arabic).

### Languages

The shop is available in French (default), Arabic (right-to-left) and English,
using the same language setting as the editor. Shop copy lives in
`src/features/store/ui/storeText.ts`; add a key to all three dictionaries
when you add text. The admin pages stay in English.

## Architecture

```text
src/features/store/
  domain/          catalog (prices), design snapshot, order model, validation, presets
  application/     useAddToCart, useDesignSnapshot, useProductSync, useCheckout,
                   usePrintFiles, useAdmin
  infrastructure/  cartStorage (localStorage), ordersApi (HTTP client)
  ui/              Storefront, Studio wrapper, Cart, Checkout, Confirmation, Admin
server/
  router.ts        all /api routes (Web Request → Response)
  orders.ts        order service: validation, pricing, numbering, files, history
  storage/         IOrderStorage port + Vercel Blob (prod) and filesystem (dev) adapters
  fulfillment/     IFulfillmentProvider port + the manual provider (webhook notifications)
api/index.ts       the single Vercel Function; vercel.json rewrites /api/* to it
```

* **The existing editor is reused unchanged at its core.** `AppShell` gained
  slots (header, size tab, step header, buy box, side panel) and `useExport`
  was split into `renderPosterCanvas` and `createPosterFile`, so previews,
  downloads and print files all come from the same rendering pipeline.
* **Exact design preservation.** Each cart item and order item stores a
  `PosterDesign` snapshot: the full editor form (coordinates, framing
  distance, theme, text, font, layers), colour overrides, markers, routes,
  custom icons and map rotation. `LOAD_DESIGN` restores it into the editor,
  which is how print files are generated, even months later.
* **Security.** Order data lives in private Blob storage, reachable only
  through the API. Customers can read only their own order, using the random
  access key in their confirmation link. Admin endpoints need `ADMIN_PASSWORD`
  (constant-time comparison). Prices are recalculated on the server, and
  checkout has a honeypot field.

### Adding a print-on-demand integration later

1. Implement `IFulfillmentProvider` (`server/fulfillment/ports.ts`), for
   example a Gelato, Prodigi or Printful client, in `server/fulfillment/`.
2. Register it in `createFulfillmentProvider` and select it with
   `FULFILLMENT_PROVIDER`.
3. Call `provider.submit(order)` from a new admin endpoint (or automatically
   after the print file is saved), then store the returned reference in
   `order.fulfillment`.

The order already carries everything such an API needs: the print file, the
product (size, orientation, frame), quantity and the shipping address.

## Local development

```bash
npm install
npm run dev
```

`vite dev` serves the same `/api` routes. Without `BLOB_READ_WRITE_TOKEN`,
orders are written to `./.data/` (git-ignored) and the admin password is
`admin`.
