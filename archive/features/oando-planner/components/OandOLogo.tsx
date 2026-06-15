export function OandOLogo({ className = "", width = 140, variant = "dark" }: { className?: string; width?: number; variant?: "dark" | "light" | "orange" }) {
  const textColor = variant === "light" ? "var(--color-white-50)" : variant === "orange" ? "var(--color-accent)" : "var(--color-dark-midnight-blue-500)";
  const ampColor = "var(--color-accent)";
  const height = Math.round(width * 0.28);

  return (
    <svg
      viewBox="0 0 500 140"
      width={width}
      height={height}
      fill="none"
      className={className}
      aria-label="One&Only"
    >
      <g>
        <text x="0" y="95" fontFamily="var(--font-display)" fontWeight="700" fontSize="88" letterSpacing="-2" fill={textColor}>
          One
        </text>
        <text x="175" y="95" fontFamily="var(--font-display)" fontWeight="700" fontSize="88" letterSpacing="-2" fill={ampColor}>
          &amp;
        </text>
        <text x="230" y="95" fontFamily="var(--font-display)" fontWeight="700" fontSize="88" letterSpacing="-2" fill={textColor}>
          Only
        </text>
        <text x="0" y="130" fontFamily="var(--font-display)" fontWeight="400" fontSize="24" letterSpacing="8" fill={textColor} opacity="0.6">
          FURNITURE
        </text>
      </g>
    </svg>
  );
}

export function OandOIcon({ size = 32, variant = "brand" }: { size?: number; variant?: "brand" | "white" }) {
  const bg = variant === "white" ? "var(--color-white-50)" : "var(--color-dark-midnight-blue-500)";
  const fg = variant === "white" ? "var(--color-dark-midnight-blue-500)" : "var(--color-white-50)";
  const accent = "var(--color-accent)";

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={bg} />
      <text x="5" y="22" fontFamily="var(--font-display)" fontWeight="800" fontSize="16" fill={fg}>
        O
      </text>
      <text x="14.5" y="22" fontFamily="var(--font-display)" fontWeight="800" fontSize="16" fill={accent}>
        &amp;
      </text>
      <text x="22" y="22" fontFamily="var(--font-display)" fontWeight="800" fontSize="14" fill={fg}>
        O
      </text>
    </svg>
  );
}
