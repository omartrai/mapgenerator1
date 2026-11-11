import { useEffect, useMemo } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useRouter } from "@/core/router/router";
import { useCollection } from "../application/useCollection";
import {
  categoriesFor,
  formatCollectionSize,
  matchesCategory,
  sizeArea,
  type CollectionProduct,
} from "../domain/collection";
import CollectionCard from "./CollectionCard";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

const PAGE_SIZE = 12;
const SORTS = ["featured", "priceAsc", "priceDesc"] as const;
type Sort = (typeof SORTS)[number];

/** Page numbers with gaps: 1 … 4 5 6 … 12. */
function pageList(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((n, index) => {
    if (index > 0 && n - sorted[index - 1] > 1) result.push("gap");
    result.push(n);
  });
  return result;
}

const priceIn = (product: CollectionProduct, size: string) =>
  size ? Math.min(...product.variants.filter((v) => v.size === size).map((v) => v.price)) : product.fromPrice;

/**
 * /collection — the shop: ready-made posters from the print partner, with
 * categories, a format filter, sorting and pagination. Filters live in the
 * URL (?cat=&size=&sort=&page=) so a filtered page can be shared.
 */
export default function CollectionPage() {
  const { t } = useStoreText();
  const { search, navigate } = useRouter();
  const { products, status } = useCollection();

  const category = search.get("cat") || "all";
  const size = search.get("size") || "";
  const sort: Sort = SORTS.includes(search.get("sort") as Sort) ? (search.get("sort") as Sort) : "featured";
  const requestedPage = Math.max(1, Number(search.get("page")) || 1);

  const categories = useMemo(() => categoriesFor(products), [products]);
  const sizes = useMemo(
    () => [...new Set(products.flatMap((product) => product.sizes))].sort((a, b) => sizeArea(a) - sizeArea(b)),
    [products],
  );

  const filtered = useMemo(() => {
    const list = products.filter(
      (product) => matchesCategory(product, category) && (!size || product.sizes.includes(size)),
    );
    if (sort === "featured") return list;
    const direction = sort === "priceAsc" ? 1 : -1;
    return [...list].sort((a, b) => (priceIn(a, size) - priceIn(b, size)) * direction);
  }, [products, category, size, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const update = (changes: Record<string, string | number | null>) => {
    const params = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "" || value === "all" || value === "featured" || value === 1) params.delete(key);
      else params.set(key, String(value));
    }
    // Any filter change starts again from the first page.
    if (!("page" in changes)) params.delete("page");
    const query = params.toString();
    navigate(`/collection${query ? `?${query}` : ""}`, { replace: !("page" in changes) });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const categoryLabel = (id: string, label: string, isRule: boolean) =>
    isRule ? t(label as StoreTextKey) : label;
  const hasFilters = category !== "all" || !!size;

  return (
    <div className="store-page">
      <StoreHeader variant="site" />
      <main className="home-block shop">
        <header className="shop__head">
          <p className="collection-eyebrow">{t("collection.eyebrow")}</p>
          <h1 className="page-title">{t("collection.title")}</h1>
          <p className="collection-page__lede">{t("collection.lede")}</p>
        </header>

        {status === "error" ? <p className="collection-note" role="alert">{t("collection.error")}</p> : null}
        {status === "ready" && products.length === 0 ? <p className="collection-note">{t("collection.empty")}</p> : null}

        <div className="shop__layout">
          <aside className="shop__filters" aria-label={t("collection.filters")}>
            <section>
              <h2 id="shop-categories">{t("collection.categories")}</h2>
              <ul className="shop__categories" aria-labelledby="shop-categories">
                <li>
                  <button
                    type="button"
                    className={category === "all" ? "is-active" : ""}
                    aria-pressed={category === "all"}
                    onClick={() => update({ cat: "all" })}
                  >
                    <span>{t("cat.all")}</span>
                    <span className="shop__count">{products.length}</span>
                  </button>
                </li>
                {categories.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={category === entry.id ? "is-active" : ""}
                      aria-pressed={category === entry.id}
                      onClick={() => update({ cat: entry.id })}
                    >
                      <span>{categoryLabel(entry.id, entry.label, entry.isRule)}</span>
                      <span className="shop__count">{entry.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {sizes.length > 1 ? (
              <section>
                <h2 id="shop-formats">{t("collection.formats")}</h2>
                <div className="shop__formats" role="radiogroup" aria-labelledby="shop-formats">
                  {["", ...sizes].map((entry) => (
                    <button
                      key={entry || "all"}
                      type="button"
                      role="radio"
                      aria-checked={size === entry}
                      className={`chip${size === entry ? " is-active" : ""}`}
                      onClick={() => update({ size: entry })}
                    >
                      {entry ? formatCollectionSize(entry) : t("collection.allFormats")}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          <div className="shop__results">
            <div className="shop__toolbar">
              <p className="shop__summary" aria-live="polite">
                {status === "ready" && filtered.length > 0
                  ? t("collection.showing", {
                      from: (page - 1) * PAGE_SIZE + 1,
                      to: Math.min(page * PAGE_SIZE, filtered.length),
                      total: filtered.length,
                    })
                  : null}
              </p>
              <label className="shop__sort">
                <span>{t("collection.sort")}</span>
                <select value={sort} onChange={(event) => update({ sort: event.target.value })}>
                  {SORTS.map((entry) => (
                    <option key={entry} value={entry}>
                      {t(`sort.${entry}` as StoreTextKey)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {status === "ready" && products.length > 0 && filtered.length === 0 ? (
              <div className="shop__empty">
                <p>{t("collection.noResults")}</p>
                {hasFilters ? (
                  <button type="button" className="configurator__reset" onClick={() => update({ cat: "all", size: "" })}>
                    {t("collection.reset")}
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="collection-grid shop__grid" aria-busy={status === "loading"}>
              {status === "loading"
                ? Array.from({ length: 6 }, (_, index) => <div key={index} className="collection-card is-skeleton" />)
                : shown.map((product) => <CollectionCard key={product.id} product={product} size={size} />)}
            </div>

            {pageCount > 1 ? (
              <nav className="pagination" aria-label={t("page.label")}>
                <button
                  type="button"
                  className="pagination__step"
                  disabled={page === 1}
                  onClick={() => update({ page: page - 1 })}
                >
                  <LuChevronLeft className="rtl-flip" aria-hidden="true" /> {t("page.prev")}
                </button>
                <ol>
                  {pageList(page, pageCount).map((entry, index) =>
                    entry === "gap" ? (
                      <li key={`gap-${index}`} className="pagination__gap" aria-hidden="true">…</li>
                    ) : (
                      <li key={entry}>
                        <button
                          type="button"
                          className={entry === page ? "is-active" : ""}
                          aria-current={entry === page ? "page" : undefined}
                          aria-label={t("page.go", { n: entry })}
                          onClick={() => update({ page: entry })}
                        >
                          {entry}
                        </button>
                      </li>
                    ),
                  )}
                </ol>
                <button
                  type="button"
                  className="pagination__step"
                  disabled={page === pageCount}
                  onClick={() => update({ page: page + 1 })}
                >
                  {t("page.next")} <LuChevronRight className="rtl-flip" aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
