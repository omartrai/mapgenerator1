import { Fragment, useEffect, type ReactNode } from "react";
import { Link } from "@/core/router/router";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT, formatMoney } from "../domain/catalog";
import { BUSINESS, type BusinessField } from "../domain/business";
import { LEGAL_DOCS, LEGAL_SLUGS, type LegalSlug } from "../domain/legal";
import StoreFooter from "./StoreFooter";
import StoreHeader from "./StoreHeader";
import { useStoreText, type StoreTextKey } from "./storeText";

const FIGURES: Record<string, string> = {
  shipping: formatMoney(SHIPPING_FLAT, "MAD"),
  freeFrom: formatMoney(FREE_SHIPPING_THRESHOLD, "MAD"),
};

/** Replaces {{field}} with shop details and [[slug|text]] with links. */
function renderText(text: string): ReactNode[] {
  return text.split(/(\{\{\w+\}\}|\[\[[^\]]+\]\])/g).map((part, index) => {
    const field = /^\{\{(\w+)\}\}$/.exec(part)?.[1];
    if (field) {
      const value = FIGURES[field] ?? (BUSINESS as Record<string, string>)[field as BusinessField] ?? "";
      if (field === "website" && !value) return <Fragment key={index}>{window.location.host}</Fragment>;
      return value ? (
        <Fragment key={index}>{value}</Fragment>
      ) : (
        <mark key={index} className="legal-missing">[à compléter : {field}]</mark>
      );
    }
    const link = /^\[\[([^|\]]+)\|([^\]]+)\]\]$/.exec(part);
    if (link) {
      return (
        <Link key={index} to={`/legal/${link[1]}`}>
          {link[2]}
        </Link>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export default function LegalPage({ slug }: { slug: string }) {
  const { t, language } = useStoreText();
  const doc = LEGAL_DOCS[slug as LegalSlug];

  useEffect(() => {
    if (doc) document.title = `${doc.title} — Noria`;
    window.scrollTo(0, 0);
  }, [doc]);

  return (
    <div className="store-page legal-page">
      <StoreHeader />
      <main className="store-container legal-page__main">
        <nav className="legal-page__tabs" aria-label={t("legal.nav")}>
          {LEGAL_SLUGS.map((entry) => (
            <Link
              key={entry}
              to={`/legal/${entry}`}
              className={`legal-page__tab${entry === slug ? " is-active" : ""}`}
            >
              {t(`legal.${entry}` as StoreTextKey)}
            </Link>
          ))}
        </nav>
        {doc ? (
          <article className="legal-doc" lang="fr" dir="ltr">
            <h1>{doc.title}</h1>
            <p className="legal-doc__updated">Dernière mise à jour : {doc.updated}</p>
            {language !== "fr" ? <p className="legal-doc__lang">{t("legal.frenchOnly")}</p> : null}
            <p className="legal-doc__intro">{renderText(doc.intro)}</p>
            {doc.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.body.map((paragraph, index) => (
                  <p key={index}>{renderText(paragraph)}</p>
                ))}
              </section>
            ))}
          </article>
        ) : (
          <p className="legal-doc">{t("legal.notFound")}</p>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
