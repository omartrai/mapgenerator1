import { useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuBanknote, LuFrame, LuShoppingBag, LuTruck } from "react-icons/lu";
import { Link, useRouter } from "@/core/router/router";
import { useCollectionProduct } from "../application/useCollection";
import { formatCollectionSize, type CollectionLine, type CollectionVariant } from "../domain/collection";
import { FREE_SHIPPING_THRESHOLD, type FrameId } from "../domain/catalog";
import { createId, type CartItem } from "../domain/cart";
import AddedToCartDialog from "./AddedToCartDialog";
import { useStore } from "./StoreContext";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

interface Selection {
  size: string;
  withMat: boolean;
  depth: number;
  color: FrameId;
}

/** Closest variant to the selection: same size first, then mat, then depth. */
function pickVariant(variants: CollectionVariant[], selection: Selection): CollectionVariant | undefined {
  const sameSize = variants.filter((variant) => variant.size === selection.size);
  return (
    sameSize.find((v) => v.withMat === selection.withMat && v.frameDepthCm === selection.depth) ??
    sameSize.find((v) => v.withMat === selection.withMat) ??
    sameSize[0] ??
    variants[0]
  );
}

/** /collection/:id — photos, options and price of one ready-made poster. */
export default function CollectionProductPage({ id }: { id: number }) {
  const { t, money, language } = useStoreText();
  const { addItem } = useStore();
  const { product, mockups, status } = useCollectionProduct(id);
  const { search } = useRouter();
  const wantedSize = search.get("size") ?? "";
  const [photo, setPhoto] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);

  const photos = useMemo(
    // Room mockups first (they sell the poster better); the flat artwork last.
    () => (product ? [...mockups.map((mockup) => mockup.url), product.image] : []),
    [product, mockups],
  );

  // Start on the cheapest option.
  useEffect(() => {
    if (!product) return;
    // No passe-partout: only frames without a mount are offered.
    const pool = product.variants.filter((v) => v.size === wantedSize && !v.withMat);
    const cheapest = (pool.length ? pool : product.variants).reduce((best, v) => (v.price < best.price ? v : best));
    setSelection({
      size: cheapest.size,
      withMat: false,
      depth: cheapest.frameDepthCm,
      color: cheapest.colors.includes("black") ? "black" : cheapest.colors[0],
    });
    setPhoto(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  useEffect(() => {
    if (product) document.title = `${product.title} — Noria`;
  }, [product]);

  const variant = product && selection ? pickVariant(product.variants, selection) : undefined;
  const sizeVariants = product && selection ? product.variants.filter((v) => v.size === selection.size) : [];
  const depthOptions = [...new Set(sizeVariants.filter((v) => v.withMat === selection?.withMat).map((v) => v.frameDepthCm))].sort();
  const colorOptions = variant?.colors ?? [];
  const color = selection && colorOptions.includes(selection.color) ? selection.color : colorOptions[0];

  // Keep the shown photo valid when the mockups arrive after the product.
  useEffect(() => {
    setPhoto(0);
  }, [mockups.length]);

  const addToCart = () => {
    if (!product || !variant || !color) return;
    const line: CollectionLine = {
      productId: product.id,
      variantIndex: variant.index,
      title: product.title,
      size: variant.size,
      withMat: variant.withMat,
      frameDepthCm: variant.frameDepthCm,
      frameColor: color,
      image: product.image,
      price: variant.price,
    };
    const item: CartItem = {
      id: createId(),
      product: { sizeId: variant.size, orientation: "portrait", frameId: color, mat: variant.withMat },
      quantity: 1,
      design: null,
      summary: {
        title: product.title,
        subtitle: formatCollectionSize(variant.size),
        themeId: "",
        themeName: "",
        fontFamily: "",
        latitude: 0,
        longitude: 0,
        distanceMeters: 0,
        markerCount: 0,
        routeCount: 0,
      },
      collection: line,
      previewDataUrl: product.image,
      addedAt: new Date().toISOString(),
    };
    addItem(item);
  };

  const cm = (value: number) => `${String(value).replace(".", language === "en" ? "." : ",")} cm`;

  return (
    <div className="store-page">
      <StoreHeader variant="site" />
      <main className="home-block collection-product">
        <Link to="/collection" className="collection-back">
          <LuArrowLeft className="rtl-flip" aria-hidden="true" /> {t("collection.back")}
        </Link>

        {status === "loading" ? <div className="collection-product__skeleton" aria-busy="true" /> : null}
        {status === "missing" ? <p className="collection-note">{t("collection.missing")}</p> : null}
        {status === "error" ? <p className="collection-note" role="alert">{t("collection.error")}</p> : null}

        {product && selection && variant ? (
          <div className="collection-product__layout">
            <div className="collection-gallery">
              <div className="collection-gallery__main">
                <img src={photos[photo]} alt={t("collection.alt", { title: product.title, n: photo + 1 })} />
              </div>
              {photos.length > 1 ? (
                <div className="collection-gallery__thumbs">
                  {photos.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      className={index === photo ? "is-active" : ""}
                      aria-label={t("collection.alt", { title: product.title, n: index + 1 })}
                      aria-current={index === photo}
                      onClick={() => setPhoto(index)}
                    >
                      <img src={url} alt="" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="collection-product__info">
              {product.category ? <p className="collection-eyebrow">{product.category}</p> : null}
              <h1 className="page-title">{product.title}</h1>
              <p className="collection-product__price">{money(variant.price)}</p>

              <div className="studio-buy__group">
                <h3 id="collection-size">{t("collection.size")}</h3>
                <div className="collection-options" role="radiogroup" aria-labelledby="collection-size">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={selection.size === size}
                      className={`buy-size${selection.size === size ? " is-selected" : ""}`}
                      onClick={() => setSelection({ ...selection, size })}
                    >
                      <strong>{formatCollectionSize(size)}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {depthOptions.length > 1 ? (
                <div className="studio-buy__group">
                  <h3 id="collection-depth">{t("collection.depth")}</h3>
                  <div className="collection-options" role="radiogroup" aria-labelledby="collection-depth">
                    {depthOptions.map((depth) => (
                      <button
                        key={depth}
                        type="button"
                        role="radio"
                        aria-checked={variant.frameDepthCm === depth}
                        className={`buy-size${variant.frameDepthCm === depth ? " is-selected" : ""}`}
                        onClick={() => setSelection({ ...selection, depth })}
                      >
                        <strong>{cm(depth)}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {colorOptions.length > 1 ? (
                <div className="studio-buy__group">
                  <h3 id="collection-color">{t("collection.color")}</h3>
                  <div className="studio-buy__frames collection-colors" role="radiogroup" aria-labelledby="collection-color">
                    {colorOptions.map((id) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={color === id}
                        className={`buy-frame${color === id ? " is-selected" : ""}`}
                        onClick={() => setSelection({ ...selection, color: id })}
                      >
                        <span className={`buy-frame__swatch buy-frame__swatch--${id}`} aria-hidden="true" />
                        <span className="buy-frame__label">{t(`frameShort.${id}` as StoreTextKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <button type="button" className="store-btn store-btn--primary store-btn--lg store-btn--block collection-add" onClick={addToCart}>
                <LuShoppingBag aria-hidden="true" /> {t("buy.add")} · {money(variant.price)}
              </button>

              <ul className="studio-buy__trust">
                <li><LuFrame aria-hidden="true" /> {t("collection.frame")}</li>
                <li><LuTruck aria-hidden="true" /> {t("buy.freeFrom", { amount: money(FREE_SHIPPING_THRESHOLD) })}</li>
                <li><LuBanknote aria-hidden="true" /> {t("buy.trust3")}</li>
              </ul>
            </div>
          </div>
        ) : null}
      </main>
      <AddedToCartDialog keepLabel={t("collection.keep")} />
      <StoreFooter />
    </div>
  );
}
