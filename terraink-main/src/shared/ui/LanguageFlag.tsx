/**
 * Small flag for the language menu, drawn as SVG (emoji flags do not show
 * on Windows): United Kingdom for English, France for French, Morocco for
 * Arabic.
 */
export default function LanguageFlag({ code }: { code: string }) {
  const common = { className: "lang-flag", viewBox: "0 0 30 20", "aria-hidden": true as const };
  if (code === "fr") {
    return (
      <svg {...common}>
        <rect width="10" height="20" fill="#002654" />
        <rect x="10" width="10" height="20" fill="#fff" />
        <rect x="20" width="10" height="20" fill="#CE1126" />
      </svg>
    );
  }
  if (code === "ar") {
    // Morocco: red field, green five-pointed star outline (pentagram).
    const points = Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      return `${(15 + 5.6 * Math.cos(a)).toFixed(2)},${(10.6 + 5.6 * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#C1272D" />
        <polygon points={points} fill="none" stroke="#006233" strokeWidth="1.2" strokeLinejoin="miter" />
      </svg>
    );
  }
  // United Kingdom
  return (
    <svg {...common}>
      <clipPath id="lang-flag-uk">
        <rect width="30" height="20" />
      </clipPath>
      <g clipPath="url(#lang-flag-uk)">
        <rect width="30" height="20" fill="#012169" />
        <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" />
        <path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" strokeWidth="1.6" />
        <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
        <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
      </g>
    </svg>
  );
}
