export function CardArrow({ external = false }: { external?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="rtl-mirror"
    >
      <path d={external ? "M7 17 17 7M7 7h10v10" : "M4 12h15m-6-6 6 6-6 6"} />
    </svg>
  );
}
