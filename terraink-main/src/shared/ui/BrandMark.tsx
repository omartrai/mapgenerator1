/** Map-pin logo in the brand red. */
export default function BrandMark({ className = "store-brand__logo" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 2.5c-6.1 0-11 4.8-11 10.8 0 7.6 9 15.3 10.2 16.3.5.4 1.1.4 1.6 0C18 28.6 27 20.9 27 13.3 27 7.3 22.1 2.5 16 2.5Z"
        fill="var(--s-accent, #e4572e)"
      />
      <path
        d="M10.5 18.5v-7.2l3.6 3.4 1.9-3.7 1.9 3.7 3.6-3.4v7.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
