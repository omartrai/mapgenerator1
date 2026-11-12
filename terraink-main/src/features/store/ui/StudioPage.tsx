import { useEffect, useState } from "react";
import AppShell from "@/shared/ui/AppShell";
import { useRouter } from "@/core/router/router";
import { adminApi, geocodeLocation } from "@/core/services";
import { useDesignSnapshot } from "../application/useDesignSnapshot";
import { useProductSync } from "../application/useProductSync";
import { FRAME_OPTIONS, PRINT_SIZES, frameDepthOf, hasMat, resolveDimensions, type FrameId } from "../domain/catalog";
import { DESIGN_PRESETS, getPreset } from "../domain/presets";
import AddedToCartDialog from "./AddedToCartDialog";
import AdminExportPanel from "./AdminExportPanel";
import PurchasePanel from "./PurchasePanel";
import RoomDecor from "./RoomDecor";
import { useSkyPoster } from "@/features/sky/application/useSkyPoster";
import SizeFrameSection from "./SizeFrameSection";
import StoreHeader from "./StoreHeader";
import StudioStepFooter from "./StudioStepFooter";
import StudioStepHeader from "./StudioStepHeader";
import StudioViewToggle from "./StudioViewToggle";
import { useStore } from "./StoreContext";
import { openSettingsTab } from "@/shared/ui/settingsTabs";

/**
 * The poster studio: the existing map editor wrapped with guided steps,
 * product options, a live framed preview and the buy box.
 *
 * URL options: ?preset=<id> starts from a featured design, ?edit=<cartItemId>
 * reopens a cart item, ?place=<query> starts on a searched place,
 * ?order=<number>&item=<id> loads an order for admins.
 */
export default function StudioPage() {
  const store = useStore();
  const { search, navigate } = useRouter();
  const { applyPreset, applyDesign } = useDesignSnapshot();
  const [loadError, setLoadError] = useState("");
  // The map must mount with the final design already in state; otherwise its
  // first "moveend" at the old position overwrites the loaded coordinates.
  const [isReady, setIsReady] = useState(
    () =>
      !search.get("preset") &&
      !search.get("edit") &&
      !search.get("order") &&
      !search.get("place"),
  );
  useProductSync(store.product);
  const skyPoster = useSkyPoster();
  // /create?type=sky starts a night-sky poster; ?type=sport opens the Routes
  // tab, where a GPX file becomes a sport poster.
  useEffect(() => {
    const type = search.get("type");
    if (type === "sky") skyPoster.setKind("sky");
    if (type !== "sport") return undefined;
    // The shell starts listening once it has mounted.
    const timer = window.setTimeout(() => openSettingsTab({ tab: "routes" }), 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchKey = search.toString();
  const [showStartup] = useState(
    () =>
      !store.hasStartedDesign &&
      !search.get("preset") &&
      !search.get("edit") &&
      !search.get("order") &&
      !search.get("place"),
  );

  useEffect(() => {
    store.markDesignStarted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const presetId = search.get("preset");
    const editId = search.get("edit");
    const orderNumber = search.get("order");
    const itemId = search.get("item");
    const place = search.get("place")?.trim();

    if (place) {
      let cancelled = false;
      geocodeLocation(place)
        .then((found) => {
          if (cancelled) return;
          applyPreset({
            ...(getPreset("paris") ?? DESIGN_PRESETS[0]),
            location: found.label,
            lat: found.lat,
            lon: found.lon,
            city: found.city || place,
            country: found.country || "",
            product: store.product,
          });
        })
        .catch(() => undefined)
        .finally(() => {
          if (cancelled) return;
          setIsReady(true);
          navigate("/create", { replace: true });
        });
      return () => {
        cancelled = true;
      };
    }

    if (presetId) {
      const found = getPreset(presetId);
      if (found) {
        // ?size= and ?frame= come from the homepage frame/format picker.
        const size = search.get("size");
        const frame = search.get("frame");
        const product = {
          ...found.product,
          ...(size && PRINT_SIZES.some((entry) => entry.id === size) ? { sizeId: size } : {}),
          ...(frame && FRAME_OPTIONS.some((entry) => entry.id === frame)
            ? { frameId: frame as FrameId }
            : {}),
        };
        const preset = { ...found, product };
        applyPreset(preset);
        store.setProduct(product);
        store.setEditingItemId(null);
        store.setAdminTask(null);
      }
      setIsReady(true);
      navigate("/create", { replace: true });
      return;
    }

    if (editId) {
      const item = store.cart.find((entry) => entry.id === editId);
      if (item?.design) {
        applyDesign(item.design);
        store.setProduct(item.product);
        store.setEditingItemId(item.id);
        store.setAdminTask(null);
      }
      setIsReady(true);
      navigate("/create", { replace: true });
      return;
    }

    if (orderNumber && itemId) {
      if (!adminApi.hasSession()) {
        navigate("/admin", { replace: true });
        return;
      }
      let cancelled = false;
      adminApi
        .getOrder(orderNumber)
        .then(({ order }) => {
          if (cancelled) return;
          const item = order.items.find((entry) => entry.id === itemId);
          if (!item || !item.design) {
            setLoadError(item ? "This poster comes from the collection: no print file to generate." : "This order item no longer exists.");
            return;
          }
          applyDesign(item.design);
          store.setProduct(item.product);
          store.setEditingItemId(null);
          store.setAdminTask({ orderNumber: order.number, itemId: item.id });
          setIsReady(true);
        })
        .catch((error: Error) => !cancelled && setLoadError(error.message));
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  // Leaving the studio ends an admin print session.
  useEffect(() => () => store.setAdminTask(null), [store.setAdminTask]);

  const adminTask = store.adminTask;

  if (!isReady) {
    return (
      <div className="studio-loading">
        {loadError ? <p role="alert">{loadError}</p> : <p>Loading the design…</p>}
      </div>
    );
  }

  return (
    <AppShell
      header={<StoreHeader variant="studio" />}
      sizeSection={<SizeFrameSection />}
      panelHeader={(tab, setTab) => <StudioStepHeader tab={tab} setTab={setTab} />}
      panelFooter={(tab, setTab) => (adminTask ? null : <StudioStepFooter tab={tab} setTab={setTab} />)}
      actionArea={({ isMobile }) =>
        adminTask ? (
          <AdminExportPanel task={adminTask} isMobile={isMobile} />
        ) : (
          <PurchasePanel isMobile={isMobile} />
        )
      }
      belowPoster={
        <>
          <RoomDecor />
          <StudioViewToggle />
        </>
      }
      showStartupModal={showStartup}
      initialTab={showStartup ? "theme" : "location"}
      locationAsTab
      dataAttributes={{
        "data-store-studio": "true",
        "data-frame": store.product.frameId,
        "data-mat": hasMat(store.product) ? "true" : "false",
        "data-scene": store.scene,
        "data-orientation": store.product.orientation,
        "data-depth": store.product.frameId === "none" ? "none" : frameDepthOf(store.product),
        "data-poster-kind": skyPoster.isSky ? "sky" : "map",
      }}
      style={
        {
          "--poster-w-cm": resolveDimensions(store.product).widthCm,
          "--poster-h-cm": resolveDimensions(store.product).heightCm,
        } as React.CSSProperties
      }
    >
      {loadError ? (
        <p className="studio-load-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <AddedToCartDialog />
    </AppShell>
  );
}
