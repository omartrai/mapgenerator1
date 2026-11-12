import { lazy, Suspense, useEffect } from "react";
import { matchPath, useRouter } from "@/core/router/router";
import StorefrontPage from "@/features/store/ui/StorefrontPage";

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

const TITLES: [RegExp, string][] = [
  [/^\/create/, "Design your poster — Noria"],
  [/^\/cart/, "Your cart — Noria"],
  [/^\/checkout/, "Checkout — Noria"],
  [/^\/order\//, "Order confirmed — Noria"],
  [/^\/admin/, "Orders — Noria admin"],
  [/^\/collection$/, "The collection — Noria"],
  [/^\/suivi/, "Suivre ma commande — Noria"],
];

function PageFallback() {
  return <div className="page-fallback" aria-busy="true" />;
}

export default function AppRouter() {
  const { path } = useRouter();

  useEffect(() => {
    document.title =
      TITLES.find(([pattern]) => pattern.test(path))?.[1] ??
      "Noria — Personalised map posters";
    document.documentElement.dataset.route = path === "/create" ? "studio" : "store";
  }, [path]);

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

  return <Suspense fallback={<PageFallback />}>{page}</Suspense>;
}
