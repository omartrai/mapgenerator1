import { useEffect, useRef, useState } from "react";
import {
  useLanguage,
  type AppLanguage,
} from "@/shared/i18n/LanguageContext";

const languages: AppLanguage[] = ["en", "fr", "ar"];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const languageNames = {
    en: t("language.english"),
    fr: t("language.french"),
    ar: t("language.arabic"),
  };

  return (
    <div className="language-switcher" ref={containerRef}>
      <button
        type="button"
        className="language-switcher__trigger"
        aria-label={t("language.label")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{language.toUpperCase()}</span>
        <svg viewBox="0 0 12 8" aria-hidden="true">
          <path d="m2 2 4 4 4-4" />
        </svg>
      </button>

      {isOpen ? (
        <div className="language-switcher__menu" role="menu">
          {languages.map((code) => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={language === code}
              className={`language-switcher__option${language === code ? " is-active" : ""}`}
              key={code}
              onClick={() => {
                setLanguage(code);
                setIsOpen(false);
              }}
            >
              <span className="language-switcher__code">{code.toUpperCase()}</span>
              <span>{languageNames[code]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
