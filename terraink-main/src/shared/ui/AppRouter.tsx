import { lazy, Suspense, useEffect } from "react";
import { matchPath, useRouter } from "@/core/router/router";
import { useScrollReveal } from "@/shared/hooks/useScrollReveal";
import StorefrontPage from "@/features/store/ui/StorefrontPage";
import { useStoreText, type StoreTextKey } from "@/features/store/ui/storeText";
import WhatsAppButton from "@/features/store/ui/WhatsAppButton";

const StudioPage = lazy(() => import("@/features/store/ui/StudioPage"));
const CartPage = lazy(() => import("@/features/store/ui/CartPage"));
const CheckoutPage = lazy(() => import("@/features/store/ui/CheckoutPage"));
const OrderConfirmationPage = lazy(() => import("@/features/store/ui/OrderConfirmationPage"));
const CollectionPage = lazy(() => import("@/features/store/ui/CollectionPage"));
const CollectionProductPage = lazy(() => import("@/features/store/ui/CollectionProductPage"));
const AdminOrdersPage = lazy(() => import("@/features/store/ui/AdminOrdersPage"));
const AdminReviewsPage = lazy(() => import("@/features/store/ui/AdminReviewsPage"));
const TrackOrderPage = lazy(() => import("@/features/store/ui/TrackOrderPage"));
const LegalPage = lazy(() => import("@/features/store/ui/LegalPage"));
const AdminOrderPage = lazy(() => import("@/features/store/ui/AdminOrderPage"));

const NotFoundPage = lazy(() => import("@/features/store/ui/NotFoundPage"));

/** Browser tab title per page, in the site language. */
const TITLES: [RegExp, StoreTextKey][] = [
  [/^\/create/, "title.create"],
  [/^\/cart/, "title.cart"],
  [/^\/checkout/, "title.checkout"],
  [/^\/order\//, "title.order"],
  [/^\/collection$/, "title.collection"],
  [/^\/suivi/, "title.track"],
];

/** Addresses that show the home page; anything unknown gets the 404 page. */
const HOME_PATHS = new Set(["/", "/index.html", "/faq", "/modeles"]);

function PageFallback() {
  return <div className="page-fallback" aria-busy="true" />;
}

/** Routes handled by a page (not the 404). */
function isKnownPath(path: string): boolean {
  return (
    HOME_PATHS.has(path) ||
    /^\/(create|cart|checkout|collection|suivi|admin)(\/|$)/.test(path) ||
    /^\/(order|legal)\//.test(path)
  );
}

export default function AppRouter() {
  const { path } = useRouter();
  const { t } = useStoreText();
  useScrollReveal(path);

  useEffect(() => {
    const key = TITLES.find(([pattern]) => pattern.test(path))?.[1];
    document.title = path.startsWith("/admin")
      ? "Orders — Noria admin"
      : t(key ?? (isKnownPath(path) ? "title.home" : "title.notFound"));
    document.documentElement.dataset.route = path === "/create" ? "studio" : "store";
  }, [path, t]);

  let page = <StorefrontPage />;
  let params: Record<string, string> | null;

  if (path === "/create") page = <StudioPage />;
  else if (path === "/cart") page = <CartPage />;
  else if (path === "/checkout") page = <CheckoutPage />;
  else if ((params = matchPath("/order/:number", path))) page = <OrderConfirmationPage number={params.number} />;
  else if (path === "/collection") page = <CollectionPage />;
  else if ((params = matchPath("/collection/:id", path))) page = <CollectionProductPage id={Number(params.id)} />;
  else if (path === "/suivi") page = <TrackOrderPage />;
  else if ((params = matchPath("/legal/:slug", path))) page = <LegalPage slug={params.slug} />;
  else if (path === "/admin") page = <AdminOrdersPage />;
  else if (path === "/admin/reviews") page = <AdminReviewsPage />;
  else if ((params = matchPath("/admin/orders/:number", path))) page = <AdminOrderPage number={params.number} />;
  else if (!HOME_PATHS.has(path)) page = <NotFoundPage />;

  // The studio has its own bottom bars, and admin is internal.
  const showWhatsApp = path !== "/create" && !path.startsWith("/admin");

  return (
    <>
      <Suspense fallback={<PageFallback />}>{page}</Suspense>
      {showWhatsApp ? <WhatsAppButton /> : null}
    </>
  );
}
