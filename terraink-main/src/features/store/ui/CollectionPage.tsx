import { useCollection } from "../application/useCollection";
import CollectionCard from "./CollectionCard";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText } from "./storeText";

/** /collection — every ready-made poster from the print partner. */
export default function CollectionPage() {
  const { t } = useStoreText();
  const { products, status } = useCollection();

  return (
    <div className="store-page">
      <StoreHeader variant="site" />
      <main className="home-block collection-page">
        <p className="collection-eyebrow">{t("collection.eyebrow")}</p>
        <h1 className="page-title">{t("collection.title")}</h1>
        <p className="collection-page__lede">
          {t("collection.lede")}
          {status === "ready" && products.length > 0 ? (
            <span> · {t("collection.count", { count: products.length })}</span>
          ) : null}
        </p>

        {status === "error" ? <p className="collection-note" role="alert">{t("collection.error")}</p> : null}
        {status === "ready" && products.length === 0 ? <p className="collection-note">{t("collection.empty")}</p> : null}

        <div className="collection-grid" aria-busy={status === "loading"}>
          {status === "loading"
            ? Array.from({ length: 8 }, (_, index) => <div key={index} className="collection-card is-skeleton" />)
            : products.map((product) => <CollectionCard key={product.id} product={product} />)}
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
