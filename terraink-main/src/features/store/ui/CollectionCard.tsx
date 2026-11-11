import { LuArrowRight } from "react-icons/lu";
import { Link } from "@/core/router/router";
import type { CollectionProduct } from "../domain/collection";
import { useStoreText } from "./storeText";

/** One ready-made poster in a grid: photo, title and starting price. */
export default function CollectionCard({
  product,
  size = "",
}: {
  product: CollectionProduct;
  /** When a format filter is on, show the price in that format and open it. */
  size?: string;
}) {
  const { t, money } = useStoreText();
  const inSize = product.variants.filter((variant) => variant.size === size);
  // Room mockup first; on hover, the next mockup (or the flat artwork).
  const [firstMockup, secondMockup] = product.mockups ?? [];
  const cover = firstMockup || product.image;
  const hover = firstMockup ? secondMockup || product.image : "";
  const startingPrice = inSize.length ? Math.min(...inSize.map((variant) => variant.price)) : product.fromPrice;
  return (
    <Link to={`/collection/${product.id}${size ? `?size=${encodeURIComponent(size)}` : ""}`} className="collection-card">
      <div className={`collection-card__visual${hover ? " has-hover" : ""}`}>
        <img
          className="collection-card__cover"
          src={cover}
          alt={product.title}
          loading="lazy"
          decoding="async"
        />
        {hover ? (
          <img className="collection-card__alt" src={hover} alt="" loading="lazy" decoding="async" aria-hidden="true" />
        ) : null}
      </div>
      <div className="collection-card__body">
        <h3 className="collection-card__title">{product.title}</h3>
        <p className="collection-card__price">
          {t("collection.from", { amount: money(startingPrice) })}
          <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </p>
      </div>
    </Link>
  );
}
