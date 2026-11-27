import { useEffect, useRef, useState } from "react";
import { POSTER_STYLES, usePosterStyles, type PosterStyleId } from "@/features/poster/application/usePosterStyles";
import { SKY_SHAPES, type SkyShape } from "@/features/sky/domain/chart";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
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
import { useActivityPoster, type SportDesign } from "@/features/routes/application/useActivityPoster";
import { SPORT_LAYOUTS } from "@/features/poster/domain/posterLayout";

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
  // /create?type=sky starts a night-sky poster; ?type=sport or ?type=trail a
  // sport or trail poster (optionally &design=bold), on the route step.
  const activityPoster = useActivityPoster();
  // The address seen last time, to tell a click on "Créer un poster" from
  // the studio cleaning its own address after loading a design.
  const lastSearchRef = useRef<URLSearchParams | null>(null);
  useEffect(() => {
    const previous = lastSearchRef.current;
    lastSearchRef.current = search;
    const loadedDesign = ["preset", "edit", "order", "place"].some((key) => previous?.get(key));
    const type = search.get("type");
    // A plain /create ("Créer un poster") always opens on a city map, even
    // after a sky, sport or trail poster earlier in the visit, and even when
    // the studio is already open (the address changes, the page stays).
    const plain = !type && !["preset", "edit", "order", "place", "style"].some((key) => search.get(key));
    if (plain && !loadedDesign && skyPoster.kind !== "map") skyPoster.setKind("map");
    if (type === "sky") {
      skyPoster.setKind("sky");
      // ?type=sky&shape=watercolor (or another chart shape)
      const shape = search.get("shape");
      if (shape && (SKY_SHAPES as readonly string[]).includes(shape)) skyPoster.chooseShape(shape as SkyShape);
    }
    if (type === "trail") activityPoster.applyDesign("topo");
    if (type === "sport") {
      const design = search.get("design");
      activityPoster.applyDesign(
        design && (SPORT_LAYOUTS as readonly string[]).includes(design) ? (design as SportDesign) : "race",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.toString()]);

  const searchKey = search.toString();
  const [showStartup] = useState(
    () =>
      !store.hasStartedDesign &&
      !search.get("preset") &&
      !search.get("edit") &&
      !search.get("order") &&
      !search.get("place") &&
      // Sport and trail posters start from a route, not a place.
      !["sport", "trail"].includes(search.get("type") ?? ""),
  );

  // /create?style=twin (heart, photo, twin, venn; &colour=navy for venn):
  // a ready-made style, applied once the start pop-up has set the place so
  // its heart pin lands on the chosen city.
  const posterStyles = usePosterStyles();
  const { dispatch: posterDispatch } = usePosterContext();
  const [styleGo, setStyleGo] = useState(() => !showStartup);
  useEffect(() => {
    const style = search.get("style");
    if (!styleGo || !style || !(POSTER_STYLES as readonly string[]).includes(style)) return;
    posterStyles.apply(style as PosterStyleId);
    if (style === "venn" && search.get("colour") === "navy") {
      posterDispatch({ type: "SET_THEME", themeId: "venn_navy" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleGo]);

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
      mobileBarExtra={<StudioViewToggle />}
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
      onStartupComplete={() => setStyleGo(true)}
      initialTab="location"
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
