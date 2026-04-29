type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function Logo({ className = "", width = 109, height = 107 }: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 109 107"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Simnetiq"
      className={className}
      style={{ color: "var(--color-text)" }}
    >
      <line x1="53" y1="5.65685" x2="5.65685" y2="53" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <line x1="92" y1="43.6569" x2="44.6569" y2="91" stroke="#B2451E" strokeWidth="8" strokeLinecap="round" />
      <line x1="105" y1="55.6569" x2="57.6569" y2="103" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <line x1="66" y1="18.6569" x2="5.65685" y2="79" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <line x1="79" y1="30.6569" x2="8.65685" y2="101" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
