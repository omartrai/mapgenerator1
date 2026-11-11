import { useEffect, useState } from "react";
import AppShell from "@/shared/ui/AppShell";
import { useRouter } from "@/core/router/router";
import { adminApi } from "@/core/services";
import { useDesignSnapshot } from "../application/useDesignSnapshot";
import { useProductSync } from "../application/useProductSync";
import { getPreset } from "../domain/presets";
import AddedToCartDialog from "./AddedToCartDialog";
import AdminExportPanel from "./AdminExportPanel";
import PurchasePanel from "./PurchasePanel";
import SizeFrameSection from "./SizeFrameSection";
import StoreHeader from "./StoreHeader";
import StudioStepHeader from "./StudioStepHeader";
import StudioViewToggle from "./StudioViewToggle";
import { useStore } from "./StoreContext";

/**
 * The poster studio: the existing map editor wrapped with guided steps,
 * product options, a live framed preview and the buy box.
 *
 * URL options: ?preset=<id> starts from a featured design, ?edit=<cartItemId>
 * reopens a cart item, ?order=<number>&item=<id> loads an order for admins.
 */
export default function StudioPage() {
  const store = useStore();
  const { search, navigate } = useRouter();
  const { applyPreset, applyDesign } = useDesignSnapshot();
  const [loadError, setLoadError] = useState("");
  // The map must mount with the final design already in state; otherwise its
  // first "moveend" at the old position overwrites the loaded coordinates.
  const [isReady, setIsReady] = useState(
    () => !search.get("preset") && !search.get("edit") && !search.get("order"),
  );
  useProductSync(store.product);

  const searchKey = search.toString();
  const [showStartup] = useState(
    () =>
      !store.hasStartedDesign &&
      !search.get("preset") &&
      !search.get("edit") &&
      !search.get("order"),
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

    if (presetId) {
      const preset = getPreset(presetId);
      if (preset) {
        applyPreset(preset);
        store.setProduct(preset.product);
        store.setEditingItemId(null);
        store.setAdminTask(null);
      }
      setIsReady(true);
      navigate("/create", { replace: true });
      return;
    }

    if (editId) {
      const item = store.cart.find((entry) => entry.id === editId);
      if (item) {
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
          if (!item) {
            setLoadError("This order item no longer exists.");
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
      actionArea={({ isMobile }) =>
        adminTask ? (
          <AdminExportPanel task={adminTask} isMobile={isMobile} />
        ) : (
          <PurchasePanel isMobile={isMobile} />
        )
      }
      belowPoster={<StudioViewToggle />}
      showStartupModal={showStartup}
      initialTab={showStartup ? "theme" : "location"}
      locationAsTab
      dataAttributes={{
        "data-store-studio": "true",
        "data-frame": store.product.frameId,
        "data-scene": store.scene,
        "data-orientation": store.product.orientation,
      }}
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
