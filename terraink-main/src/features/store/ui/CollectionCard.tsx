import { LuArrowRight } from "react-icons/lu";
import { Link } from "@/core/router/router";
import type { CollectionProduct } from "../domain/collection";
import { useStoreText } from "./storeText";

/** One ready-made poster in a grid: photo, title and starting price. */
export default function CollectionCard({ product }: { product: CollectionProduct }) {
  const { t, money } = useStoreText();
  return (
    <Link to={`/collection/${product.id}`} className="collection-card">
      <div className="collection-card__visual">
        <img src={product.image} alt={product.title} loading="lazy" decoding="async" />
      </div>
      <div className="collection-card__body">
        <h3 className="collection-card__title">{product.title}</h3>
        <p className="collection-card__price">
          {t("collection.from", { amount: money(product.fromPrice) })}
          <LuArrowRight className="rtl-flip" aria-hidden="true" />
        </p>
      </div>
    </Link>
  );
}
