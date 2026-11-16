import { useId } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { SPORT_LAYOUTS } from "@/features/poster/domain/posterLayout";
import { useActivityPoster, type SportDesign } from "@/features/routes/application/useActivityPoster";
import { useLanguage, type TranslationKey } from "@/shared/i18n/LanguageContext";

const ROUTE = "M14 52 C18 40 26 46 30 36 S40 30 38 22 S48 18 46 12";

/** Small picture of each design (60 × 80). */
function Thumb({ id }: { id: SportDesign }) {
  if (id === "race") {
    return (
      <svg viewBox="0 0 60 80" aria-hidden="true">
        <rect width="60" height="80" fill="#fff" />
        <rect x="14" y="7" width="32" height="5" rx="1" fill="#1a1a1a" />
        <text x="30" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a1a1a" opacity="0.08">2026</text>
        <rect x="19" y="18" width="22" height="3" rx="1" fill="#d62f2f" />
        <rect y="30" width="60" height="38" fill="#eef3f6" />
        <path d="M0 52 Q20 46 34 56 T60 50 V68 H0Z" fill="#cfe2f0" />
        <path d="M10 46 l6 4 l5 -3 l6 5 l7 -2 l6 6 l8 -3" fill="none" stroke="#d62f2f" strokeWidth="2.2" strokeLinejoin="round" />
        {[10, 26, 42].map((x) => (
          <rect key={x} x={x} y="72" width="9" height="3" rx="1" fill="#1a1a1a" />
        ))}
      </svg>
    );
  }
  if (id === "bold") {
    return (
      <svg viewBox="0 0 60 80" aria-hidden="true">
        <rect width="60" height="80" fill="#f3ece1" />
        <rect width="60" height="53" fill="#c9553c" />
        <path d="M8 20 H52 M8 34 H52 M20 4 V50 M40 4 V50" stroke="#dd7b63" strokeWidth="1.2" />
        <path d={ROUTE} fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
        <text x="5" y="72" fontSize="15" fontWeight="800" fill="#c4472f">4,37</text>
        <rect x="38" y="61" width="16" height="3" rx="1" fill="#c4472f" />
        <rect x="38" y="67" width="11" height="2" rx="1" fill="#c4472f" opacity="0.6" />
      </svg>
    );
  }
  if (id === "photorun") {
    return (
      <svg viewBox="0 0 60 80" aria-hidden="true">
        <defs>
          <linearGradient id="pr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7d838a" />
            <stop offset="1" stopColor="#2b2e33" />
          </linearGradient>
        </defs>
        <rect width="60" height="80" fill="url(#pr)" />
        <ellipse cx="30" cy="58" rx="7" ry="16" fill="#202326" opacity="0.6" />
        <rect x="5" y="5" width="14" height="3" rx="1" fill="#fff" />
        <rect x="41" y="5" width="14" height="3" rx="1" fill="#fff" />
        <path d="M10 26 h10 v-5 h14 v6 h8 v-4 h8" fill="none" stroke="#fff" strokeWidth="1.8" />
        <text x="30" y="52" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" opacity="0.8">3:23</text>
        <rect x="5" y="70" width="12" height="3" rx="1" fill="#fff" />
        <rect x="43" y="70" width="12" height="3" rx="1" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 80" aria-hidden="true">
      <rect width="60" height="80" fill="#1b1b1b" />
      <rect x="16" y="6" width="28" height="4" rx="1" fill="#e9e9e9" />
      <rect x="27" y="12" width="6" height="1.5" fill="#e8622c" />
      <rect x="6" y="16" width="48" height="36" fill="#262626" />
      <path d={ROUTE} transform="translate(0 2) scale(1 0.8)" fill="none" stroke="#e8622c" strokeWidth="1.8" />
      <path d="M6 62 L14 58 L22 60 L30 55 L38 59 L46 56 L54 60 V64 H6Z" fill="#e8622c" />
      {[9, 22, 35, 48].map((x) => (
        <rect key={x} x={x - 3} y="69" width="8" height="3" rx="1" fill="#e9e9e9" />
      ))}
    </svg>
  );
}

/** Theme step of a sport poster: which design. */
export default function SportDesignPicker() {
  const { t } = useLanguage();
  const { state } = usePosterContext();
  const { applyDesign } = useActivityPoster();
  const uid = useId();
  const current = state.form.posterLayout;

  return (
    <section className="layout-shape" aria-labelledby={`${uid}-title`}>
      <h3 id={`${uid}-title`} className="style-presets__title">
        {t("sport.designs")}
      </h3>
      <div className="sport-designs">
        {SPORT_LAYOUTS.map((id) => (
          <label key={id} className="sport-designs__option">
            <input
              type="radio"
              name={`${uid}-design`}
              value={id}
              checked={current === id}
              onChange={() => applyDesign(id)}
            />
            <span className="sport-designs__thumb">
              <Thumb id={id} />
            </span>
            <span className="layout-picker__name">{t(`sport.design.${id}` as TranslationKey)}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
