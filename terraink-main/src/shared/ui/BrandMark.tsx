/** Noria mark: a rounded tile crossed by two converging roads. Uses currentColor. */
export default function BrandMark({ className = "store-brand__logo" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="26" height="26" rx="5.8" strokeWidth="2.4" />
      <path d="M11.8 3.6 18.6 16.6Q19.6 18.7 21.8 19.8L28.6 23.4" strokeWidth="1.9" />
      <path d="M3.6 15.4C9 16.2 14 18.4 19.4 21.3L26.6 26.4" strokeWidth="1.9" />
    </svg>
  );
}

/** The lowercase "noria" wordmark, drawn as strokes so it needs no extra font. */
export function BrandWordmark({ className = "store-brand__word" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 -4.2 39 14.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      role="img"
      aria-label="noria"
    >
      <path d="M.95 9.05V.95M.95 4.9C.95 2.4 2.6.95 4.7.95S8.45 2.4 8.45 4.9v4.15" />
      <circle cx="15.2" cy="5" r="4.05" />
      <path d="M21.3 9.05V.95M21.3 5c0-2.5 1.5-4.05 3.8-4.05" />
      <path d="M27.4 9.05V.95" />
      <circle cx="27.4" cy="-2.9" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="33.95" cy="5" r="4.05" />
      <path d="M38 9.05V.95" />
    </svg>
  );
}
