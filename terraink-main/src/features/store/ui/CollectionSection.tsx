import { LuChevronRight } from "react-icons/lu";
import { Link } from "@/core/router/router";
import { useCollection } from "../application/useCollection";
import CollectionCard from "./CollectionCard";
import { useStoreText } from "./storeText";

const HOME_LIMIT = 8;

/** Homepage block with the first ready-made posters; hidden when there are none. */
export default function CollectionSection() {
  const { t } = useStoreText();
  const { products, status } = useCollection();
  if (status === "error" || (status === "ready" && products.length === 0)) return null;

  return (
    <section className="home-block collection-block" id="collection" aria-labelledby="collection-title">
      <div className="home-head">
        <div>
          <p className="collection-eyebrow">{t("collection.eyebrow")}</p>
          <h2 id="collection-title" className="home-heading">{t("collection.title")}</h2>
          <span className="home-rule" aria-hidden="true" />
        </div>
        <Link to="/collection" className="collection-viewall">
          {t("collection.viewAll")} <LuChevronRight className="rtl-flip" aria-hidden="true" />
        </Link>
      </div>
      <div className="collection-grid" aria-busy={status === "loading"}>
        {status === "loading"
          ? Array.from({ length: 4 }, (_, index) => <div key={index} className="collection-card is-skeleton" />)
          : products.slice(0, HOME_LIMIT).map((product) => <CollectionCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
